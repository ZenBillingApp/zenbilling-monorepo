import { ProductUnit, VatRate } from './Product.interface';
import { Decimal } from '@prisma/client/runtime/library';

export interface ICreateProductRequest {
  name: string;
  description?: string;
  price_excluding_tax: Decimal;
  vat_rate: VatRate;
  unit?: ProductUnit;
}

export interface IUpdateProductRequest extends Partial<ICreateProductRequest> {}

export interface IProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minVatRate?: number;
  maxVatRate?: number;
  sortBy?: 'name' | 'price_excluding_tax' | 'vat_rate' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
} 