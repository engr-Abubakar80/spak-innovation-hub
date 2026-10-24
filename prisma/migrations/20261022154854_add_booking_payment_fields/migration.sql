-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "accountDetails" TEXT,
ADD COLUMN     "amountToPay" DECIMAL(12,2),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN     "paymentInstructions" TEXT,
ADD COLUMN     "suggestedDate" TIMESTAMP(3),
ADD COLUMN     "suggestedEndMinute" INTEGER,
ADD COLUMN     "suggestedStartMinute" INTEGER;
