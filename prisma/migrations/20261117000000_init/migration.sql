CREATE TABLE `cms_collections` (
  `key` VARCHAR(64) NOT NULL,
  `payload` JSON NOT NULL,
  `revision` INTEGER NOT NULL DEFAULT 1,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `media_assets` (
  `id` VARCHAR(30) NOT NULL,
  `publicId` VARCHAR(191) NULL,
  `url` TEXT NOT NULL,
  `secureUrl` TEXT NOT NULL,
  `resourceType` VARCHAR(16) NOT NULL,
  `format` VARCHAR(32) NULL,
  `bytes` INTEGER NOT NULL DEFAULT 0,
  `width` INTEGER NULL,
  `height` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `media_assets_publicId_key` (`publicId`),
  INDEX `media_assets_resourceType_createdAt_idx` (`resourceType`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
