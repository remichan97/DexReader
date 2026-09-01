PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chapter_downloads` (
	`chapter_id` text NOT NULL CONSTRAINT `uq_chapter_downloads_chapter_id` UNIQUE,
	`manga_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`downloaded_at` integer,
	`downloads_base_path` text NOT NULL,
	`file_path` text NOT NULL,
	`total_pages` integer NOT NULL,
	`storage_size` integer,
	`image_quality` text DEFAULT 'data' NOT NULL,
	`image_format` text DEFAULT '.jpg' NOT NULL,
	`error_message` text,
	`last_attempted_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_verified_at` integer DEFAULT (unixepoch()) NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	CONSTRAINT `pk_chapter_downloads` PRIMARY KEY(`chapter_id`, `manga_id`),
	CONSTRAINT `chapter_downloads_chapter_id_chapter_chapter_id_fk` FOREIGN KEY (`chapter_id`) REFERENCES `chapter`(`chapter_id`) ON DELETE CASCADE,
	CONSTRAINT `chapter_downloads_manga_id_manga_manga_id_fk` FOREIGN KEY (`manga_id`) REFERENCES `manga`(`manga_id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_chapter_downloads`(`chapter_id`, `manga_id`, `status`, `downloaded_at`, `downloads_base_path`, `file_path`, `total_pages`, `storage_size`, `image_quality`, `image_format`, `error_message`, `last_attempted_at`, `last_verified_at`, `is_hidden`) SELECT `chapter_id`, `manga_id`, `status`, `downloaded_at`, `downloads_base_path`, `file_path`, `total_pages`, `storage_size`, `image_quality`, `image_format`, `error_message`, `last_attempted_at`, `last_verified_at`, `is_hidden` FROM `chapter_downloads`;--> statement-breakpoint
DROP TABLE `chapter_downloads`;--> statement-breakpoint
ALTER TABLE `__new_chapter_downloads` RENAME TO `chapter_downloads`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_chapter_chapterId`;--> statement-breakpoint
CREATE INDEX `idx_chapter_manga_downloads` ON `chapter_downloads` (`manga_id`);--> statement-breakpoint
CREATE INDEX `idx_chapter_status_downloads` ON `chapter_downloads` (`status`);