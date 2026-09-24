-- Migration: Membuat tabel Notes untuk fitur Catatan
-- Jalankan script ini pada database MySQL Anda

CREATE TABLE IF NOT EXISTS Notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    isi TEXT NOT NULL,
    kategori ENUM('Masalah', 'Temuan', 'Ide', 'Lainnya') NOT NULL DEFAULT 'Lainnya',
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE CASCADE,
    INDEX idx_kategori (kategori),
    INDEX idx_createdBy (createdBy),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
