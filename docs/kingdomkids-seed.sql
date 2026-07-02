-- ============================================================================
-- KingdomKids — Datos Semilla (Seed)
-- Ejecutar DESPUÉS de kingdomkids.sql
--
-- Contiene solo datos mínimos para que el sistema funcione.
-- NO incluir datos de producción ni de prueba aquí.
-- ============================================================================

USE `kingdomkids`;

-- ============================================================================
-- Usuario administrador por defecto
-- Username: admin
-- Password: (hash bcrypt — cambiar en producción)
-- ============================================================================

INSERT INTO `users` (`username`, `password`)
VALUES ('admin', '$2a$12$v4VNmn10/qraMbmr0tie7.TY6GvZDFOIz0q3VP/wru72ha415s4Sy')
ON DUPLICATE KEY UPDATE `username` = `username`;

