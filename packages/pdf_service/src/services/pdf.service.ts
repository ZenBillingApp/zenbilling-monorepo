import puppeteer from "puppeteer";
import * as handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";
import logger from "@zenbilling/shared/src/utils/logger";
import { ICompany } from "@zenbilling/shared/src/interfaces/Company.interface";
import { IInvoice } from "@zenbilling/shared/src/interfaces/Invoice.interface";
import { vatRateToNumber } from "@zenbilling/shared/src/interfaces/Product.interface";
import { IQuote } from "@zenbilling/shared/src/interfaces/Quote.interface";

interface HandlebarsContext {
    [key: string]: any;
}

export class PdfService {
    private static templatePath = path.join(
        __dirname,
        "../templates/invoice.template.html"
    );
    private static quoteTemplatePath = path.join(
        __dirname,
        "../templates/quote.template.html"
    );

    private static registerHelpers() {
        logger.debug("Enregistrement des helpers Handlebars");
        handlebars.registerHelper("formatDate", function (date: Date) {
            return new Date(date).toLocaleDateString("fr-FR");
        });

        handlebars.registerHelper("formatPrice", function (price: number) {
            return price.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        });

        handlebars.registerHelper(
            "if_eq",
            function (
                this: HandlebarsContext,
                a: any,
                b: any,
                opts: handlebars.HelperOptions
            ) {
                if (a === b) {
                    return opts.fn(this);
                }
                return opts.inverse?.(this) || "";
            }
        );

        handlebars.registerHelper(
            "if_true",
            function (
                this: HandlebarsContext,
                a: any,
                opts: handlebars.HelperOptions
            ) {
                if (a) {
                    return opts.fn(this);
                }
                return opts.inverse?.(this) || "";
            }
        );

        handlebars.registerHelper(
            "if_false",
            function (
                this: HandlebarsContext,
                a: any,
                opts: handlebars.HelperOptions
            ) {
                if (!a) {
                    return opts.fn(this);
                }
                return opts.inverse?.(this) || "";
            }
        );

        handlebars.registerHelper(
            "if_not_empty",
            function (
                this: HandlebarsContext,
                a: any,
                opts: handlebars.HelperOptions
            ) {
                if (a && a !== "") {
                    return opts.fn(this);
                }
                return opts.inverse?.(this) || "";
            }
        );

        handlebars.registerHelper(
            "if_not_null",
            function (
                this: HandlebarsContext,
                a: any,
                opts: handlebars.HelperOptions
            ) {
                if (a !== null && a !== undefined) {
                    return opts.fn(this);
                }
                return opts.inverse?.(this) || "";
            }
        );

        handlebars.registerHelper("getItemName", function (item: any) {
            return item.product ? item.product.name : item.name;
        });

        handlebars.registerHelper("getItemDescription", function (item: any) {
            const description = item.product
                ? item.product.description
                : item.description;
            return description || "";
        });

        handlebars.registerHelper("getItemUnit", function (item: any) {
            return item.product ? item.product.unit : item.unit;
        });

        logger.debug("Helpers Handlebars enregistrés avec succès");
    }

    public static async generateInvoicePdf(
        invoice: IInvoice,
        company: ICompany
    ): Promise<Buffer> {
        logger.info(
            { invoice_id: invoice.invoice_id },
            "Début de la génération du PDF de facture"
        );

        if (!invoice) {
            logger.warn("Facture non trouvée");
            throw new Error("Facture non trouvée");
        }

        logger.debug(
            { invoice_id: invoice.invoice_id },
            "Préparation des données pour le template"
        );
        // Préparer les données pour le template
        const templateData = {
            invoice: {
                ...invoice,
                amount_excluding_tax: Number(invoice.amount_excluding_tax),
                tax: Number(invoice.tax),
                amount_including_tax: Number(invoice.amount_including_tax),
            },
            company: company,
            customer: {
                ...invoice.customer,
                ...(invoice.customer?.individual || {}),
                ...(invoice.customer?.business || {}),
            },
            items: invoice.items?.map((item) => ({
                ...item,
                name: item.product ? item.product.name : item.name,
                description: item.product
                    ? item.product.description
                    : item.description,
                unit_price_excluding_tax: Number(item.unit_price_excluding_tax),
                total_excluding_tax:
                    Number(item.quantity) *
                    Number(item.unit_price_excluding_tax),
                vat_rate: vatRateToNumber(item.vat_rate).toFixed(2),
            })),
            customer_tva_applicable: invoice.customer?.business?.tva_applicable,
            customer_tva_intra: invoice.customer?.business?.tva_intra,
        };

        try {
            logger.debug(
                { invoice_id: invoice.invoice_id },
                "Compilation du template"
            );
            const templateHtml = fs.readFileSync(this.templatePath, "utf-8");
            this.registerHelpers();
            const template = handlebars.compile(templateHtml);
            const html = template(templateData);

            logger.debug(
                { invoice_id: invoice.invoice_id },
                "Lancement de Puppeteer"
            );
            const browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });

