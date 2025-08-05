import * as SibApiV3Sdk from "@getbrevo/brevo";
import { IncomingMessage } from "http";
import logger from "@zenbilling/shared/src/utils/logger";
import { CustomError } from "@zenbilling/shared/src/utils/customError";

export class EmailService {
    private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

    constructor() {
        logger.info("Initialisation du service email");
        this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            logger.error(
                "BREVO_API_KEY manquante dans les variables d'environnement"
            );
            throw new CustomError(
                "BREVO_API_KEY manquante dans les variables d'environnement",
                500
            );
        }

        this.apiInstance.setApiKey(
            SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
            apiKey
        );
        logger.info("Service email initialisé avec succès");
    }

    async sendEmail(
        to: string[],
        subject: string,
        htmlContent: string,
        sender: { name: string; email: string } = {
            name: "ZenBilling",
            email: "noreply@zenbilling.com",
        }
    ): Promise<{
        response: IncomingMessage;
        body: SibApiV3Sdk.CreateSmtpEmail;
    }> {
        logger.info({ to, subject }, "Envoi d'email standard");
        try {
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = htmlContent;
            sendSmtpEmail.sender = sender;
            sendSmtpEmail.to = to.map((email) => ({ email }));

            const result = await this.apiInstance.sendTransacEmail(
                sendSmtpEmail
            );
            logger.info({ to, subject }, "Email envoyé avec succès");
            return result;
        } catch (error) {
            logger.error(
                { error, to, subject },
                "Erreur lors de l'envoi de l'email"
            );
            throw new CustomError("Erreur lors de l'envoi de l'email", 500);
        }
    }

    async sendTemplateEmail(
        to: string[],
        templateId: number,
        params: { [key: string]: string },
        sender: { name: string; email: string } = {
            name: "ZenBilling",
            email: "noreply@zenbilling.com",
        }
    ): Promise<{
        response: IncomingMessage;
        body: SibApiV3Sdk.CreateSmtpEmail;
    }> {
        logger.info({ to, templateId }, "Envoi d'email avec template");
        try {
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            sendSmtpEmail.templateId = templateId;
            sendSmtpEmail.sender = sender;
            sendSmtpEmail.to = to.map((email) => ({ email }));
            sendSmtpEmail.params = params;

            const result = await this.apiInstance.sendTransacEmail(
                sendSmtpEmail
            );
            logger.info(
                { to, templateId },
                "Email avec template envoyé avec succès"
            );
            return result;
        } catch (error) {
            logger.error(
                { error, to, templateId },
                "Erreur lors de l'envoi de l'email avec template"
            );
            throw new CustomError(
                "Erreur lors de l'envoi de l'email avec template",
                500
            );
        }
    }

    async sendEmailWithAttachment(
        to: string[],
        subject: string,
        htmlContent: string,
        attachment: Buffer,
        filename: string,
        sender: { name: string; email: string } = {
            name: "ZenBilling",
            email: "noreply@zenbilling.com",
        }
    ): Promise<{
        response: IncomingMessage;
        body: SibApiV3Sdk.CreateSmtpEmail;
    }> {
        logger.info(
            { to, subject, filename },
            "Envoi d'email avec pièce jointe"
        );
        try {
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = htmlContent;
            sendSmtpEmail.sender = sender;
            sendSmtpEmail.to = to.map((email) => ({ email }));

            sendSmtpEmail.attachment = [
                {
                    content: attachment.toString("base64"),
                    name: filename,
                },
            ];

            const result = await this.apiInstance.sendTransacEmail(
                sendSmtpEmail
            );
            logger.info(
                { to, subject, filename },
                "Email avec pièce jointe envoyé avec succès"
            );
            return result;
        } catch (error) {
            logger.error(
                { error, to, subject, filename },
                "Erreur lors de l'envoi de l'email avec pièce jointe"
            );
            throw new CustomError(
                "Erreur lors de l'envoi de l'email avec pièce jointe",
                500
            );
        }
    }
}

export default new EmailService();
