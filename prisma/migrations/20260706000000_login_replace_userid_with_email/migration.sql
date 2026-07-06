-- DropForeignKey
ALTER TABLE "Login" DROP CONSTRAINT "Login_userId_fkey";

-- AlterTable
ALTER TABLE "Login" DROP COLUMN "userId",
ADD COLUMN "email" VARCHAR(80) NOT NULL;
