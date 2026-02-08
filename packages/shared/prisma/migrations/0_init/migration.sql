-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."LegalForm" AS ENUM ('SAS', 'SARL', 'SA', 'SASU', 'EURL', 'SNC', 'SOCIETE_CIVILE', 'ENTREPRISE_INDIVIDUELLE');

-- CreateEnum
CREATE TYPE "public"."CustomerType" AS ENUM ('individual', 'company');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('pending', 'sent', 'paid', 'cancelled', 'late');

-- CreateEnum
CREATE TYPE "public"."QuoteStatus" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('cash', 'credit_card', 'bank_transfer', 'stripe');

-- CreateEnum
CREATE TYPE "public"."ProductUnit" AS ENUM ('unité', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'm²', 'cm²', 'm³', 'h', 'jour', 'mois', 'année');

-- CreateEnum
CREATE TYPE "public"."VatRate" AS ENUM ('0.00', '2.10', '5.50', '10.00', '20.00');

-- CreateTable
CREATE TABLE "public"."Customer" (
    "customer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "public"."CustomerType" NOT NULL DEFAULT 'individual',
    "email" VARCHAR(100),
    "phone" VARCHAR(20),
    "address" VARCHAR(100),
    "city" VARCHAR(50),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(50) NOT NULL DEFAULT 'France',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "public"."BusinessCustomer" (
    "customer_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "siret" VARCHAR(14) NOT NULL,
    "siren" VARCHAR(9) NOT NULL,
    "tva_intra" VARCHAR(13),
    "tva_applicable" BOOLEAN NOT NULL,

    CONSTRAINT "BusinessCustomer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "public"."IndividualCustomer" (
    "customer_id" TEXT NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "IndividualCustomer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "product_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price_excluding_tax" DECIMAL(10,2) NOT NULL,
    "vat_rate" "public"."VatRate" NOT NULL DEFAULT '0.00',
    "unit" "public"."ProductUnit" NOT NULL DEFAULT 'unité',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "invoice_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "amount_excluding_tax" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "amount_including_tax" DECIMAL(10,2) NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL,
    "conditions" VARCHAR(1000),
    "late_payment_penalty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceItem" (
    "item_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "product_id" TEXT,
    "name" VARCHAR(100),
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" "public"."ProductUnit" NOT NULL DEFAULT 'unité',
    "unit_price_excluding_tax" DECIMAL(10,2) NOT NULL,
    "vat_rate" "public"."VatRate" NOT NULL DEFAULT '0.00',

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "payment_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "public"."PaymentMethod" NOT NULL,
    "description" VARCHAR(500),
    "reference" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "public"."Quote" (
    "quote_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "quote_number" VARCHAR(50) NOT NULL,
    "quote_date" DATE NOT NULL,
    "validity_date" DATE NOT NULL,
    "amount_excluding_tax" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "amount_including_tax" DECIMAL(10,2) NOT NULL,
    "status" "public"."QuoteStatus" NOT NULL,
    "conditions" VARCHAR(1000),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("quote_id")
);

-- CreateTable
CREATE TABLE "public"."QuoteItem" (
    "item_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "product_id" TEXT,
    "name" VARCHAR(100),
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" "public"."ProductUnit" NOT NULL DEFAULT 'unité',
    "unit_price_excluding_tax" DECIMAL(10,2) NOT NULL,
    "vat_rate" "public"."VatRate" NOT NULL DEFAULT '0.00',

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeOrganizationId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,
    "siret" TEXT NOT NULL,
    "tva_intra" TEXT,
    "tva_applicable" BOOLEAN NOT NULL,
    "RCS_number" TEXT NOT NULL,
    "RCS_city" TEXT NOT NULL,
    "capital" INTEGER,
    "siren" TEXT NOT NULL,
    "legal_form" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'France',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "stripe_account_id" TEXT,
    "stripe_onboarded" BOOLEAN DEFAULT false,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jwks" (
    "id" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "jwks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCustomer_customer_id_key" ON "public"."BusinessCustomer"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualCustomer_customer_id_key" ON "public"."IndividualCustomer"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON "public"."Invoice"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quote_number_key" ON "public"."Quote"("quote_number");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "public"."session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "public"."account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "public"."verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "public"."organization"("slug");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "public"."member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "public"."member"("userId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "public"."invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "public"."invitation"("email");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessCustomer" ADD CONSTRAINT "BusinessCustomer_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IndividualCustomer" ADD CONSTRAINT "IndividualCustomer_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."Invoice"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."Invoice"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteItem" ADD CONSTRAINT "QuoteItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteItem" ADD CONSTRAINT "QuoteItem_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."Quote"("quote_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

