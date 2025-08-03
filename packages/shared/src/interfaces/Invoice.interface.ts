import { ICustomer } from "./Customer.interface";
import { IInvoiceItem } from "./InvoiceItem.interface";
import { IPayment } from "./Payment.interface";
import { Decimal } from "@prisma/client/runtime/library";

export type InvoiceStatus = "pending" | "sent" | "paid" | "cancelled" | "late";

export interface IInvoice {
    invoice_id?: string;
    customer_id: string;
    user_id: string;
    company_id: string | null;
    invoice_number: string;
    invoice_date: Date;
    due_date: Date;
    amount_excluding_tax: Decimal;
    tax: Decimal;
    amount_including_tax: Decimal;
    status: InvoiceStatus;
    conditions?: string | null;
    late_payment_penalty?: string | null;

    // Relations
    customer?: ICustomer;
    items?: IInvoiceItem[];
    payments?: IPayment[];
    createdAt: Date;
    updatedAt: Date;
}
