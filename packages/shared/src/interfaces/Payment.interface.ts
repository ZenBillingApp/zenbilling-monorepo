import { Decimal } from "@prisma/client/runtime/library";
import { PaymentMethod } from "@prisma/client";

export interface IPayment {
    payment_id?: string;
    invoice_id: string;
    payment_date: Date;
    amount: Decimal;
    payment_method: PaymentMethod;
    description?: string | null;
    reference?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
