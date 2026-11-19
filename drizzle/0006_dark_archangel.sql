ALTER TABLE `orders` ADD `shippingRecipient` varchar(160);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingProvince` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingCity` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingAddress` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingPostalCode` varchar(32);