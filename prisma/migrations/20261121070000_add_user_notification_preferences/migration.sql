-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bookingNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messageNotifications" BOOLEAN NOT NULL DEFAULT true;
