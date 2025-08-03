export interface ICreateIndividualCustomerData {
  first_name: string;
  last_name: string;
}

export interface ICreateBusinessCustomerData {
  name: string;
  siret: string;
  siren: string;
  tva_intra?: string;
  tva_applicable: boolean;
}

export interface ICreateCustomerRequest {
  type: 'individual' | 'company';
  email: string;
  phone?: string;
  address: string;
  city: string;
  postal_code: string;
  country?: string;
  individual?: ICreateIndividualCustomerData;
  business?: ICreateBusinessCustomerData;
}

export interface IUpdateCustomerRequest {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  individual?: ICreateIndividualCustomerData;
  business?: ICreateBusinessCustomerData;
} 

export interface ICustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'individual' | 'company';
  sortBy?: 'created_at' | 'email' | 'city';
  sortOrder?: 'ASC' | 'DESC';
}