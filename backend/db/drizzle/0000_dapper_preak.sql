CREATE TABLE `account_address` (
	`address` varchar(49) NOT NULL,
	`member_id` varchar(41) NOT NULL,
	CONSTRAINT `account_address_pk` PRIMARY KEY(`member_id`,`address`)
);
--> statement-breakpoint
CREATE TABLE `connected_accounts` (
	`id` varchar(41) NOT NULL,
	`user_id` varchar(20) NOT NULL,
	`server_id` varchar(20) NOT NULL,
	CONSTRAINT `connected_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `server_token_roles` (
	`server_id` varchar(20) NOT NULL,
	`token_id` varchar(255) NOT NULL,
	`role_id` varchar(20) NOT NULL,
	CONSTRAINT `server_token_roles_unique` UNIQUE(`server_id`,`role_id`,`token_id`)
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`id` varchar(20) NOT NULL,
	`name` text,
	`connected_at` timestamp DEFAULT (now()),
	`version` int NOT NULL,
	CONSTRAINT `servers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account_address` ADD CONSTRAINT `account_address_member_id_connected_accounts_id_fk` FOREIGN KEY (`member_id`) REFERENCES `connected_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connected_accounts` ADD CONSTRAINT `connected_accounts_server_id_servers_id_fk` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `server_token_roles` ADD CONSTRAINT `server_token_roles_server_id_servers_id_fk` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade ON UPDATE no action;