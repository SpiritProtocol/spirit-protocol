-- Vault is removed from the MVP. Drop provenance rows that recorded vault
-- events first, so the enum values they use can be removed below.
DELETE FROM "provenance_events" WHERE "type" IN ('VAULT_ACTIVATED', 'VAULT_COVERAGE_UPDATED');

-- AlterEnum
BEGIN;
CREATE TYPE "ProvenanceEventType_new" AS ENUM ('CREATED', 'STATUS_CHANGED', 'VERIFICATION_STARTED', 'VERIFIED', 'VERIFICATION_REJECTED', 'LISTED', 'LISTING_CANCELLED', 'OWNERSHIP_TRANSFERRED', 'SOLD', 'DEMO_RESET');
ALTER TABLE "provenance_events" ALTER COLUMN "type" TYPE "ProvenanceEventType_new" USING ("type"::text::"ProvenanceEventType_new");
ALTER TYPE "ProvenanceEventType" RENAME TO "ProvenanceEventType_old";
ALTER TYPE "ProvenanceEventType_new" RENAME TO "ProvenanceEventType";
DROP TYPE "public"."ProvenanceEventType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "vault_events" DROP CONSTRAINT "vault_events_performedById_fkey";

-- DropForeignKey
ALTER TABLE "vault_events" DROP CONSTRAINT "vault_events_vaultId_fkey";

-- DropForeignKey
ALTER TABLE "vaults" DROP CONSTRAINT "vaults_artworkId_fkey";

-- DropTable
DROP TABLE "vault_events";

-- DropTable
DROP TABLE "vaults";

-- DropEnum
DROP TYPE "VaultEventType";

-- DropEnum
DROP TYPE "VaultStatus";

