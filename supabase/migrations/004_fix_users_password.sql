-- ================================================
-- CORRECCIÓN: Hacer password_hash nullable
-- ================================================
-- Supabase Auth maneja las contraseñas en auth.users
-- No necesitamos almacenar password_hash en nuestra tabla users

ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- Alternativamente, si prefieres eliminar la columna completamente:
-- ALTER TABLE users DROP COLUMN password_hash;
