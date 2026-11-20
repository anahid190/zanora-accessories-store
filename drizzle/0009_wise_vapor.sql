CREATE TABLE `orderNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderId` int,
	`type` varchar(40) NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingCarrier` varchar(120);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingLabelUrl` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `refundStatus` enum('none','pending','partial','refunded','failed') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `refundedAmount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `stripeRefundId` varchar(255);