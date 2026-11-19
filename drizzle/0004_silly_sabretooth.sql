CREATE TABLE `customerAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipient` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`province` varchar(80) NOT NULL,
	`city` varchar(80) NOT NULL,
	`address` text NOT NULL,
	`postalCode` varchar(32) NOT NULL,
	`isDefault` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inventory` ADD `reservedStock` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `subtotalAmount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `discountAmount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingAmount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `discountCode` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `reservationExpiresAt` timestamp;