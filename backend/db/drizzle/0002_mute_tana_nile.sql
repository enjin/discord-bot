ALTER TABLE `account_address` DROP FOREIGN KEY `account_address_member_id_connected_accounts_id_fk`;
--> statement-breakpoint
ALTER TABLE `servers` ADD `version` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `account_address` ADD CONSTRAINT `account_address_member_id_connected_accounts_id_fk` FOREIGN KEY (`member_id`) REFERENCES `connected_accounts`(`id`) ON DELETE cascade ON UPDATE no action;