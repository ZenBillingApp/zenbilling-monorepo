import { Decimal } from "@prisma/client/runtime/library";

export type LegalForm =
    | "SAS"
    | "SARL"
    | "EURL"
    | "SASU"
    | "SA"
    | "SNC"
    | "SOCIETE_CIVILE"
    | "ENTREPRISE_INDIVIDUELLE";

export interface ICompany {
    company_id: string;
    name: string;
    siret: string;
    tva_intra: string | null;
    tva_applicable: boolean;
    RCS_number: string;
    RCS_city: string;
    capital: Decimal | null;
    siren: string;
    legal_form: LegalForm;
    // Informations d'adresse
    address: string;
    postal_code: string;
    city: string;
    country: string;
    // Informations de contact
    email: string | null;
    phone: string | null;
    website?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
