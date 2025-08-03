import { Decimal } from "@prisma/client/runtime/library";
import { LegalForm } from "./Company.interface";
export interface ICreateCompanyRequest {
    company_id?: string;
    name: string;
    siret: string;
    tva_intra?: string;
    tva_applicable: boolean;
    RCS_number: string;
    RCS_city: string;
    capital?: Decimal;
    siren: string;
    legal_form: LegalForm;
    // Informations d'adresse
    address: string;
    postal_code: string;
    city: string;
    country: string;
    // Informations de contact
    email?: string;
    phone?: string;
    website?: string;
}

export interface IUpdateCompanyRequest extends Partial<ICreateCompanyRequest> {}
