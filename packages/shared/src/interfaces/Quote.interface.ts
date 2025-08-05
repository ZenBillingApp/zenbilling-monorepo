import { ICustomer } from "./Customer.interface";
import { IQuoteItem } from "./QuoteItem.interface";
import { IUser } from "./User.interface";
import { ICompany } from "./Company.interface";
import { Decimal } from "@prisma/client/runtime/library";

export type QuoteStatus =
    | "draft"
    | "sent"
    | "accepted"
    | "rejected"
    | "expired";

export interface IQuote {
    quote_id?: string;
    customer_id: string;
    user_id: string;
    company_id: string | null;
    quote_number: string;
    quote_date: Date;
    validity_date: Date;
    amount_excluding_tax: Decimal;
    tax: Decimal;
    amount_including_tax: Decimal;
    status: QuoteStatus;
    conditions?: string | null;
    notes?: string | null;

    // Relations
    customer?: ICustomer;
    user?: IUser;
    company?: ICompany;
    items?: IQuoteItem[];
    createdAt: Date;
    updatedAt: Date;
}
