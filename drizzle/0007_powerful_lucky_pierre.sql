CREATE TABLE `catalogProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(80) NOT NULL,
	`priceValue` int NOT NULL,
	`image` text NOT NULL,
	`gallery` text,
	`badge` varchar(80),
	`description` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalogProducts_id` PRIMARY KEY(`id`)
);
