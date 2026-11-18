CREATE TABLE `cms_records` (
  `id` VARCHAR(30) NOT NULL,
  `collectionKey` VARCHAR(64) NOT NULL,
  `locale` VARCHAR(8) NOT NULL DEFAULT 'all',
  `itemKey` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL,
  `payload` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `cms_records_collectionKey_locale_itemKey_key` (`collectionKey`, `locale`, `itemKey`),
  INDEX `cms_records_collectionKey_locale_position_id_idx` (`collectionKey`, `locale`, `position`, `id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
