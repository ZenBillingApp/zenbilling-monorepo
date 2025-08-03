export interface IBusinessCustomer {
  customer_id: string;
  name: string;
  siret: string;
  siren: string;
  tva_intra: string | null;
  tva_applicable: boolean;
} 