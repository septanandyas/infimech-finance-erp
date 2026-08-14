require('dotenv').config();
const db = require('./src/utils/db');

const accounts = [
    { group: 'Aset', subgroup: 'Aset Lancar', code: '1100', name: 'Kas', description: 'Saldo kas perusahaan' },
    { group: 'Aset', subgroup: 'Aset Lancar', code: '1200', name: 'Piutang Usaha', description: 'Tagihan yang belum dibayar klien' },
    { group: 'Aset', subgroup: 'Aset Lancar', code: '1300', name: 'Biaya Dibayar di Muka', description: 'Biaya yang dibayar lebih awal, misalnya lisensi software' },
    { group: 'Aset', subgroup: 'Aset Tetap', code: '1400', name: 'Peralatan & Mesin', description: 'Aset tetap berwujud' },
    { group: 'Aset', subgroup: 'Aset Tetap', code: '1500', name: 'Software & Lisensi', description: 'Aset tetap tak berwujud' },
    { group: 'Kewajiban', subgroup: 'Kewajiban Jangka Pendek', code: '2100', name: 'Utang Usaha', description: 'Utang kepada pemasok atau pihak ketiga' },
    { group: 'Kewajiban', subgroup: 'Kewajiban Jangka Pendek', code: '2200', name: 'Pendapatan Diterima di Muka', description: 'Pembayaran dari klien untuk pekerjaan belum selesai' },
    { group: 'Kewajiban', subgroup: 'Kewajiban Jangka Pendek', code: '2400', name: 'Utang PPN', description: 'PPN Keluaran yang dipungut dari klien dan harus disetor' },
    { group: 'Ekuitas', subgroup: 'Modal', code: '3100', name: 'Modal Disetor', description: 'Modal dari pendiri atau pemilik perusahaan' },
    { group: 'Ekuitas', subgroup: 'Modal', code: '3200', name: 'Laba Ditahan', description: 'Laba yang diputar kembali ke perusahaan' },
    { group: 'Pendapatan', subgroup: 'Pendapatan', code: '4100', name: 'Pendapatan Jasa Simulasi CFD', description: 'Pendapatan dari proyek simulasi CFD' },
    { group: 'Pendapatan', subgroup: 'Pendapatan', code: '4200', name: 'Pendapatan Jasa Simulasi FEA', description: 'Pendapatan dari proyek simulasi FEA' },
    { group: 'Pendapatan', subgroup: 'Pendapatan', code: '4300', name: 'Pendapatan Jasa Konsultasi & Training', description: 'Pendapatan dari konsultasi atau pelatihan' },
    { group: 'Beban', subgroup: 'Harga Pokok Jasa', code: '5100', name: 'Gaji Engineer & Analis', description: 'Biaya tenaga ahli yang teralokasi ke proyek' },
    { group: 'Beban', subgroup: 'Harga Pokok Jasa', code: '5200', name: 'Biaya Cloud / HPC', description: 'Biaya komputasi khusus proyek' },
    { group: 'Beban', subgroup: 'Harga Pokok Jasa', code: '5300', name: 'Amortisasi Lisensi Software', description: 'Pembebanan lisensi software ke proyek' },
    { group: 'Beban', subgroup: 'Beban Operasional', code: '6100', name: 'Gaji Manajemen, Admin & Marketing', description: 'Biaya operasional internal' },
    { group: 'Beban', subgroup: 'Beban Operasional', code: '6200', name: 'Sewa Kantor & Utilitas', description: 'Biaya kantor, listrik, internet dan utilitas' },
    { group: 'Beban', subgroup: 'Beban Operasional', code: '6300', name: 'Beban Pemasaran & Representasi', description: 'Biaya promosi dan menjamu klien' },
    { group: 'Beban', subgroup: 'Beban Operasional', code: '6400', name: 'Beban Pajak', description: 'Penyetoran PPN, PPh final, atau pajak perusahaan lainnya' }
];

async function run() {
    try {
        console.log('Creating ChartOfAccount table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS ChartOfAccount (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                \`group\` VARCHAR(100) NOT NULL,
                subgroup VARCHAR(100) NOT NULL,
                description TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Table ChartOfAccount ensured.');

        console.log('Inserting default CoA entries...');
        let count = 0;
        for (const acc of accounts) {
            try {
                await db.query(
                    'INSERT IGNORE INTO ChartOfAccount (code, name, `group`, subgroup, description) VALUES (?, ?, ?, ?, ?)',
                    [acc.code, acc.name, acc.group, acc.subgroup, acc.description]
                );
                count++;
            } catch (err) {
                console.error('Failed inserting:', acc.code, err.message);
            }
        }
        console.log(`Inserted/Skipped ${count} CoA entries.`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        // close pool to exit script
        await db.end();
        console.log('Done.');
    }
}

run();
