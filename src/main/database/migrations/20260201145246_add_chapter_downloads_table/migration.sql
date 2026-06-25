CREATE TABLE `chapter_downloads` (
	`chapter_id` text NOT NULL,
	`manga_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`downloaded_at` integer,
	`file_path` text,
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
CREATE INDEX `idx_chapter_manga_downloads` ON `chapter_downloads` (`manga_id`);--> statement-breakpoint
CREATE INDEX `idx_chapter_status_downloads` ON `chapter_downloads` (`status`);