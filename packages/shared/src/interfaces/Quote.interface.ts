import { ICustomer } from "./Customer.interface";
import { IQuoteItem } from "./QuoteItem.interface";
import { IUser } from "./User.interface";
import { IOrganization } from "./Organization.interface";
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
    organization_id: string;
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
    organization?: IOrganization;
    items?: IQuoteItem[];
    createdAt: Date;
    updatedAt: Date;
}
