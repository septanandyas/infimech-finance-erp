const db = require('../utils/db');
const { autoInsertDepreciation } = require('./journal.controller');

const getLabaRugiByPeriod = async (month, year) => {
    // Auto-insert penyusutan
    await autoInsertDepreciation(month, year);

    const [coaRows] = await db.query('SELECT code, name FROM ChartOfAccount');
    const coaMap = {};
    coaRows.forEach(c => { coaMap[c.code] = c.name; });

    // Helper: ambil total cashflow per coa_code
    const getCashflowByCoa = async (coa_code, type) => {
        const [rows] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM Cashflow
             WHERE coa_code = ? AND type = ? AND MONTH(date) = ? AND YEAR(date) = ?`,
            [coa_code, type, month, year]
        );
        return Number(rows[0].total) || 0;
    };

    // Helper: ambil total beban persediaan dari log
    const getBebanPersediaan = async () => {
        const [rows] = await db.query(
            `SELECT COALESCE(SUM(l.quantity * i.unit_price), 0) as total
             FROM InventoryLog l
             JOIN Inventory i ON l.inventoryId = i.id
             WHERE l.type = 'out' 
             AND MONTH(l.log_date) = ? AND YEAR(l.log_date) = ?`,
            [month, year]
        );
        return Number(rows[0].total) || 0;
    };

    // Helper: ambil total journal entry per coa_code
    const getJournalByCoa = async (coa_code, side) => {
        const [rows] = await db.query(
            `SELECT COALESCE(SUM(je.${side}), 0) as total
             FROM JournalEntry je
             JOIN Journal j ON je.journalId = j.id
             WHERE je.coa_code = ? AND j.period_month = ? AND j.period_year = ?`,
            [coa_code, month, year]
        );
        return Number(rows[0].total) || 0;
    };

    // Helper: ambil total pendapatan per coa_code (gabungan Cashflow + JournalEntry reklasifikasi)
    const getPendapatanByCoa = async (coa_code) => {
        // 1. Ambil dari Cashflow
        const [cashflowRows] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM Cashflow
             WHERE coa_code = ? AND type = 'income' AND MONTH(date) = ? AND YEAR(date) = ?`,
            [coa_code, month, year]
        );
        // 2. Ambil dari JournalEntry (Reklasifikasi DP/Termin lama saat pelunasan)
        const [journalRows] = await db.query(
            `SELECT COALESCE(SUM(je.credit), 0) as total FROM JournalEntry je
             JOIN Journal j ON je.journalId = j.id
             WHERE je.coa_code = ? AND j.type = 'revenue_recognition'
             AND j.period_month = ? AND j.period_year = ?`,
            [coa_code, month, year]
        );
        return Number(cashflowRows[0].total || 0) + Number(journalRows[0].total || 0);
    };

    // PENDAPATAN
    const pendapatan = [
        { code: '4100', name: coaMap['4100'] || 'Pendapatan Jasa Simulasi CFD', amount: await getPendapatanByCoa('4100') },
        { code: '4200', name: coaMap['4200'] || 'Pendapatan Jasa Simulasi FEA', amount: await getPendapatanByCoa('4200') },
        { code: '4300', name: coaMap['4300'] || 'Pendapatan Jasa Konsultasi & Training', amount: await getPendapatanByCoa('4300') },
    ];
    const totalPendapatan = pendapatan.reduce((s, p) => s + p.amount, 0);

    // HARGA POKOK JASA
    const hpp = [
        { code: '5100', name: coaMap['5100'] || 'Gaji Karyawan (Engineer, Admin & Manajemen)', amount: await getCashflowByCoa('5100', 'expense') },
        { code: '5200', name: coaMap['5200'] || 'Biaya Cloud / HPC', amount: await getCashflowByCoa('5200', 'expense') },
        { code: '5300', name: coaMap['5300'] || 'Amortisasi Lisensi Software', amount: await getCashflowByCoa('5300', 'expense') },
    ];
    const totalHpp = hpp.reduce((s, h) => s + h.amount, 0);
    const labaKotor = totalPendapatan - totalHpp;

    // BEBAN OPERASIONAL
    const beban = [
        { code: '5900', name: coaMap['5900'] || 'Beban Penyusutan Aset Tetap', amount: await getJournalByCoa('5900', 'debit') },
        { code: '6500', name: coaMap['6500'] || 'Beban Perlengkapan ATK', amount: await getBebanPersediaan() },
        { code: '6200', name: coaMap['6200'] || 'Sewa Kantor & Utilitas', amount: await getCashflowByCoa('6200', 'expense') },
        { code: '6300', name: coaMap['6300'] || 'Beban Pemasaran & Representasi', amount: await getCashflowByCoa('6300', 'expense') },
        { code: '6400', name: coaMap['6400'] || 'Beban Pajak', amount: await getCashflowByCoa('6400', 'expense') },
    ];
    const totalBeban = beban.reduce((s, b) => s + b.amount, 0);

    // PENDAPATAN/BEBAN LAIN-LAIN (non-operasional, contoh: untung/rugi pelepasan aset tetap)
    const lainLain = [
        { code: '7100', name: coaMap['7100'] || 'Keuntungan Pelepasan Aset', amount: await getJournalByCoa('7100', 'credit') },
        { code: '7200', name: coaMap['7200'] || 'Kerugian Pelepasan Aset', amount: await getJournalByCoa('7200', 'debit') * -1 },
    ];
    const totalLainLain = lainLain.reduce((s, l) => s + l.amount, 0);

    const labaRugiBersih = labaKotor - totalBeban + totalLainLain;

    return { pendapatan, totalPendapatan, hpp, totalHpp, labaKotor, beban, totalBeban, lainLain, totalLainLain, labaRugiBersih };
};

const getLabaRugi = async (req, res) => {
    try {
        const now = new Date();
        const month = parseInt(req.query.month) || now.getMonth() + 1;
        const year = parseInt(req.query.year) || now.getFullYear();
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        const [current, previous] = await Promise.all([
            getLabaRugiByPeriod(month, year),
            getLabaRugiByPeriod(prevMonth, prevYear)
        ]);

        res.json({ current, previous });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLabaRugi };