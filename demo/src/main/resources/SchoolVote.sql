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
  `role`           ENUM('TEACHER','STUDENT','PARENT', 'DIRECTOR') NOT NULL,
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
    `multiple_choice` BOOLEAN NOT NULL DEFAULT FALSE,
    `voting_level` ENUM(
        'SCHOOL',
        'ACLASS',
        'TEACHERS_GROUP',
        'SELECTED_USERS'
    ) NOT NULL DEFAULT 'SCHOOL',
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `variants` JSON NOT NULL
) ENGINE=InnoDB;



CREATE TABLE IF NOT EXISTS `voting_variant` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `voting_id` BIGINT NOT NULL,
    `text` VARCHAR(255) NOT NULL, 
    FOREIGN KEY (`voting_id`) REFERENCES `voting`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `voting_vote` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `voting_id` BIGINT NOT NULL,
    `variant_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `vote_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`voting_id`) REFERENCES `voting`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`variant_id`) REFERENCES `voting_variant`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_vote_per_variant` (`voting_id`, `user_id`, `variant_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `voting_participant` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `voting_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    FOREIGN KEY (`voting_id`) REFERENCES `voting`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_participant` (`voting_id`, `user_id`)
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
  `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `current_positive_vote_count` INT NOT NULL DEFAULT 0,
  `directors_decision` ENUM('APPROVED', 'REJECTED', 'PENDING', 'NOT_ENOUGH_VOTING') NOT NULL DEFAULT 'NOT_ENOUGH_VOTING'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `petition_votes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `petition_id` BIGINT NOT NULL,
  `student_id` BIGINT NOT NULL,
  `vote` ENUM('YES', 'NO') NOT NULL,
  `voted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`petition_id`, `student_id`),
  FOREIGN KEY (`petition_id`) REFERENCES `petitions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `comments`(
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `petition_id` BIGINT NOT NULL,
  `text` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`petition_id`) REFERENCES `petitions`(`id`) ON DELETE CASCADE
)ENGINE=InnoDB;