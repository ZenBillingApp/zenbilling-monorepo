import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EmailService } from '../../src/services/email.service';
import * as SibApiV3Sdk from '@getbrevo/brevo';
import { CustomError } from '@zenbilling/shared/src/utils/customError';

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

describe('EmailService', () => {
    let emailService: EmailService;
    let mockTransactionalEmailsApi: any;

    beforeEach(() => {
        // Reset des mocks
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
        
        emailService = new EmailService();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        it('devrait initialiser le service avec succès quand BREVO_API_KEY est définie', () => {
            expect(emailService).toBeInstanceOf(EmailService);
            expect(mockTransactionalEmailsApi.setApiKey).toHaveBeenCalledWith('apiKey', 'test-api-key-12345');
        });

        it('devrait lever une erreur quand BREVO_API_KEY est manquante', () => {
            const originalEnv = process.env.BREVO_API_KEY;
            delete process.env.BREVO_API_KEY;
            
            expect(() => new EmailService()).toThrow(CustomError);
            expect(() => new EmailService()).toThrow('BREVO_API_KEY manquante dans les variables d\'environnement');
            
            process.env.BREVO_API_KEY = originalEnv;
        });
    });

    describe('sendEmail', () => {
        it('devrait envoyer un email avec succès', async () => {
            const mockResponse = {
                response: {} as any,
                body: { messageId: 'test-message-id' }
            };
            
            mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue(mockResponse);

            const to = ['test@example.com'];
            const subject = 'Test Subject';
            const htmlContent = '<h1>Test Content</h1>';
            const sender = { name: 'Test Sender', email: 'sender@test.com' };

            const result = await emailService.sendEmail(to, subject, htmlContent, sender);

            expect(result).toEqual(mockResponse);
            expect(mockTransactionalEmailsApi.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: 'Test Subject',
                    htmlContent: '<h1>Test Content</h1>',
                    sender: { name: 'Test Sender', email: 'sender@test.com' },
                    to: [{ email: 'test@example.com' }]
                })
            );
        });

        it('devrait utiliser les valeurs par défaut pour le sender', async () => {
            const mockResponse = {
                response: {} as any,
                body: { messageId: 'test-message-id' }
            };
            
            mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue(mockResponse);

            const to = ['test@example.com'];
            const subject = 'Test Subject';
            const htmlContent = '<h1>Test Content</h1>';

            await emailService.sendEmail(to, subject, htmlContent);

            expect(mockTransactionalEmailsApi.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    sender: { name: 'ZenBilling', email: 'noreply@zenbilling.com' }
                })
            );
        });

        it('devrait gérer plusieurs destinataires', async () => {
            const mockResponse = {
                response: {} as any,
                body: { messageId: 'test-message-id' }
            };
            
            mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue(mockResponse);

            const to = ['test1@example.com', 'test2@example.com'];
            const subject = 'Test Subject';
            const htmlContent = '<h1>Test Content</h1>';

            await emailService.sendEmail(to, subject, htmlContent);

            expect(mockTransactionalEmailsApi.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: [
                        { email: 'test1@example.com' },
                        { email: 'test2@example.com' }
                    ]
                })
            );
        });

        it('devrait lever une erreur en cas d\'échec de l\'API', async () => {
            const apiError = new Error('API Error');
            mockTransactionalEmailsApi.sendTransacEmail.mockRejectedValue(apiError);

            const to = ['test@example.com'];
            const subject = 'Test Subject';
            const htmlContent = '<h1>Test Content</h1>';

            await expect(emailService.sendEmail(to, subject, htmlContent))
                .rejects
                .toThrow(CustomError);
            
            await expect(emailService.sendEmail(to, subject, htmlContent))
                .rejects
                .toThrow('Erreur lors de l\'envoi de l\'email');
        });
    });

    describe('sendTemplateEmail', () => {
        it('devrait envoyer un email avec template avec succès', async () => {
            const mockResponse = {
                response: {} as any,
                body: { messageId: 'test-message-id' }
            };
            
            mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue(mockResponse);

            const to = ['test@example.com'];
            const templateId = 123;
            const params = { name: 'John', company: 'Test Corp' };
            const sender = { name: 'Test Sender', email: 'sender@test.com' };

            const result = await emailService.sendTemplateEmail(to, templateId, params, sender);

            expect(result).toEqual(mockResponse);
            expect(mockTransactionalEmailsApi.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    templateId: 123,
                    sender: { name: 'Test Sender', email: 'sender@test.com' },
                    to: [{ email: 'test@example.com' }],
                    params: { name: 'John', company: 'Test Corp' }
                })
            );
        });

        it('devrait utiliser les valeurs par défaut pour le sender', async () => {
            const mockResponse = {
                response: {} as any,
                body: { messageId: 'test-message-id' }
            };
            
            mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue(mockResponse);

            const to = ['test@example.com'];
            const templateId = 123;
            const params = { name: 'John' };

            await emailService.sendTemplateEmail(to, templateId, params);

            expect(mockTransactionalEmailsApi.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    sender: { name: 'ZenBilling', email: 'noreply@zenbilling.com' }
                })
            );
        });

        it('devrait lever une erreur en cas d\'échec de l\'API', async () => {
            const apiError = new Error('API Error');
            mockTransactionalEmailsApi.sendTransacEmail.mockRejectedValue(apiError);

            const to = ['test@example.com'];
            const templateId = 123;
            const params = { name: 'John' };

            await expect(emailService.sendTemplateEmail(to, templateId, params))
                .rejects
                .toThrow(CustomError);
            
            await expect(emailService.sendTemplateEmail(to, templateId, params))
                .rejects
                .toThrow('Erreur lors de l\'envoi de l\'email avec template');
        });
    });

    describe('sendEmailWithAttachment', () => {
        it('devrait envoyer un email avec pièce jointe avec succès', async () => {
            const mockResponse = {
                response: {} as any,
                body: { messageId: 'test-message-id' }
            };
            
            mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue(mockResponse);

            const to = ['test@example.com'];
            const subject = 'Test Subject';
            const htmlContent = '<h1>Test Content</h1>';
            const attachment = Buffer.from('test content');
            const filename = 'test.pdf';
            const sender = { name: 'Test Sender', email: 'sender@test.com' };

            const result = await emailService.sendEmailWithAttachment(to, subject, htmlContent, attachment, filename, sender);

            expect(result).toEqual(mockResponse);
            expect(mockTransactionalEmailsApi.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: 'Test Subject',
                    htmlContent: '<h1>Test Content</h1>',
                    sender: { name: 'Test Sender', email: 'sender@test.com' },
                    to: [{ email: 'test@example.com' }],
                    attachment: [
                        {
                            content: 'dGVzdCBjb250ZW50',
                            name: 'test.pdf'
                        }
                    ]
                })
            );
        });

        it('devrait utiliser les valeurs par défaut pour le sender', async () => {
            const mockResponse = {
                response: {} as any,
                body: { messageId: 'test-message-id' }
            };
            
            mockTransactionalEmailsApi.sendTransacEmail.mockResolvedValue(mockResponse);

            const to = ['test@example.com'];
            const subject = 'Test Subject';
            const htmlContent = '<h1>Test Content</h1>';
            const attachment = Buffer.from('test content');
            const filename = 'test.pdf';

            await emailService.sendEmailWithAttachment(to, subject, htmlContent, attachment, filename);

            expect(mockTransactionalEmailsApi.sendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    sender: { name: 'ZenBilling', email: 'noreply@zenbilling.com' }
                })
            );
        });

        it('devrait lever une erreur en cas d\'échec de l\'API', async () => {
            const apiError = new Error('API Error');
            mockTransactionalEmailsApi.sendTransacEmail.mockRejectedValue(apiError);

            const to = ['test@example.com'];
            const subject = 'Test Subject';
            const htmlContent = '<h1>Test Content</h1>';
            const attachment = Buffer.from('test content');
            const filename = 'test.pdf';

            await expect(emailService.sendEmailWithAttachment(to, subject, htmlContent, attachment, filename))
                .rejects
                .toThrow(CustomError);
            
            await expect(emailService.sendEmailWithAttachment(to, subject, htmlContent, attachment, filename))
                .rejects
                .toThrow('Erreur lors de l\'envoi de l\'email avec pièce jointe');
        });
    });
});