CREATE TABLE `mobileAuthCodes` (
	`codeHash` varchar(64) NOT NULL,
	`openId` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobileAuthCodes_codeHash` PRIMARY KEY(`codeHash`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `fulfillmentStatus` enum('unfulfilled','processing','shipped','delivered','returned') DEFAULT 'unfulfilled' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `trackingCode` varchar(120);