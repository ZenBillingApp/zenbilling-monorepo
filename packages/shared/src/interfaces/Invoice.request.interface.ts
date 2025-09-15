import { ProductUnit, VatRate } from "./Product.interface";
import { Decimal } from "@prisma/client/runtime/library";
import { InvoiceStatus } from "./Invoice.interface";
export type PaymentMethod = "cash" | "credit_card" | "bank_transfer";

export interface IInvoiceQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: InvoiceStatus;
    customer_id?: string;
    start_date?: string;
    end_date?: string;
    min_amount?: number;
    max_amount?: number;
    sortBy?:
        | "invoice_date"
        | "due_date"
        | "amount_including_tax"
        | "status"
        | "invoice_number";
    sortOrder?: "ASC" | "DESC";
}

export interface ICreateInvoiceItem {
    product_id?: string | null;
    name?: string;
    description?: string | null;
    quantity: Decimal;
    unit_price_excluding_tax: Decimal;
    vat_rate: VatRate;
    unit?: ProductUnit;
    save_as_product?: boolean;
}

export interface ICreateInvoiceRequest {
    customer_id: string;
    invoice_date: Date;
    due_date: Date;
    items: ICreateInvoiceItem[];
    conditions?: string;
    late_payment_penalty?: string;
}

export interface IUpdateInvoiceRequest {
    invoice_date?: Date;
    due_date?: Date;
    status?: InvoiceStatus;
    conditions?: string;
    late_payment_penalty?: string;
}

export interface ICreatePaymentRequest {
    payment_date: Date;
    amount: Decimal;
    payment_method: PaymentMethod;
    description?: string;
    reference?: string;
}

export interface ISendInvoiceWithPaymentLinkRequest {
    includePaymentLink?: boolean;
    successUrl?: string;
    cancelUrl?: string;
}
