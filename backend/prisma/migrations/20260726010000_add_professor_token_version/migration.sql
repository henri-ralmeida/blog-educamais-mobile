-- Invalida sessões emitidas antes da próxima troca de senha do professor.
ALTER TABLE "Professor"
ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1;
