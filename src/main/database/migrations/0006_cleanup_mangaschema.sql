DROP INDEX `idx_last_check_for_updates`;--> statement-breakpoint
ALTER TABLE `manga` DROP COLUMN `last_known_chapter_id`;--> statement-breakpoint
ALTER TABLE `manga` DROP COLUMN `last_known_chapter_number`;--> statement-breakpoint
ALTER TABLE `manga` DROP COLUMN `last_check_for_updates`;--> statement-breakpoint
ALTER TABLE `manga` DROP COLUMN `has_new_chapters`;