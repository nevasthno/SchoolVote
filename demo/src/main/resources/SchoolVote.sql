DROP DATABASE IF EXISTS `SchoolVote`;
CREATE DATABASE `SchoolVote` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `SchoolVote`;

CREATE TABLE IF NOT EXISTS `schools` (
  `id`       BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name`     VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `classes` (
  `id`        BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `school_id` BIGINT NOT NULL,
  `name`      VARCHAR(50) NOT NULL,
  UNIQUE KEY (`school_id`,`name`),
  FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `users` (
  `id`             BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `school_id`      BIGINT NOT NULL,
  `class_id`       BIGINT NULL,
  `first_name`     VARCHAR(50) NOT NULL,
  `last_name`      VARCHAR(50) NOT NULL,
  `email`          VARCHAR(100) NOT NULL UNIQUE,
  `password_hash`  VARCHAR(255) NOT NULL,
  `role`           ENUM('TEACHER','STUDENT','PARENT') NOT NULL,
  `about_me`       TEXT NULL,
  `date_of_birth`  DATE NULL,
  FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`)  REFERENCES `classes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS `voting` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `school_id` BIGINT NOT NULL,
  `class_id` BIGINT NULL,
  `title` VARCHAR(250) NOT NULL,
  `description` TEXT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `created_by` BIGINT NOT NULL,
  `multiple_choice` BOOLEAN NOT NULL DEFAULT FALSE 
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `petitions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(250) NOT NULL,
  `description` TEXT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `created_by` BIGINT NOT NULL,
  `school_id` BIGINT NOT NULL,
  `class_id` BIGINT NULL, 
  `status` ENUM('OPEN', 'CLOSED', 'APPROVED') NOT NULL DEFAULT 'OPEN'
) ENGINE=InnoDB;
