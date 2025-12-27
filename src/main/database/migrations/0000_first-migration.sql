CREATE TABLE `chapter_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`manga_id` text NOT NULL,
	`chapter_id` text NOT NULL,
	`current_page` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`last_read_at` integer NOT NULL,
	FOREIGN KEY (`manga_id`) REFERENCES `manga_progress`(`manga_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chapter_progress_manga` ON `chapter_progress` (`manga_id`);--> statement-breakpoint
CREATE INDEX `idx_chapter_progress_last_read` ON `chapter_progress` ("last_read_at" desc);--> statement-breakpoint
CREATE INDEX `idx_chapter_progress_manga_completed` ON `chapter_progress` (`manga_id`,`completed`);--> statement-breakpoint
CREATE UNIQUE INDEX `un_manga_chapter` ON `chapter_progress` (`manga_id`,`chapter_id`);--> statement-breakpoint
CREATE TABLE `chapter` (
	`chapter_id` text PRIMARY KEY NOT NULL,
	`manga_id` text NOT NULL,
	`title` text,
	`chapter_number` text,
	`volume` text,
	`language` text NOT NULL,
	`publish_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`scanlation_group` text,
	`external_url` text,
	FOREIGN KEY (`manga_id`) REFERENCES `manga`(`manga_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chapter_manga` ON `chapter` (`manga_id`);--> statement-breakpoint
CREATE INDEX `idx_chapter_published` ON `chapter` ("publish_at" desc);--> statement-breakpoint
CREATE INDEX `idx_chapter_number` ON `chapter` (`manga_id`,`chapter_number`);--> statement-breakpoint
CREATE TABLE `collection_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection_id` integer NOT NULL,
	`manga_id` text NOT NULL,
	`added_at` integer NOT NULL,
	`position` integer DEFAULT 0,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`manga_id`) REFERENCES `manga`(`manga_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_collection_items_collection` ON `collection_items` (`collection_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_items_manga` ON `collection_items` (`manga_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_collection_manga` ON `collection_items` (`collection_id`,`manga_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_name_unique` ON `collections` (`name`);--> statement-breakpoint
CREATE INDEX `idx_collections_name` ON `collections` (`name`);--> statement-breakpoint
CREATE TABLE `manga_progress` (
	`manga_id` text PRIMARY KEY NOT NULL,
	`last_chapter_id` text NOT NULL,
	`first_read_at` integer NOT NULL,
	`last_read_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_manga_progress_last_read` ON `manga_progress` ("last_read_at" desc);--> statement-breakpoint
CREATE TABLE `manga_reader_overrides` (
	`manga_id` text PRIMARY KEY NOT NULL,
	`settings` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`manga_id`) REFERENCES `manga`(`manga_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_manga_override_updated` ON `manga_reader_overrides` ("updated_at" desc);--> statement-breakpoint
CREATE TABLE `manga` (
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
	`has_new_chapters` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_manga_favourite` ON `manga` (`is_favourite`);--> statement-breakpoint
CREATE INDEX `idx_manga_read` ON `manga` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_manga_added` ON `manga` ("added_at" desc);--> statement-breakpoint
CREATE INDEX `idx_manga_status` ON `manga` (`status`);--> statement-breakpoint
CREATE INDEX `idx_last_check_for_updates` ON `manga` (`last_check_for_updates`);--> statement-breakpoint
CREATE INDEX `idx_last_accessed` ON `manga` ("last_accessed_at" desc);--> statement-breakpoint
CREATE INDEX `idx_manga_library` ON `manga` ("added_at" desc,"last_accessed_at" desc) WHERE "manga"."is_favourite" = 1;--> statement-breakpoint
CREATE TABLE `reading_statistics` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`total_mangas_read` integer DEFAULT 0 NOT NULL,
	`total_chapters_read` integer DEFAULT 0 NOT NULL,
	`total_pages_read` integer DEFAULT 0 NOT NULL,
	`total_estimated_minutes` integer DEFAULT 0 NOT NULL,
	`last_calculated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `chk_reading_statistics_id` CHECK(`reading_statistics`.`id` = 1)
);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS cleanup_stale_metadata_cache
AFTER INSERT ON manga_progress
BEGIN
  DELETE FROM manga
  WHERE is_favorite = 0
    AND is_read = 0
    AND last_accessed_at < (strftime('%s', 'now') - 7776000);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS update_reading_statistics_insert
AFTER INSERT ON chapter_progress
FOR EACH ROW
BEGIN
  UPDATE reading_statistics SET
    total_mangas_read = (SELECT COUNT(DISTINCT manga_id) FROM manga_progress),
    total_chapters_read = (SELECT COUNT(*) FROM chapter_progress WHERE completed = 1),
    total_pages_read = COALESCE((SELECT SUM(current_page) FROM chapter_progress WHERE completed = 1), 0),
    total_estimated_minutes = ROUND(COALESCE((SELECT SUM(current_page) FROM chapter_progress WHERE completed = 1), 0) * 20.0 / 60.0),
    last_calculated_at = strftime('%s', 'now')
  WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS update_reading_statistics_update
AFTER UPDATE ON chapter_progress
FOR EACH ROW
BEGIN
  UPDATE reading_statistics SET
    total_mangas_read = (SELECT COUNT(DISTINCT manga_id) FROM manga_progress),
    total_chapters_read = (SELECT COUNT(*) FROM chapter_progress WHERE completed = 1),
    total_pages_read = COALESCE((SELECT SUM(current_page) FROM chapter_progress WHERE completed = 1), 0),
    total_estimated_minutes = ROUND(COALESCE((SELECT SUM(current_page) FROM chapter_progress WHERE completed = 1), 0) * 20.0 / 60.0),
    last_calculated_at = strftime('%s', 'now')
  WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS update_reading_statistics_delete
AFTER DELETE ON chapter_progress
FOR EACH ROW
BEGIN
  UPDATE reading_statistics SET
    total_mangas_read = (SELECT COUNT(DISTINCT manga_id) FROM manga_progress),
    total_chapters_read = (SELECT COUNT(*) FROM chapter_progress WHERE completed = 1),
    total_pages_read = COALESCE((SELECT SUM(current_page) FROM chapter_progress WHERE completed = 1), 0),
    total_estimated_minutes = ROUND(COALESCE((SELECT SUM(current_page) FROM chapter_progress WHERE completed = 1), 0) * 20.0 / 60.0),
    last_calculated_at = strftime('%s', 'now')
  WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS cleanup_orphaned_chapters
AFTER DELETE ON chapter_progress
BEGIN
  DELETE FROM chapter
  WHERE chapter_id = OLD.chapter_id
    AND chapter_id NOT IN (SELECT chapter_id FROM chapter_progress)
    AND manga_id NOT IN (SELECT manga_id FROM manga WHERE is_favorite = 1)
    AND updated_at < strftime('%s', 'now') - 7776000;
END;
--> statement-breakpoint
INSERT INTO reading_statistics (id, total_mangas_read, total_chapters_read, total_pages_read, total_estimated_minutes, last_calculated_at)
VALUES (1, 0, 0, 0, 0, strftime('%s', 'now'));
