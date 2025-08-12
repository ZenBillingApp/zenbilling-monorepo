import { Request, Response } from 'express';

// Données de test pour les emails
export const mockEmailRecipients = ['test@example.com', 'user@example.com'];
export const mockEmailData = {
    subject: 'Test Email Subject',
    text: 'This is a test email content',
    html: '<h1>Test Email</h1><p>This is a test email content</p>'
};

// Données de test pour les templates
export const mockTemplateEmailData = {
    to: ['template@example.com'],
    templateId: 123,
    params: {
        name: 'John Doe',
        company: 'Test Company',
        plan: 'Premium'
    }
};

// Données de test pour les pièces jointes
export const mockAttachmentEmailData = {
    to: ['attachment@example.com'],
    subject: 'Email with Attachment',
    html: '<h1>Email with Attachment</h1>',
    attachment: Buffer.from('Test attachment content'),
    filename: 'test-document.pdf'
};

// Réponse mock de l'API Brevo
export const mockBrevoResponse = {
    response: {} as any,
    body: {
        messageId: 'test-message-id-12345',
        status: 'sent'
    }
};

// Mock de l'API Brevo
export const mockBrevoApi = {
    setApiKey: jest.fn(),
    sendTransacEmail: jest.fn().mockResolvedValue(mockBrevoResponse)
};

// Sender par défaut
export const mockSender = {
    name: 'ZenBilling',
    email: 'noreply@zenbilling.com'
};

// Créer une erreur Brevo
export const createBrevoError = (message: string, statusCode: number = 500) => {
    const error = new Error(message) as any;
    error.statusCode = statusCode;
    error.response = {
        status: statusCode,
        data: {
            message,
            code: statusCode
        }
    };
    return error;
};

// Réinitialiser tous les mocks
export const resetMocks = () => {
    jest.clearAllMocks();
    mockBrevoApi.setApiKey.mockClear();
    mockBrevoApi.sendTransacEmail.mockClear();
    mockBrevoApi.sendTransacEmail.mockResolvedValue(mockBrevoResponse);
};

// Créer une requête Express mock
export const createMockRequest = (body: any = {}): Partial<Request> => ({
    body,
    headers: {
        'content-type': 'application/json'
    },
    method: 'POST',
    url: '/email/send'
});

// Créer une réponse Express mock
export const createMockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
    };
    return res;
};

// Données de test pour différents types de pièces jointes
export const mockAttachments = {
    pdf: {
        content: Buffer.from('PDF content'),
        filename: 'document.pdf',
        mimeType: 'application/pdf'
    },
    image: {
        content: Buffer.from('PNG content'),
        filename: 'image.png',
        mimeType: 'image/png'
    },
    excel: {
        content: Buffer.from('Excel content'),
        filename: 'data.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    word: {
        content: Buffer.from('Word content'),
        filename: 'report.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
};

// Données de test pour les paramètres de template complexes
export const mockComplexTemplateParams = {
    user: {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie@example.com',
        phone: '+33 1 23 45 67 89'
    },
    company: {
        name: 'Entreprise ABC',
        address: '123 Rue de la Paix, 75001 Paris',
        siret: '12345678901234'
    },
    invoice: {
        number: 'INV-2024-001',
        date: '2024-01-15',
        dueDate: '2024-02-15',
        amount: '299.99',
        currency: 'EUR',
        taxRate: '20.00'
    },
    items: [
        {
            name: 'Service Premium',
            description: 'Service de facturation premium',
            quantity: 1,
            unitPrice: '299.99',
            totalPrice: '299.99'
        },
        {
            name: 'Support 24/7',
            description: 'Support technique 24h/24 et 7j/7',
            quantity: 1,
            unitPrice: '0.00',
            totalPrice: '0.00'
        }
    ],
    payment: {
        method: 'Carte bancaire',
        status: 'Payé',
        transactionId: 'txn_123456789'
    }
};

// Données de test pour les emails avec caractères spéciaux
export const mockSpecialCharsData = {
    subject: 'Sujet avec caractères spéciaux: àéîôù & <tags>',
    text: 'Contenu avec caractères spéciaux: àéîôù & <tags>',
    html: '<h1>Contenu avec caractères spéciaux: àéîôù & <tags></h1><p>Paragraphe avec émojis: 🎉 📧 💼</p>'
};

// Données de test pour les emails volumineux
export const mockLargeEmailData = {
    subject: 'Email volumineux',
    text: 'A'.repeat(10000), // 10KB de texte
    html: `<h1>Email volumineux</h1><p>${'A'.repeat(10000)}</p>` // 10KB de HTML
};

// Fonction pour créer un buffer de taille spécifique
export const createBufferOfSize = (sizeInBytes: number, content: string = 'A'): Buffer => {
    return Buffer.alloc(sizeInBytes, content);
};

// Fonction pour créer des données d'email de test
export const createTestEmailData = (overrides: any = {}) => ({
    to: ['test@example.com'],
    subject: 'Test Email',
    text: 'Test content',
    html: '<h1>Test</h1>',
    ...overrides
});

// Fonction pour créer des données de template de test
export const createTestTemplateData = (overrides: any = {}) => ({
    to: ['template@example.com'],
    subject: 'Template Email',
    templateId: 123,
    params: { name: 'Test User' },
    ...overrides
});

// Fonction pour créer des données d'attachement de test
export const createTestAttachmentData = (overrides: any = {}) => ({
    to: ['attachment@example.com'],
    subject: 'Email with Attachment',
    html: '<h1>Test</h1>',
    attachment: Buffer.from('test content'),
    filename: 'test.pdf',
    ...overrides
});

// Validation des réponses API
export const validateApiResponse = (response: any) => {
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('data');
    expect(typeof response.success).toBe('boolean');
    expect(typeof response.message).toBe('string');
};

// Validation des erreurs API
export const validateApiError = (response: any, expectedStatus: number = 500) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('error');
};

// Attendre qu'une promesse soit rejetée avec une erreur spécifique
export const expectPromiseRejection = async (promise: Promise<any>, expectedError: any) => {
    try {
        await promise;
        throw new Error('Promise should have been rejected');
    } catch (error) {
        expect(error).toBeInstanceOf(expectedError);
    }
};