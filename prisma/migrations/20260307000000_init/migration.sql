-- CreateTable: Status
CREATE TABLE `Status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Status_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: User
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Order
CREATE TABLE `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trackingCode` VARCHAR(191) NOT NULL,
    `statusId` INTEGER NOT NULL,
    `customerId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_trackingCode_key`(`trackingCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: Order.statusId -> Status.id
ALTER TABLE `Order` ADD CONSTRAINT `Order_statusId_fkey`
    FOREIGN KEY (`statusId`) REFERENCES `Status`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Order.customerId -> User.id
ALTER TABLE `Order` ADD CONSTRAINT `Order_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `User`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed: default statuses
INSERT INTO `Status` (`name`, `color`, `sortOrder`) VALUES
('Pending',    '#94a3b8', 0),
('Processing', '#60a5fa', 1),
('In Transit', '#f59e0b', 2),
('Delivered',  '#22c55e', 3),
('Cancelled',  '#ef4444', 4);

-- Seed: default users (password: supersecret99)
INSERT INTO `User` (`name`, `email`, `password`, `role`) VALUES
('Admin',    'admin@example.com',    '$argon2id$v=19$m=65536,t=3,p=4$yRDVTKPYIlPEiAuzP6WDVg$Rdjv/t2FQVAmc/2m4xRZ5U2egUVzRjTu6FVx4lPZ0T0', 'ADMIN'),
('Customer', 'customer@example.com', '$argon2id$v=19$m=65536,t=3,p=4$Qwm/WbRb4hbVZYuoZyWKVg$c0Vb/HlbqXzXf+SPD1YdBjRstpr9dSdNjYa017Pz3ag', 'CUSTOMER');
