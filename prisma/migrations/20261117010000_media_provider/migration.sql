ALTER TABLE `media_assets`
  ADD COLUMN `provider` VARCHAR(16) NOT NULL DEFAULT 'cloudinary' AFTER `secureUrl`;
