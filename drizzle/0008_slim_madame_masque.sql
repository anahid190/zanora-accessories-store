CREATE TABLE `authSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`openId` varchar(64) NOT NULL,
	`refreshTokenHash` varchar(64) NOT NULL,
	`userAgent` varchar(500),
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `authSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `authSessions_sessionId_unique` UNIQUE(`sessionId`),
	CONSTRAINT `authSessions_refreshTokenHash_unique` UNIQUE(`refreshTokenHash`)
);
