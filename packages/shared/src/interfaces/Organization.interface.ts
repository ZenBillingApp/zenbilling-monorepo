// Types des formes juridiques (aligné avec le backend)
export type ILegalForm =
    | "SAS"
    | "SARL"
    | "SA"
    | "SASU"
    | "EURL"
    | "SNC"
    | "SOCIETE_CIVILE"
    | "ENTREPRISE_INDIVIDUELLE";

// Interface pour l'organisation (structure Better Auth avec additional fields)
export interface IOrganization {
    id: string;
    name: string;
    slug: string;
    logo?: string | undefined;
    createdAt: Date;
    // Additional fields (définis dans la config Better Auth backend)
    siret: string;
    tva_intra?: string | undefined;
    tva_applicable: boolean;
    RCS_number: string;
    RCS_city: string;
    capital?: number | undefined;
    siren: string;
    legal_form: ILegalForm;
    address: string;
    postal_code: string;
    city: string;
    country: string;
    email?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    stripe_account_id?: string | undefined;
    stripe_onboarded: boolean;
}

// Interface pour un membre d'organisation
export interface IOrganizationMember {
    id: string;
    organizationId: string;
    userId: string;
    role: "owner" | "admin" | "member";
    createdAt: Date;
}

// Interface pour une invitation
export interface IOrganizationInvitation {
    id: string;
    organizationId: string;
    email: string;
    role: "admin" | "member";
    status: "pending" | "accepted" | "rejected" | "canceled";
    expiresAt: Date;
    inviterId: string;
}

// Interface pour l'organisation active de l'utilisateur
export interface IActiveOrganization {
    organizationId: string;
    userId: string;
}

// Organisation complète avec ses membres (retourné par getFullOrganization)
export interface IFullOrganization extends IOrganization {
    members: IOrganizationMember[];
    invitations?: IOrganizationInvitation[];
}
