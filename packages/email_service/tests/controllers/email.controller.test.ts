import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';
import { EmailController } from '../../src/controllers/email.controller';
import { EmailService } from '../../src/services/email.service';
import { ApiResponse } from '@zenbilling/shared/src/utils/apiResponse';

// Mock du service email
jest.mock('../../src/services/email.service');

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

jest.mock('@zenbilling/shared/src/utils/apiResponse');

describe('EmailController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockEmailService: jest.Mocked<EmailService>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock du service email
        mockEmailService = {
            sendEmail: jest.fn(),
            sendTemplateEmail: jest.fn(),
            sendEmailWithAttachment: jest.fn(),
        } as any;
        
        (EmailService as jest.MockedClass<typeof EmailService>).mockImplementation(() => mockEmailService);

        // Mock de la réponse Express
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        // Mock de ApiResponse
        (ApiResponse.success as jest.MockedFunction<any>).mockReturnValue(undefined);
        (ApiResponse.error as jest.MockedFunction<any>).mockReturnValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('sendEmail', () => {
        it('devrait envoyer un email avec succès', async () => {
            const mockResult = {
                response: {} as any,
                body: { messageId: 'test-message-id' }
            };
            
            mockEmailService.sendEmail.mockResolvedValue(mockResult);

            mockRequest = {
                body: {
                    to: ['test@example.com'],
                    subject: 'Test Subject',
                    text: 'Test text content',
                    html: '<h1>Test HTML content</h1>'
                }
            };

            await EmailController.sendEmail(mockRequest as Request, mockResponse as Response);

            expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
                ['test@example.com'],
                'Test Subject',
                'Test text content',
                '<h1>Test HTML content</h1>'
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                'Email envoyé avec succès',
                mockResult
            );
        });
    });

    describe('sendTemplateEmail', () => {
        it('devrait envoyer un email avec template avec succès', async () => {
            const mockResult = {
                response: {} as any,
                body: { messageId: 'template-message-id' }
            };
            
            mockEmailService.sendTemplateEmail.mockResolvedValue(mockResult);

            mockRequest = {
                body: {
                    to: ['test@example.com'],
                    subject: 'Template Subject',
                    templateId: 123,
                    params: { name: 'John', company: 'Test Corp' }
                }
            };

            await EmailController.sendTemplateEmail(mockRequest as Request, mockResponse as Response);

            expect(mockEmailService.sendTemplateEmail).toHaveBeenCalledWith(
                ['test@example.com'],
                'Template Subject',
                123,
                { name: 'John', company: 'Test Corp' }
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                'Email envoyé avec succès',
                mockResult
            );
        });
    });

    describe('sendEmailWithAttachment', () => {
        it('devrait envoyer un email avec pièce jointe avec succès', async () => {
            const mockResult = {
                response: {} as any,
                body: { messageId: 'attachment-message-id' }
            };
            
            mockEmailService.sendEmailWithAttachment.mockResolvedValue(mockResult);

            const attachmentBuffer = Buffer.from('test content');
            
            mockRequest = {
                body: {
                    to: ['test@example.com'],
                    subject: 'Attachment Subject',
                    html: '<h1>Test HTML</h1>',
                    attachment: attachmentBuffer,
                    filename: 'test.pdf'
                }
            };

            await EmailController.sendEmailWithAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockEmailService.sendEmailWithAttachment).toHaveBeenCalledWith(
                ['test@example.com'],
                'Attachment Subject',
                '<h1>Test HTML</h1>',
                attachmentBuffer,
                'test.pdf'
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                'Email avec pièce jointe envoyé avec succès',
                mockResult
            );
        });

        it('devrait gérer les paramètres manquants', async () => {
            mockRequest = {
                body: {
                    to: ['test@example.com'],
                    subject: 'Test Subject'
                    // html et attachment manquants
                }
            };

            await EmailController.sendEmailWithAttachment(mockRequest as Request, mockResponse as Response);

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                400,
                'Paramètres manquants: to, subject, html et attachment sont requis'
            );
            expect(mockEmailService.sendEmailWithAttachment).not.toHaveBeenCalled();
        });

        it('devrait gérer un destinataire unique (string)', async () => {
            const mockResult = {
                response: {} as any,
                body: { messageId: 'single-recipient-id' }
            };
            
            mockEmailService.sendEmailWithAttachment.mockResolvedValue(mockResult);

            const attachmentBuffer = Buffer.from('test content');
            
            mockRequest = {
                body: {
                    to: 'single@example.com', // String au lieu d'array
                    subject: 'Single Recipient',
                    html: '<h1>Test HTML</h1>',
                    attachment: attachmentBuffer,
                    filename: 'test.pdf'
                }
            };

            await EmailController.sendEmailWithAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockEmailService.sendEmailWithAttachment).toHaveBeenCalledWith(
                ['single@example.com'], // Converti en array
                'Single Recipient',
                '<h1>Test HTML</h1>',
                attachmentBuffer,
                'test.pdf'
            );
        });

        it('devrait gérer une pièce jointe en base64 string', async () => {
            const mockResult = {
                response: {} as any,
                body: { messageId: 'base64-attachment-id' }
            };
            
            mockEmailService.sendEmailWithAttachment.mockResolvedValue(mockResult);

            const base64Content = Buffer.from('test content').toString('base64');
            
            mockRequest = {
                body: {
                    to: ['test@example.com'],
                    subject: 'Base64 Attachment',
                    html: '<h1>Test HTML</h1>',
                    attachment: base64Content, // String base64
                    filename: 'test.pdf'
                }
            };

            await EmailController.sendEmailWithAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockEmailService.sendEmailWithAttachment).toHaveBeenCalledWith(
                ['test@example.com'],
                'Base64 Attachment',
                '<h1>Test HTML</h1>',
                Buffer.from(base64Content, 'base64'), // Converti en Buffer
                'test.pdf'
            );
        });

        it('devrait utiliser un nom de fichier par défaut', async () => {
            const mockResult = {
                response: {} as any,
                body: { messageId: 'default-filename-id' }
            };
            
            mockEmailService.sendEmailWithAttachment.mockResolvedValue(mockResult);

            const attachmentBuffer = Buffer.from('test content');
            
            mockRequest = {
                body: {
                    to: ['test@example.com'],
                    subject: 'Default Filename',
                    html: '<h1>Test HTML</h1>',
                    attachment: attachmentBuffer
                    // filename manquant
                }
            };

            await EmailController.sendEmailWithAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockEmailService.sendEmailWithAttachment).toHaveBeenCalledWith(
                ['test@example.com'],
                'Default Filename',
                '<h1>Test HTML</h1>',
                attachmentBuffer,
                'document.pdf' // Nom par défaut
            );
        });

        it('devrait gérer un format de pièce jointe non supporté', async () => {
            mockRequest = {
                body: {
                    to: ['test@example.com'],
                    subject: 'Invalid Attachment',
                    html: '<h1>Test HTML</h1>',
                    attachment: { invalid: 'format' } // Format invalide
                }
            };

            await EmailController.sendEmailWithAttachment(mockRequest as Request, mockResponse as Response);

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                500,
                'Erreur lors de l\'envoi de l\'email avec pièce jointe'
            );
        });
    });
});
