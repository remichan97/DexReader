ALTER TABLE `read_history` ADD `id` integer;--> statement-breakpoint
ALTER TABLE `read_history` ADD `read_date` text NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_read_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`manga_id` text,
	`chapter_id` text NOT NULL,
	`read_date` text NOT NULL,
	`read_at` integer NOT NULL,
	CONSTRAINT `read_history_manga_id_manga_manga_id_fk` FOREIGN KEY (`manga_id`) REFERENCES `manga`(`manga_id`) ON DELETE CASCADE,
	CONSTRAINT `uq_read_history_manga_chapter_readdate` UNIQUE(`manga_id`,`chapter_id`,`read_date`),
	CONSTRAINT "chk_read_history_read_date" CHECK(date("read_date") = "read_date")
);
--> statement-breakpoint
INSERT INTO `__new_read_history`(`manga_id`, `chapter_id`, `read_at`) SELECT `manga_id`, `chapter_id`, `read_at` FROM `read_history`;--> statement-breakpoint
DROP TABLE `read_history`;--> statement-breakpoint
ALTER TABLE `__new_read_history` RENAME TO `read_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_read_history_manga` ON `read_history` (`manga_id`);--> statement-breakpoint
CREATE INDEX `idx_read_history_timestamp` ON `read_history` ("read_at" desc);--> statement-breakpoint
CREATE INDEX `idx_read_history_read_date` ON `read_history` (`read_date`);--> statement-breakpoint
CREATE INDEX `isx_read_history_manga_read_date` ON `read_history` (`manga_id`,`read_date`);--> statement-breakpoint
CREATE INDEX `idx_read_history_manga_chapter` ON `read_history` (`manga_id`,"chapter_id" desc);