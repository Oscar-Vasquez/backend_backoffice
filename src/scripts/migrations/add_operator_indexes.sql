-- Añadir índices compuestos a la tabla de operadores para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "idx_operators_branch_role_status" ON "operators" ("branch_id", "role", "status");
CREATE INDEX IF NOT EXISTS "idx_operators_name" ON "operators" ("first_name", "last_name");
CREATE INDEX IF NOT EXISTS "idx_operators_created_at" ON "operators" ("created_at");

-- Añadir índices a la tabla de actividades para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "idx_activities_operator_created" ON "activities" ("operator_id", "created_at");

-- Añadir índice para mejorar las búsquedas por nombre en operadores
CREATE INDEX IF NOT EXISTS "idx_operators_first_name_trigram" ON "operators" USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_operators_last_name_trigram" ON "operators" USING gin (last_name gin_trgm_ops);

-- Asegurarse de que la extensión pg_trgm esté habilitada para búsquedas de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm; 