ALTER TABLE `search_presets` RENAME COLUMN "limit" TO "results_per_page";--> statement-breakpoint
CREATE UNIQUE INDEX `search_presets_name_unique` ON `search_presets` (`name`);--> statement-breakpoint
ALTER TABLE `search_presets` DROP COLUMN `description`;