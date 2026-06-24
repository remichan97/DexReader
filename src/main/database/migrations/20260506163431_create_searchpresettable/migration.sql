CREATE TABLE `search_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`search_query` text DEFAULT '',
	`filters` text NOT NULL,
	`limit` integer DEFAULT 20 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_used_at` integer NOT NULL,
	CONSTRAINT "chk_search_presets_char_limit" CHECK(length(name) <= 50)
);
--> statement-breakpoint
CREATE INDEX `idx_search_presets_name` ON `search_presets` (`name`);--> statement-breakpoint
CREATE INDEX `idx_search_presets_last_used_at` ON `search_presets` (`last_used_at`);