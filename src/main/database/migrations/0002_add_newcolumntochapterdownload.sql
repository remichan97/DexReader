PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chapter_downloads` (
	`chapter_id` text NOT NULL,
	`manga_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`downloaded_at` integer,
	`downloads_base_path` text NOT NULL,
	`file_path` text NOT NULL,
	`total_pages` integer NOT NULL,
	`storage_size` integer,
	`image_quality` text DEFAULT 'data' NOT NULL,
	`error_message` text,
	`last_attempted_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_verified_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`chapter_id`, `manga_id`),
	FOREIGN KEY (`chapter_id`) REFERENCES `chapter`(`chapter_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`manga_id`) REFERENCES `manga`(`manga_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chapter_downloads`("chapter_id", "manga_id", "status", "downloaded_at", "downloads_base_path", "file_path", "total_pages", "storage_size", "image_quality", "error_message", "last_attempted_at", "last_verified_at")
SELECT "chapter_id", "manga_id", "status", "downloaded_at", COALESCE("file_path", ''), COALESCE("file_path", ''), "total_pages", "storage_size", "image_quality", "error_message", "last_attempted_at", "last_verified_at" FROM `chapter_downloads`;--> statement-breakpoint
DROP TABLE `chapter_downloads`;--> statement-breakpoint
ALTER TABLE `__new_chapter_downloads` RENAME TO `chapter_downloads`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_chapter_manga_downloads` ON `chapter_downloads` (`manga_id`);--> statement-breakpoint
CREATE INDEX `idx_chapter_status_downloads` ON `chapter_downloads` (`status`);
