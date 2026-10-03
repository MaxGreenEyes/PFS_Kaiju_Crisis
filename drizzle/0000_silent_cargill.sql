CREATE TABLE `announcements` (
	`key` text PRIMARY KEY NOT NULL,
	`announced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`table_count` integer DEFAULT 8 NOT NULL,
	`phase` text DEFAULT 'intro' NOT NULL,
	`started_at` integer,
	`elapsed_before_pause` integer DEFAULT 0 NOT NULL,
	`paused` integer DEFAULT true NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`table_no` integer NOT NULL,
	`report_key` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`table_no`, `report_key`)
);
