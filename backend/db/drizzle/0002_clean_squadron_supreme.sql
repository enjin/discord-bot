CREATE TABLE `server_roles` (
	`role_id` varchar(20),
	`initial_name` text NOT NULL DEFAULT (''),
	`created_at` timestamp DEFAULT (now()),
	`token_id` varchar(255),
	`collection_id` varchar(255),
	`server_id` varchar(20) NOT NULL,
	CONSTRAINT `server_roles_uk` UNIQUE(`server_id`,`role_id`,`token_id`,`collection_id`)
);
--> statement-breakpoint
ALTER TABLE `server_collection_roles` ADD PRIMARY KEY(`server_id`,`collection_id`);--> statement-breakpoint
ALTER TABLE `server_token_roles` ADD PRIMARY KEY(`server_id`,`token_id`);--> statement-breakpoint
ALTER TABLE `server_collection_roles` DROP INDEX `server_collection_roles_unique`;--> statement-breakpoint
ALTER TABLE `server_token_roles` DROP INDEX `server_token_roles_unique`;--> statement-breakpoint
ALTER TABLE `server_collection_roles` ADD `token_count` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `server_token_roles` ADD `balance` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `server_collection_roles` DROP COLUMN `role_id`;--> statement-breakpoint
ALTER TABLE `server_token_roles` DROP COLUMN `role_id`;--> statement-breakpoint
ALTER TABLE `server_roles` ADD CONSTRAINT `server_roles_server_id_servers_id_fk` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `server_roles` ADD CONSTRAINT `token_roles_fk` FOREIGN KEY (`server_id`,`token_id`) REFERENCES `server_token_roles`(`server_id`,`token_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `server_roles` ADD CONSTRAINT `collection_roles_fk` FOREIGN KEY (`server_id`,`collection_id`) REFERENCES `server_collection_roles`(`server_id`,`collection_id`) ON DELETE cascade ON UPDATE no action;