import { Request, Response } from "express";
import { EmailService } from "../services/email.service";
import { ApiResponse } from "@zenbilling/shared/src/utils/apiResponse";

export class EmailController {
    public static async sendEmail(req: Request, res: Response) {
        const { to, subject, text, html } = req.body;
        const emailService = new EmailService();
        const result = await emailService.sendEmail(to, subject, text, html);
        return ApiResponse.success(
            res,
            200,
            "Email envoyé avec succès",
            result
        );
    }

    public static async sendTemplateEmail(req: Request, res: Response) {
        const { to, subject, templateId, params } = req.body;
        const emailService = new EmailService();
        const result = await emailService.sendTemplateEmail(
            to,
            subject,
            templateId,
            params
        );
        return ApiResponse.success(
            res,
            200,
            "Email envoyé avec succès",
            result
        );
    }

    public static async sendEmailWithAttachment(req: Request, res: Response) {
        try {
            const { to, subject, html, attachment, filename } = req.body;
            
            if (!to || !subject || !html || !attachment) {
                return ApiResponse.error(
                    res,
                    400,
                    "Paramètres manquants: to, subject, html et attachment sont requis"
                );
            }

            const emailService = new EmailService();
            
            // Convertir le Buffer en base64 si nécessaire pour l'API Brevo
            let attachmentBuffer: Buffer;
            if (Buffer.isBuffer(attachment)) {
                attachmentBuffer = attachment;
            } else if (typeof attachment === 'string') {
                attachmentBuffer = Buffer.from(attachment, 'base64');
            } else {
                throw new Error("Format de pièce jointe non supporté");
            }

            const result = await emailService.sendEmailWithAttachment(
                Array.isArray(to) ? to : [to],
                subject,
                html,
                attachmentBuffer,
                filename || 'document.pdf'
            );
            
            return ApiResponse.success(
                res,
                200,
                "Email avec pièce jointe envoyé avec succès",
                result
            );
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'email:", error);
            return ApiResponse.error(
                res,
                500,
                "Erreur lors de l'envoi de l'email avec pièce jointe"
            );
        }
    }
}
