// Export des interfaces
export * from "./interfaces/User.interface";
export * from "./interfaces/Auth.interface";
export * from "./interfaces/Company.interface";
export * from "./interfaces/Company.request.interface";
export * from "./interfaces/Customer.interface";
export * from "./interfaces/Customer.request.interface";
export * from "./interfaces/BusinessCustomer.interface";
export * from "./interfaces/IndividualCustomer.interface";
export * from "./interfaces/Product.interface";
export * from "./interfaces/Product.request.interface";
export * from "./interfaces/Quote.interface";
export * from "./interfaces/Quote.request.interface";
export * from "./interfaces/QuoteItem.interface";
export * from "./interfaces/Payment.interface";
export * from "./interfaces/AI.interface";
export * from "./interfaces/stripe.interface";
export * from "./interfaces/dashboard.interface";
export * from "./interfaces/InvoiceItem.interface";
export * from "./interfaces/Invoice.interface";
export * from "./interfaces/Invoice.request.interface";

// Export des utilitaires
export { ApiResponse } from "./utils/apiResponse";
export { default as logger } from "./utils/logger";
export { CustomError } from "./utils/customError";

// Export du client Prisma et types
export { default as prisma } from "./libs/prisma";
export { PrismaClient, Prisma } from "./libs/prisma";
export { Decimal } from "@prisma/client/runtime/library";

// Export des middlewares
export { authMiddleware } from "./middlewares/auth.middleware";
export { validateRequest } from "./middlewares/validation.middleware";
export { errorHandler } from "./middlewares/error.middleware";
export { requestLogger } from "./middlewares/logger.middleware";

// Export des validations
export * from "./validations/ai.validation";
export * from "./validations/company.validation";
export * from "./validations/customer.validation";
export * from "./validations/invoice.validation";
export * from "./validations/product.validation";
export * from "./validations/quote.validation";
export * from "./validations/user.validation";
