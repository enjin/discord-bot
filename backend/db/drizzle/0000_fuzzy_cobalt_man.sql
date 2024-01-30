CREATE TABLE `account_address` (
	`address` varchar(45) NOT NULL,
	`member_id` varchar(20) NOT NULL,
	CONSTRAINT `account_address_pk` PRIMARY KEY(`member_id`,`address`)
);
--> statement-breakpoint
CREATE TABLE `connected_accounts` (
	`id` varchar(20),
	`member_id` varchar(20),
	CONSTRAINT `connected_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `connected_accounts_id_member_id_unique` UNIQUE(`id`,`member_id`)
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`id` varchar(20) NOT NULL,
	`name` text,
	`connected_at` timestamp DEFAULT (now()),
	`config` json DEFAULT ('{}'),
	CONSTRAINT `servers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account_address` ADD CONSTRAINT `account_address_member_id_connected_accounts_id_fk` FOREIGN KEY (`member_id`) REFERENCES `connected_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connected_accounts` ADD CONSTRAINT `connected_accounts_id_servers_id_fk` FOREIGN KEY (`id`) REFERENCES `servers`(`id`) ON DELETE no action ON UPDATE no action;