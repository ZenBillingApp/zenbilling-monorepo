import { Request, Response } from "express";
import { PdfService } from "../services/pdf.service";
import { logger } from "@zenbilling/shared";

export class PdfController {
    static async generateInvoicePdf(req: Request, res: Response) {
        try {
            const { invoice, organization } = req.body;

            if (!invoice || !organization) {
                logger.error(
                    { invoice: !!invoice, organization: !!organization },
                    "Données manquantes pour la génération du PDF"
                );
                return res.status(400).json({
                    error: "Les données de facture et de l'organisation sont requises",
                });
            }

            logger.info(
                { invoice_id: invoice.invoice_id },
                "Génération du PDF de facture"
            );

            const pdfBuffer = await PdfService.generateInvoicePdf(
                invoice,
                organization
            );

            // Configurer les en-têtes pour le PDF
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Length", pdfBuffer.length.toString());

            logger.info(
                {
                    invoice_id: invoice.invoice_id,
                    buffer_size: pdfBuffer.length,
                },
                "PDF généré avec succès"
            );

            return res.send(pdfBuffer);
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la génération du PDF de facture"
            );

            if (error instanceof Error) {
                return res.status(500).json({
                    error: "Erreur lors de la génération du PDF",
                    message: error.message,
                });
            }

            return res.status(500).json({
                error: "Erreur interne du serveur",
            });
        }
    }

    static async generateQuotePdf(req: Request, res: Response) {
        try {
            const { quote, organization } = req.body;

            if (!quote || !organization) {
                logger.error(
                    { quote: !!quote, organization: !!organization },
                    "Données manquantes pour la génération du PDF"
                );
                return res.status(400).json({
                    error: "Les données de devis et de l'organisation sont requises",
                });
            }

            logger.info(
                { quote_id: quote.quote_id },
                "Génération du PDF de devis"
            );

            const pdfBuffer = await PdfService.generateQuotePdf(
                quote,
                organization
            );

            // Configurer les en-têtes pour le PDF
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Length", pdfBuffer.length.toString());

            logger.info(
                {
                    quote_id: quote.quote_id,
                    buffer_size: pdfBuffer.length,
                },
                "PDF généré avec succès"
            );

            return res.send(pdfBuffer);
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la génération du PDF de devis"
            );

            if (error instanceof Error) {
                return res.status(500).json({
                    error: "Erreur lors de la génération du PDF",
                    message: error.message,
                });
            }

            return res.status(500).json({
                error: "Erreur interne du serveur",
            });
        }
    }
}
