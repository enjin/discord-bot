ALTER TABLE `server_token_roles` ADD CONSTRAINT `server_token_roles_unique` UNIQUE(`server_id`,`role_id`,`token_id`);--> statement-breakpoint
ALTER TABLE `server_token_roles` DROP INDEX `custom_name`;--> statement-breakpoint
CREATE INDEX `member_id_index` ON `connected_accounts` (`member_id`);