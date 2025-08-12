import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient, InvoiceStatus, QuoteStatus } from '@prisma/client';
import { 
    DashboardMetrics, 
    TopCustomer, 
    InvoiceStatusCount, 
    QuoteStatusCount 
} from '@zenbilling/shared/src/interfaces/dashboard.interface';

// Mock de Prisma
export const prismaMock = mockDeep<PrismaClient>();

// Mock de l'utilisateur pour les tests
export const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    company_id: 'company-123',
    first_name: 'Test',
    last_name: 'User',
    onboarding_completed: true,
    onboarding_step: 'FINISH' as const,
};

// Mock de la requête avec utilisateur authentifié
export const mockAuthRequest = {
    user: mockUser,
    body: {},
    params: {},
    query: {},
};

// Mock de la réponse
export const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Mock data pour les métriques
export const mockTopCustomers: TopCustomer[] = [
    {
        customer_id: 'customer-1',
        name: 'ACME Corp',
        type: 'company',
        _count: {
            invoices: 15,
            quotes: 8,
        },
        invoices: [
            { amount_including_tax: 1200.50 },
            { amount_including_tax: 800.25 },
        ],
        quotes: [
            { amount_including_tax: 1500.00 },
        ],
    },
    {
        customer_id: 'customer-2',
        name: 'John Doe',
        type: 'individual',
        _count: {
            invoices: 10,
            quotes: 5,
        },
        invoices: [
            { amount_including_tax: 950.75 },
        ],
        quotes: [
            { amount_including_tax: 750.00 },
        ],
    },
];

export const mockInvoiceStatusDistribution: InvoiceStatusCount[] = [
    { status: InvoiceStatus.pending, _count: 5 },
    { status: InvoiceStatus.sent, _count: 3 },
    { status: InvoiceStatus.paid, _count: 12 },
    { status: InvoiceStatus.cancelled, _count: 1 },
    { status: InvoiceStatus.late, _count: 2 },
];

export const mockQuoteStatusDistribution: QuoteStatusCount[] = [
    { status: QuoteStatus.draft, _count: 2 },
    { status: QuoteStatus.sent, _count: 4 },
    { status: QuoteStatus.accepted, _count: 8 },
    { status: QuoteStatus.rejected, _count: 3 },
    { status: QuoteStatus.expired, _count: 1 },
];

export const mockDashboardMetrics: DashboardMetrics = {
    monthlyRevenue: 15750.25,
    yearlyRevenue: 89500.75,
    pendingInvoices: 5,
    overdueInvoices: 2,
    topCustomers: mockTopCustomers,
    invoiceStatusDistribution: mockInvoiceStatusDistribution,
    monthlyQuotes: 12,
    yearlyQuotes: 45,
    pendingQuotes: 4,
    acceptedQuotes: 8,
    quoteStatusDistribution: mockQuoteStatusDistribution,
    quoteToInvoiceRatio: 0.67,
};

// Mock data pour les agrégations Prisma
export const mockRevenueAggregate = {
    _sum: {
        amount_including_tax: 15750.25,
    },
};

export const mockYearlyRevenueAggregate = {
    _sum: {
        amount_including_tax: 89500.75,
    },
};

export const mockInvoiceGroupBy = [
    { status: InvoiceStatus.pending, _count: 5 },
    { status: InvoiceStatus.sent, _count: 3 },
    { status: InvoiceStatus.paid, _count: 12 },
    { status: InvoiceStatus.cancelled, _count: 1 },
    { status: InvoiceStatus.late, _count: 2 },
];

export const mockQuoteGroupBy = [
    { status: QuoteStatus.draft, _count: 2 },
    { status: QuoteStatus.sent, _count: 4 },
    { status: QuoteStatus.accepted, _count: 8 },
    { status: QuoteStatus.rejected, _count: 3 },
    { status: QuoteStatus.expired, _count: 1 },
];

export const mockCustomersWithStats = [
    {
        customer_id: 'customer-1',
        type: 'company' as const,
        _count: {
            invoices: 15,
            quotes: 8,
        },
        invoices: [
            { amount_including_tax: 1200.50 },
            { amount_including_tax: 800.25 },
        ],
        quotes: [
            { amount_including_tax: 1500.00 },
        ],
        business: {
            name: 'ACME Corp',
        },
        individual: null,
    },
    {
        customer_id: 'customer-2',
        type: 'individual' as const,
        _count: {
            invoices: 10,
            quotes: 5,
        },
        invoices: [
            { amount_including_tax: 950.75 },
        ],
        quotes: [
            { amount_including_tax: 750.00 },
        ],
        business: null,
        individual: {
            first_name: 'John',
            last_name: 'Doe',
        },
    },
];

// Fonction utilitaire pour réinitialiser les mocks
export const resetMocks = () => {
    mockReset(prismaMock);
};

// Fonction utilitaire pour créer une erreur Prisma
export const createPrismaError = (code: string, message: string) => {
    const error = new Error(message) as any;
    error.code = code;
    return error;
};

// Fonction pour mocker Date
export const mockDate = (dateString: string) => {
    const mockDate = new Date(dateString);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    return mockDate;
};

// Fonction pour restaurer Date
export const restoreDate = () => {
    (global.Date as any).mockRestore?.();
};