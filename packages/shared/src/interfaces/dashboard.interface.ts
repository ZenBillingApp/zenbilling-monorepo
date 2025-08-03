import { InvoiceStatus, QuoteStatus } from "@prisma/client";

export interface TopCustomer {
    customer_id: string;
    name: string;
    type: "individual" | "company";
    _count: {
        invoices: number;
        quotes: number;
    };
    invoices: {
        amount_including_tax: number;
    }[];
    quotes: {
        amount_including_tax: number;
    }[];
}

export interface InvoiceStatusCount {
    status: InvoiceStatus;
    _count: number;
}

export interface QuoteStatusCount {
    status: QuoteStatus;
    _count: number;
}

export interface DashboardMetrics {
    monthlyRevenue: number;
    yearlyRevenue: number;
    pendingInvoices: number;
    overdueInvoices: number;
    topCustomers: TopCustomer[];
    invoiceStatusDistribution: InvoiceStatusCount[];
    monthlyQuotes: number;
    yearlyQuotes: number;
    pendingQuotes: number;
    acceptedQuotes: number;
    quoteStatusDistribution: QuoteStatusCount[];
    quoteToInvoiceRatio: number;
}

export interface DashboardResponse {
    success: boolean;
    data: DashboardMetrics;
}
