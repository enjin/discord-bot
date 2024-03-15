CREATE TABLE `server_collection_roles` (
	`server_id` varchar(20) NOT NULL,
	`collection_id` varchar(255) NOT NULL,
	`role_id` varchar(20) NOT NULL,
	CONSTRAINT `server_collection_roles_unique` UNIQUE(`server_id`,`role_id`,`collection_id`)
);
--> statement-breakpoint
ALTER TABLE `server_collection_roles` ADD CONSTRAINT `server_collection_roles_server_id_servers_id_fk` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade ON UPDATE no action;