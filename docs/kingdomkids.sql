-- ============================================================================
-- KingdomKids — Script DDL (Data Definition Language)
-- Base de datos: kingdomkids
-- Motor: MySQL 8.x / MariaDB 10.6+
-- Charset: utf8mb4 (soporte completo de emojis y caracteres especiales)
-- Collation: utf8mb4_unicode_ci (ordenamiento Unicode correcto para español)
--
-- Este script solo contiene ESTRUCTURA (DDL).
-- Los datos semilla están en: kingdomkids-seed.sql
--
-- Última actualización: 2026-06-28
-- ============================================================================
SET NAMES utf8mb4;
SET CHARACTER_SET_CLIENT = utf8mb4;
SET CHARACTER_SET_RESULTS = utf8mb4;
SET COLLATION_CONNECTION = utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;
-- ============================================================================
-- CREAR BASE DE DATOS (solo si no existe)
-- ============================================================================
CREATE DATABASE IF NOT EXISTS `kingdomkids`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `kingdomkids`;
-- ============================================================================
-- TABLA: kids
-- Descripción: Registro de niños del ministerio infantil.
-- Relaciones: 1:N → parents, authorized_person, checkin_register
-- ============================================================================
CREATE TABLE IF NOT EXISTS `kids` (
  `id`                             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `uuid`                           CHAR(36)         NOT NULL COMMENT 'Identificador público único (UUID v4)',
  -- Datos personales
  `name`                           VARCHAR(100)     NOT NULL COMMENT 'Nombre(s) del niño',
  `lastname`                       VARCHAR(100)     NOT NULL COMMENT 'Apellido(s) del niño',
  `birthday`                       DATE             NOT NULL COMMENT 'Fecha de nacimiento',
  `age`                            TINYINT UNSIGNED NOT NULL COMMENT 'Edad calculada al momento del registro',
  -- Ubicación
  `address`                        VARCHAR(255)     NOT NULL COMMENT 'Dirección del domicilio familiar',
  -- Salud
  `allergy`                        BOOLEAN          NOT NULL DEFAULT FALSE COMMENT '¿Tiene alguna alergia?',
  `allergy_description`            VARCHAR(255)     NULL     DEFAULT NULL  COMMENT 'Descripción de la alergia (si aplica)',
  `medical_condition`              BOOLEAN          NOT NULL DEFAULT FALSE COMMENT '¿Tiene alguna condición médica?',
  `medical_condition_description`  VARCHAR(255)     NULL     DEFAULT NULL  COMMENT 'Descripción de la condición médica (si aplica)',
  -- Membresía iglesia
  `mdf_member`                     BOOLEAN          NOT NULL DEFAULT FALSE COMMENT '¿Es miembro de Mundo de Fe?',
  `another_church`                 BOOLEAN          NOT NULL DEFAULT FALSE COMMENT '¿Asiste a otra iglesia?',
  `another_church_name`            VARCHAR(150)     NULL     DEFAULT NULL  COMMENT 'Nombre de la otra iglesia (si aplica)',
  `invited`                        BOOLEAN          NOT NULL DEFAULT FALSE COMMENT '¿Fue invitado por un miembro de MdF?',
  `invite_name`                    VARCHAR(150)     NULL     DEFAULT NULL  COMMENT 'Nombre de quien lo invitó (si aplica)',
  -- QR y términos
  `qr_code`                        VARCHAR(150)     NULL     DEFAULT NULL  COMMENT 'Nombre del archivo de imagen QR generado',
  `terms_condition`                BOOLEAN          NOT NULL DEFAULT FALSE COMMENT '¿Aceptó los términos y condiciones?',
  -- Auditoría
  `createdAt`                      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`                      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Restricciones
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kids_uuid` (`uuid`),
  INDEX `idx_kids_name_lastname` (`name`, `lastname`),
  INDEX `idx_kids_age` (`age`),
  INDEX `idx_kids_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Niños registrados en el ministerio infantil';
-- ============================================================================
-- TABLA: parents
-- Descripción: Padres o tutores asociados a un niño.
-- Relaciones: N:1 → kids (vía kid_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `parents` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `kid_id`     INT UNSIGNED  NOT NULL COMMENT 'FK → kids.id',
  `uuid`       CHAR(36)      NOT NULL COMMENT 'Identificador público único (UUID v4)',
  -- Datos de contacto
  `full_name`  VARCHAR(150)  NOT NULL COMMENT 'Nombre completo del padre/tutor',
  `email`      VARCHAR(150)  NULL     DEFAULT NULL COMMENT 'Correo electrónico',
  `cellphone`  VARCHAR(20)   NOT NULL COMMENT 'Número de celular',
  `type`       VARCHAR(20)   NOT NULL COMMENT 'Tipo de parentesco: padre, madre, tutor',
  -- Auditoría
  `createdAt`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Restricciones
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_parents_uuid` (`uuid`),
  INDEX `idx_parents_kid_id` (`kid_id`),
  INDEX `idx_parents_full_name` (`full_name`),
  CONSTRAINT `fk_parents_kid_id`
    FOREIGN KEY (`kid_id`) REFERENCES `kids` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Padres o tutores asociados a cada niño';
-- ============================================================================
-- TABLA: authorized_person
-- Descripción: Personas autorizadas para recoger a un niño (distintas a padres).
-- Relaciones: N:1 → kids (vía kid_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `authorized_person` (
  `id`            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `kid_id`        INT UNSIGNED  NOT NULL COMMENT 'FK → kids.id',
  `uuid`          CHAR(36)      NOT NULL COMMENT 'Identificador público único (UUID v4)',
  -- Datos de contacto
  `full_name`     VARCHAR(150)  NOT NULL COMMENT 'Nombre completo de la persona autorizada',
  `cellphone`     VARCHAR(20)   NULL     DEFAULT NULL COMMENT 'Número de celular',
  `relationship`  VARCHAR(50)   NULL     DEFAULT NULL COMMENT 'Relación con el niño: tío, abuelo, etc.',
  -- Auditoría
  `createdAt`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Restricciones
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_authorized_uuid` (`uuid`),
  INDEX `idx_authorized_kid_id` (`kid_id`),
  CONSTRAINT `fk_authorized_kid_id`
    FOREIGN KEY (`kid_id`) REFERENCES `kids` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Personas autorizadas para recoger a un niño';
-- ============================================================================
-- TABLA: checkin_register
-- Descripción: Registro de check-in y check-out de niños en servicios/eventos.
-- Relaciones: N:1 → kids (vía kid_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `checkin_register` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `uuid`           CHAR(36)      NOT NULL COMMENT 'Identificador público único (UUID v4)',
  `kid_id`         INT UNSIGNED  NOT NULL COMMENT 'FK → kids.id',
  -- Fechas de entrada/salida
  `checkin_date`   DATETIME      NULL     DEFAULT NULL COMMENT 'Fecha y hora de entrada',
  `checkout_date`  DATETIME      NULL     DEFAULT NULL COMMENT 'Fecha y hora de salida',
  -- Auditoría
  `createdAt`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Restricciones
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_checkin_uuid` (`uuid`),
  INDEX `idx_checkin_kid_id` (`kid_id`),
  INDEX `idx_checkin_date` (`checkin_date`),
  INDEX `idx_checkin_created` (`createdAt`),
  CONSTRAINT `fk_checkin_kid_id`
    FOREIGN KEY (`kid_id`) REFERENCES `kids` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de check-in/check-out de niños en servicios';
-- ============================================================================
-- TABLA: users
-- Descripción: Usuarios administradores del sistema.
-- ============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(100)  NOT NULL COMMENT 'Nombre de usuario único',
  `password`   VARCHAR(255)  NOT NULL COMMENT 'Hash bcrypt del password',
  -- Auditoría
  `createdAt`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Restricciones
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios administradores del backoffice';
-- ============================================================================
-- Restaurar FOREIGN_KEY_CHECKS
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;
