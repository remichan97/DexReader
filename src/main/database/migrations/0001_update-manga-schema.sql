PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TRIGGER IF EXISTS cleanup_stale_metadata_cache;--> statement-breakpoint
DROP TRIGGER IF EXISTS cleanup_orphaned_chapters;--> statement-breakpoint
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
CREATE INDEX `idx_manga_added` ON `manga` (`added_at` DESC);--> statement-breakpoint
CREATE INDEX `idx_manga_status` ON `manga` (`status`);--> statement-breakpoint
CREATE INDEX `idx_last_check_for_updates` ON `manga` (`last_check_for_updates`);--> statement-breakpoint
CREATE INDEX `idx_last_accessed` ON `manga` (`last_accessed_at` DESC);--> statement-breakpoint
CREATE INDEX `idx_manga_library` ON `manga` (`added_at` DESC, `last_accessed_at` DESC) WHERE `manga`.`is_favourite` = 1;--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS cleanup_stale_metadata_cache
AFTER INSERT ON manga_progress
BEGIN
  DELETE FROM manga
  WHERE is_favorite = 0
    AND is_read = 0
    AND last_accessed_at < (strftime('%s', 'now') - 7776000);
END;--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS cleanup_orphaned_chapters
AFTER DELETE ON chapter_progress
BEGIN
  DELETE FROM chapter
  WHERE chapter_id = OLD.chapter_id
    AND chapter_id NOT IN (SELECT chapter_id FROM chapter_progress)
    AND manga_id NOT IN (SELECT manga_id FROM manga WHERE is_favorite = 1)
    AND updated_at < strftime('%s', 'now') - 7776000;
END;
