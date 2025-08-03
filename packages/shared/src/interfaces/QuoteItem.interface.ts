import { IProduct, ProductUnit, VatRate } from "./Product.interface";
import { Decimal } from '@prisma/client/runtime/library';


export interface IQuoteItem {
  item_id?: string;
  quote_id: string;
  product_id?: string | null;
  name: string | null;
  description?: string | null;
  quantity: Decimal;
  unit: ProductUnit;
  unit_price_excluding_tax: Decimal;
  vat_rate: VatRate;
  product?: IProduct | null;
} 