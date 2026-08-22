PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chapter_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`manga_id` text NOT NULL,
	`chapter_id` text NOT NULL,
	`current_page` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`last_read_at` integer NOT NULL,
	CONSTRAINT `chapter_progress_manga_id_manga_progress_manga_id_fk` FOREIGN KEY (`manga_id`) REFERENCES `manga_progress`(`manga_id`) ON DELETE CASCADE,
	CONSTRAINT `un_manga_chapter` UNIQUE(`manga_id`,`chapter_id`)
);
--> statement-breakpoint
INSERT INTO `__new_chapter_progress`(`id`, `manga_id`, `chapter_id`, `current_page`, `completed`, `last_read_at`) SELECT `id`, `manga_id`, `chapter_id`, `current_page`, `completed`, `last_read_at` FROM `chapter_progress`;--> statement-breakpoint
DROP TABLE `chapter_progress`;--> statement-breakpoint
ALTER TABLE `__new_chapter_progress` RENAME TO `chapter_progress`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_collection_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`collection_id` integer NOT NULL,
	`manga_id` text NOT NULL,
	`added_at` integer NOT NULL,
	`position` integer DEFAULT 0,
	CONSTRAINT `collection_items_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE CASCADE,
	CONSTRAINT `collection_items_manga_id_manga_manga_id_fk` FOREIGN KEY (`manga_id`) REFERENCES `manga`(`manga_id`) ON DELETE CASCADE,
	CONSTRAINT `uq_collection_manga` UNIQUE(`collection_id`,`manga_id`)
);
--> statement-breakpoint
INSERT INTO `__new_collection_items`(`id`, `collection_id`, `manga_id`, `added_at`, `position`) SELECT `id`, `collection_id`, `manga_id`, `added_at`, `position` FROM `collection_items`;--> statement-breakpoint
DROP TABLE `collection_items`;--> statement-breakpoint
ALTER TABLE `__new_collection_items` RENAME TO `collection_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_manga` (
	`manga_id` text PRIMARY KEY,
	`title` text NOT NULL,
	`description` text,
	`status` text,
	`cover_url` text,
	`cover_cached_at` integer,
	`year` integer,
	`is_favourite` integer DEFAULT false NOT NULL,
	`added_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_accessed_at` integer NOT NULL,
	`external_links` text,
	`tags` text,
	`authors` text,
	`artists` text,
	`alternative_titles` text,
	`last_volume` text,
	`last_chapter` text,
	CONSTRAINT "chk_manga_status" CHECK("status" IN ('ongoing', 'completed', 'hiatus', 'cancelled'))
);
--> statement-breakpoint
INSERT INTO `__new_manga`(`manga_id`, `title`, `description`, `status`, `cover_url`, `cover_cached_at`, `year`, `is_favourite`, `added_at`, `updated_at`, `last_accessed_at`, `external_links`, `tags`, `authors`, `artists`, `alternative_titles`, `last_volume`, `last_chapter`) SELECT `manga_id`, `title`, `description`, `status`, `cover_url`, `cover_cached_at`, `year`, `is_favourite`, `added_at`, `updated_at`, `last_accessed_at`, `external_links`, `tags`, `authors`, `artists`, `alternative_titles`, `last_volume`, `last_chapter` FROM `manga`;--> statement-breakpoint
DROP TABLE `manga`;--> statement-breakpoint
ALTER TABLE `__new_manga` RENAME TO `manga`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reading_statistics` (
	`id` integer PRIMARY KEY DEFAULT 1,
	`total_mangas_read` integer DEFAULT 0 NOT NULL,
	`total_chapters_read` integer DEFAULT 0 NOT NULL,
	`total_pages_read` integer DEFAULT 0 NOT NULL,
	`total_estimated_minutes` integer DEFAULT 0 NOT NULL,
	`last_calculated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "chk_reading_statistics_id" CHECK("id" = 1)
);
--> statement-breakpoint
INSERT INTO `__new_reading_statistics`(`id`, `total_mangas_read`, `total_chapters_read`, `total_pages_read`, `total_estimated_minutes`, `last_calculated_at`) SELECT `id`, `total_mangas_read`, `total_chapters_read`, `total_pages_read`, `total_estimated_minutes`, `last_calculated_at` FROM `reading_statistics`;--> statement-breakpoint
DROP TABLE `reading_statistics`;--> statement-breakpoint
ALTER TABLE `__new_reading_statistics` RENAME TO `reading_statistics`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `un_manga_chapter`;--> statement-breakpoint
DROP INDEX IF EXISTS `uq_collection_manga`;--> statement-breakpoint
DROP INDEX IF EXISTS `collections_name_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `search_presets_name_unique`;--> statement-breakpoint
CREATE INDEX `idx_chapter_progress_manga` ON `chapter_progress` (`manga_id`);--> statement-breakpoint
CREATE INDEX `idx_chapter_progress_last_read` ON `chapter_progress` ("last_read_at" desc);--> statement-breakpoint
CREATE INDEX `idx_chapter_progress_manga_completed` ON `chapter_progress` (`manga_id`,`completed`);--> statement-breakpoint
CREATE INDEX `idx_collection_items_collection` ON `collection_items` (`collection_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_items_manga` ON `collection_items` (`manga_id`);--> statement-breakpoint
CREATE INDEX `idx_manga_favourite` ON `manga` (`is_favourite`);--> statement-breakpoint
CREATE INDEX `idx_manga_added` ON `manga` ("added_at" desc);--> statement-breakpoint
CREATE INDEX `idx_manga_status` ON `manga` (`status`);--> statement-breakpoint
CREATE INDEX `idx_last_accessed` ON `manga` ("last_accessed_at" desc);--> statement-breakpoint
CREATE INDEX `idx_manga_library` ON `manga` ("added_at" desc,"last_accessed_at" desc) WHERE "manga"."is_favourite" = 1;--> statement-breakpoint
CREATE INDEX `idx_chapter_chapterId` ON `chapter_downloads` (`chapter_id`);