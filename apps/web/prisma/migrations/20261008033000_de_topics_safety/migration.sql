-- Phase D/E: AI topic provenance, grounded sources, user roles, safety alerts.
ALTER TABLE "Topic" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'curated';
ALTER TABLE "Topic" ADD COLUMN "validationStatus" TEXT NOT NULL DEFAULT 'validated';
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'student';

CREATE TABLE "Source" (
  "id" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "tier" INTEGER NOT NULL,
  "excerpt" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Source" ADD CONSTRAINT "Source_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SafetyAlert" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" TEXT NOT NULL,
  "request" TEXT NOT NULL,
  "messages" JSONB NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  CONSTRAINT "SafetyAlert_pkey" PRIMARY KEY ("id")
);
