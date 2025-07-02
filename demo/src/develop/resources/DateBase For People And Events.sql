DROP DATABASE IF EXISTS `PeopleAndEvents`;
CREATE DATABASE `PeopleAndEvents` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `PeopleAndEvents`;

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

