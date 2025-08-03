import { IBusinessCustomer } from "./BusinessCustomer.interface";
import { IIndividualCustomer } from "./IndividualCustomer.interface";

export type CustomerType = "company" | "individual";

export interface ICustomer {
    customer_id: string;
    user_id: string;
    company_id: string;
    type: CustomerType;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string;
    createdAt: Date;
    updatedAt: Date;
    business?: IBusinessCustomer | null;
    individual?: IIndividualCustomer | null;
}
