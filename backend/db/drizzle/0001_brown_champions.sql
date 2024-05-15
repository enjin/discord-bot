DROP TABLE `roles`;--> statement-breakpoint
ALTER TABLE `collection_roles` ADD `role_id` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `token_roles` ADD `role_id` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `collection_roles` DROP PRIMARY KEY, ADD PRIMARY KEY(`server_id`,`collection_id`,`token_count`);--> statement-breakpoint
ALTER TABLE `token_roles` DROP PRIMARY KEY, ADD PRIMARY KEY(`server_id`,`token_id`,`balance`);