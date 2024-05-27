ALTER TABLE `collection_roles` ADD  `role_id` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `token_roles` ADD `role_id` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `collection_roles` DROP PRIMARY KEY, ADD PRIMARY KEY(`server_id`,`collection_id`,`token_count`);--> statement-breakpoint
ALTER TABLE `token_roles` DROP PRIMARY KEY, ADD PRIMARY KEY(`server_id`,`token_id`,`balance`);--> statement-breakpoint
UPDATE `token_roles` tr LEFT JOIN `roles` r ON tr.server_id = r.server_id AND tr.token_id = r.token_id SET tr.role_id = r.role_id;--> statement-breakpoint
UPDATE `collection_roles` cr LEFT JOIN `roles` r ON cr.server_id = r.server_id AND cr.collection_id = r.collection_id SET cr.role_id = r.role_id;--> statement-breakpoint
DROP TABLE `roles`;