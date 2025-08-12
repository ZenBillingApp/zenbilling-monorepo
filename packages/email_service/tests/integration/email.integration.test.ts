import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import emailRoutes from '../../src/routes/email.routes';
import { EmailService } from '../../src/services/email.service';
import * as SibApiV3Sdk from '@getbrevo/brevo';

// Mock du SDK Brevo
jest.mock('@getbrevo/brevo');

// Mock du logger
jest.mock('@zenbilling/shared/src/utils/logger', () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

describe('Email Integration Tests', () => {
    let app: express.Application;
    let mockTransactionalEmailsApi: any;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock de l'API TransactionalEmailsApi
        mockTransactionalEmailsApi = {
            setApiKey: jest.fn(),
            sendTransacEmail: jest.fn(),
        };
        
        (SibApiV3Sdk.TransactionalEmailsApi as jest.MockedClass<any>).mockImplementation(() => mockTransactionalEmailsApi);
        
        // Mock de SendSmtpEmail
        (SibApiV3Sdk.SendSmtpEmail as jest.MockedClass<any>).mockImplementation(function() {
            return {
                subject: '',
                htmlContent: '',
                sender: {},
                to: [],
                templateId: undefined,
                params: {},
                attachment: [],
            };
        });

        // Mock de l'API key
        (SibApiV3Sdk.TransactionalEmailsApiApiKeys as any).apiKey = 'apiKey';
        
        // Configuration de l'application Express
        app = express();
        app.use(express.json({ limit: '10mb' }));
        app.use('/email', emailRoutes);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Intégration complète - Email avec pièce jointe', () => {
        it('devrait envoyer un email avec pièce jointe PDF', async () => {
            const mockResponse = {
                response: {} as any,
                body: { messageId: 'attachment-integration-id' }
            };
            
            mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue(mockResponse);

            const pdfContent = Buffer.from('Contenu PDF de test').toString('base64');
            
            const attachmentData = {
                to: ['client@example.com'],
                subject: 'Facture en pièce jointe',
                html: '<h1>Votre facture est en pièce jointe</h1><p>Merci de votre confiance.</p>',
                attachment: pdfContent,
                filename: 'facture-2024-001.pdf'
            };

            const response = await request(app)
                .post('/email/send-with-attachment')
                .send(attachmentData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(mockTransactionalEmailsApi.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: 'Facture en pièce jointe',
                    htmlContent: '<h1>Votre facture est en pièce jointe</h1><p>Merci de votre confiance.</p>',
                    sender: { name: 'ZenBilling', email: 'noreply@zenbilling.com' },
                    to: [{ email: 'client@example.com' }],
                    attachment: [
                        {
                            content: pdfContent,
                            name: 'facture-2024-001.pdf'
                        }
                    ]
                })
            );
        });

        it('devrait gérer les paramètres manquants pour l\'attachement', async () => {
            const incompleteData = {
                to: ['client@example.com'],
                subject: 'Test incomplet'
                // html et attachment manquants
            };

            const response = await request(app)
                .post('/email/send-with-attachment')
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Paramètres manquants');
            expect(mockTransactionalEmailsApi.sendTransacEmail).not.toHaveBeenCalled();
        });

        it('devrait gérer un destinataire unique (string)', async () => {
            const mockResponse = {
                response: {} as any,
                body: { messageId: 'single-recipient-attachment-id' }
            };
            
            mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue(mockResponse);

            const attachmentData = {
                to: 'single@example.com', // String au lieu d'array
                subject: 'Email pour destinataire unique',
                html: '<h1>Email avec pièce jointe</h1>',
                attachment: Buffer.from('Contenu simple').toString('base64'),
                filename: 'simple-document.txt'
            };

            const response = await request(app)
                .post('/email/send-with-attachment')
                .send(attachmentData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(mockTransactionalEmailsApi.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: [{ email: 'single@example.com' }]
                })
            );
        });
    });
});
