-- Step 2 of release v1.2.0: data-integrity fixes found while writing business-logic tests.

-- 1. Provenance order: createdAt has millisecond precision and can tie, so add a global
--    append sequence. SERIAL fills existing rows in physical order; renumber them by
--    (createdAt, id) so history keeps its current order, then move the sequence past them.
ALTER TABLE "provenance_events" ADD COLUMN     "seq" SERIAL NOT NULL;

UPDATE "provenance_events" AS p
SET "seq" = o.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn
  FROM "provenance_events"
) AS o
WHERE p."id" = o."id";

SELECT setval(
  pg_get_serial_sequence('"provenance_events"', 'seq'),
  COALESCE((SELECT MAX("seq") FROM "provenance_events"), 0) + 1,
  false
);

CREATE UNIQUE INDEX "provenance_events_seq_key" ON "provenance_events"("seq");

-- 2. Starter collection: remember that it was granted instead of inferring it from
--    "owns no artworks" (which re-granted it after a collector sold everything and
--    raced on concurrent logins).
ALTER TABLE "users" ADD COLUMN     "starterCollectionGrantedAt" TIMESTAMP(3);

-- Every collector who has already logged in through Telegram was provisioned at that login.
UPDATE "users" SET "starterCollectionGrantedAt" = "createdAt" WHERE "telegramId" IS NOT NULL;