            const page = await browser.newPage();
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });

            logger.debug(
                { invoice_id: invoice.invoice_id },
                "Génération du PDF"
            );
            await page.setContent(html, {
                waitUntil: ["networkidle0"],
                timeout: 30000,
            });

            await page.emulateMediaType("screen");

            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: "<span></span>",
                footerTemplate: `
          <div style="width: 100%; font-size: 10px; padding: 10px 20px; color: #666; text-align: center;">
            ${company.name} - ${company.address}, ${company.postal_code} ${
                    company.city
                }
            <br>
            SIRET: ${company.siret || "N/A"} - TVA Intracommunautaire: ${
                    company.tva_intra || "N/A"
                }
            <br>
            Page <span class="pageNumber"></span> sur <span class="totalPages"></span>
          </div>
        `,
            });

            await browser.close();
            logger.info(
                { invoice_id: invoice.invoice_id },
                "PDF de facture généré avec succès"
            );
            return Buffer.from(pdfBuffer);
        } catch (error) {
            logger.error(
                { error, invoice_id: invoice.invoice_id },
                "Erreur lors de la génération du PDF de facture"
            );
            throw error;
        }
    }

    public static async generateQuotePdf(
        quote: IQuote,
        company: ICompany
    ): Promise<Buffer> {
        logger.info(
            { quote_id: quote.quote_id },
            "Début de la génération du PDF de devis"
        );

        if (!quote) {
            logger.warn("Devis non trouvé");
            throw new Error("Devis non trouvé");
        }

        logger.debug(
            { quote_id: quote.quote_id },
            "Préparation des données pour le template"
        );
        const templateData = {
            quote: {
                ...quote,
                amount_excluding_tax: Number(quote.amount_excluding_tax),
                tax: Number(quote.tax),
                amount_including_tax: Number(quote.amount_including_tax),
            },
            company: company,
            customer: {
                ...quote.customer,
                ...(quote.customer?.individual || {}),
                ...(quote.customer?.business || {}),
            },
            items: quote.items?.map((item) => ({
                ...item,
                name: item.product ? item.product.name : item.name,
                description: item.product
                    ? item.product.description
                    : item.description,
                unit_price_excluding_tax: Number(item.unit_price_excluding_tax),
                total_excluding_tax:
                    Number(item.quantity) *
                    Number(item.unit_price_excluding_tax),
                vat_rate: vatRateToNumber(item.vat_rate).toFixed(2),
            })),
            customer_tva_applicable: quote.customer?.business?.tva_applicable,
            customer_tva_intra: quote.customer?.business?.tva_intra,
        };

        try {
            logger.debug(
                { quote_id: quote.quote_id },
                "Compilation du template"
            );
            const templateHtml = fs.readFileSync(
                this.quoteTemplatePath,
                "utf-8"
            );
            this.registerHelpers();
            const template = handlebars.compile(templateHtml);
            const html = template(templateData);

            logger.debug(
                { quote_id: quote.quote_id },
                "Lancement de Puppeteer"
            );
            const browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });

            const page = await browser.newPage();
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });

            logger.debug({ quote_id: quote.quote_id }, "Génération du PDF");
            await page.setContent(html, {
                waitUntil: ["networkidle0"],
                timeout: 30000,
            });

            await page.emulateMediaType("screen");

            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: "<span></span>",
                footerTemplate: `
          <div style="width: 100%; font-size: 10px; padding: 10px 20px; color: #666; text-align: center;">
            ${company.name} - ${company.address}, ${company.postal_code} ${
                    company.city
                }
            <br>
            SIRET: ${company.siret || "N/A"} - TVA Intracommunautaire: ${
                    company.tva_intra || "N/A"
                }
            <br>
            Page <span class="pageNumber"></span> sur <span class="totalPages"></span>
          </div>
        `,
            });

            await browser.close();
            logger.info(
                { quote_id: quote.quote_id },
                "PDF de devis généré avec succès"
            );
            return Buffer.from(pdfBuffer);
        } catch (error) {
            console.log(error);
            logger.error(
                { error, quote_id: quote.quote_id },
                "Erreur lors de la génération du PDF de devis"
            );
            throw error;
        }
    }
}
