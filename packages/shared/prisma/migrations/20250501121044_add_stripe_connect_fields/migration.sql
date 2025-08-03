ALTER TABLE "user"
ADD COLUMN "stripe_account_id" TEXT;
ALTER TABLE "user"
ADD COLUMN "stripe_onboarded" BOOLEAN NOT NULL DEFAULT FALSE;