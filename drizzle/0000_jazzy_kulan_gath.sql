CREATE TABLE `demo_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`doctor` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`patient_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `demo_slot_unique` ON `demo_bookings` (`doctor`,`date`,`time`) WHERE "demo_bookings"."status" = 'confirmed';--> statement-breakpoint
CREATE INDEX `demo_session_idx` ON `demo_bookings` (`session_id`);