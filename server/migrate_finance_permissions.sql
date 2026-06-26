-- ============================================================
-- Migration: Finance ERP tables + Role permissions update
-- Jalankan di database erpinfimech (Hostinger)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabel Cashflow
-- (skip jika sudah ada)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Cashflow` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Cashflow_createdBy_fkey` (`createdBy`),
  KEY `Cashflow_projectId_fkey` (`projectId`),
  CONSTRAINT `Cashflow_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `Cashflow_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `prospect` (`no_project`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Tabel Invoice
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Invoice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('draft','sent','paid','overdue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `due_date` date DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `Invoice_createdBy_fkey` (`createdBy`),
  KEY `Invoice_projectId_fkey` (`projectId`),
  CONSTRAINT `Invoice_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `Invoice_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `prospect` (`no_project`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Tabel InvoiceItem
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `InvoiceItem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoiceId` int NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `InvoiceItem_invoiceId_fkey` (`invoiceId`),
  CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. Update permissions Role untuk finance pages
-- ------------------------------------------------------------
UPDATE `role` SET
  `permissions` = '{"all": true, "pages": {"cashflow": true, "invoice": true, "saldo": true, "neraca": true}}',
  `updatedAt` = NOW()
WHERE `name` = 'Superadmin';

UPDATE `role` SET
  `permissions` = '{"all": false, "pages": {"cashflow": true, "invoice": true, "saldo": true, "neraca": true}}',
  `updatedAt` = NOW()
WHERE `name` = 'Admin';

UPDATE `role` SET
  `permissions` = '{"all": false, "pages": {"cashflow": false, "invoice": false, "saldo": false, "neraca": false}}',
  `updatedAt` = NOW()
WHERE `name` = 'User';
