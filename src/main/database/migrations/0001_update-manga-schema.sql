PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_manga` (
	`manga_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text,
	`cover_url` text,
	`year` integer,
	`is_favourite` integer DEFAULT false NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`added_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_accessed_at` integer NOT NULL,
	`external_links` text,
	`last_volume` text,
	`last_chapter` text,
	`last_known_chapter_id` text,
	`last_known_chapter_number` text,
	`last_check_for_updates` integer,
	`has_new_chapters` integer DEFAULT false NOT NULL,
	CONSTRAINT "chk_manga_status" CHECK("__new_manga"."status" IN ('ongoing', 'completed', 'hiatus', 'cancelled'))
);
--> statement-breakpoint
INSERT INTO `__new_manga`("manga_id", "title", "description", "status", "cover_url", "year", "is_favourite", "is_read", "added_at", "updated_at", "last_accessed_at", "external_links", "last_volume", "last_chapter", "last_known_chapter_id", "last_known_chapter_number", "last_check_for_updates", "has_new_chapters") SELECT "manga_id", "title", "description", "status", "cover_url", "year", "is_favourite", "is_read", "added_at", "updated_at", "last_accessed_at", "external_links", "last_volume", "last_chapter", "last_known_chapter_id", "last_known_chapter_number", "last_check_for_updates", "has_new_chapters" FROM `manga`;--> statement-breakpoint
DROP TABLE `manga`;--> statement-breakpoint
ALTER TABLE `__new_manga` RENAME TO `manga`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_manga_favourite` ON `manga` (`is_favourite`);--> statement-breakpoint
CREATE INDEX `idx_manga_read` ON `manga` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_manga_added` ON `manga` (`"added_at" desc`);--> statement-breakpoint
CREATE INDEX `idx_manga_status` ON `manga` (`status`);--> statement-breakpoint
CREATE INDEX `idx_last_check_for_updates` ON `manga` (`last_check_for_updates`);--> statement-breakpoint
CREATE INDEX `idx_last_accessed` ON `manga` (`"last_accessed_at" desc`);--> statement-breakpoint
CREATE INDEX `idx_manga_library` ON `manga` (`"added_at" desc`,`"last_accessed_at" desc`) WHERE "manga"."is_favourite" = 1;