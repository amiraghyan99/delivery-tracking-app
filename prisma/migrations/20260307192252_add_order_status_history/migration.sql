-- CreateTable
CREATE TABLE `OrderStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `statusId` INTEGER NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory` ADD CONSTRAINT `OrderStatusHistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory` ADD CONSTRAINT `OrderStatusHistory_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `Status`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
