PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL UNIQUE,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_collections`(`id`, `name`, `description`, `created_at`, `updated_at`) SELECT `id`, `name`, `description`, `created_at`, `updated_at` FROM `collections`;--> statement-breakpoint
DROP TABLE `collections`;--> statement-breakpoint
ALTER TABLE `__new_collections` RENAME TO `collections`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_search_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL UNIQUE,
	`search_query` text DEFAULT '',
	`filters` text NOT NULL,
	`results_per_page` integer DEFAULT 20 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_used_at` integer NOT NULL,
	CONSTRAINT "chk_search_presets_char_limit" CHECK(length(name) <= 50)
);
--> statement-breakpoint
INSERT INTO `__new_search_presets`(`id`, `name`, `search_query`, `filters`, `results_per_page`, `created_at`, `updated_at`, `last_used_at`) SELECT `id`, `name`, `search_query`, `filters`, `results_per_page`, `created_at`, `updated_at`, `last_used_at` FROM `search_presets`;--> statement-breakpoint
DROP TABLE `search_presets`;--> statement-breakpoint
ALTER TABLE `__new_search_presets` RENAME TO `search_presets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_collections_name`;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_search_presets_name`;--> statement-breakpoint
CREATE INDEX `idx_search_presets_last_used_at` ON `search_presets` (`last_used_at`);