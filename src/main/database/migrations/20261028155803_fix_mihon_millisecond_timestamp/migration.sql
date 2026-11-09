-- Custom SQL migration file, put your code below! --
UPDATE chapter SET publish_at = publish_at / 1000 WHERE publish_at > 10000000000;--> statement-breakpoint
UPDATE chapter_progress SET last_read_at = last_read_at / 1000 WHERE last_read_at > 10000000000;--> statement-breakpoint
UPDATE manga_progress SET first_read_at = first_read_at / 1000 WHERE first_read_at > 10000000000;--> statement-breakpoint
UPDATE manga_progress SET last_read_at = last_read_at / 1000 WHERE last_read_at > 10000000000;--> statement-breakpoint

-- Imported history got day strings like '57589-10-12' (the importer fed milliseconds to the
-- date formatter). Rebuild them from the now-correct read times, then drop what can't be rebuilt.
UPDATE OR IGNORE read_history
SET read_date = (
  SELECT date(cp.last_read_at, 'unixepoch', 'localtime')
  FROM chapter_progress cp
  WHERE cp.manga_id = read_history.manga_id AND cp.chapter_id = read_history.chapter_id
)
WHERE length(read_date) > 10;--> statement-breakpoint
DELETE FROM read_history WHERE length(read_date) > 10;
