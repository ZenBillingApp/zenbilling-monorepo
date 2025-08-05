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
        const { to, subject, text, html, attachment } = req.body;
        const emailService = new EmailService();
        const result = await emailService.sendEmailWithAttachment(
            to,
            subject,
            text,
            html,
            attachment
        );
        return ApiResponse.success(
            res,
            200,
            "Email envoyé avec succès",
            result
        );
    }
}
