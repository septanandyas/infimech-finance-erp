const db = require('../utils/db');

const getNeracaByPeriod = async (month, year) => {
    const [income] = await db.query(
        `SELECT SUM(amount) as total FROM Cashflow WHERE type='income' 
         AND (coa_code != '4100' OR coa_code IS NULL)
         AND (YEAR(date) < ? OR (YEAR(date) = ? AND MONTH(date) <= ?))`,
        [year, year, month]
    );
    const [expense] = await db.query(
        `SELECT SUM(amount) as total FROM Cashflow WHERE type='expense'
         AND (YEAR(date) < ? OR (YEAR(date) = ? AND MONTH(date) <= ?))`,
        [year, year, month]
    );

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endOfMonthDate = new Date(year, month - 1, lastDayOfMonth, 23, 59, 59);

    const [piutang] = await db.query(
        `SELECT COALESCE(SUM(contract_value), 0) as total 
     FROM ProjectContract 
     WHERE status = 'active'
     AND contract_date <= ?`,
        [endOfMonthDate]
    );
    const [sudahDibayar] = await db.query(
        `SELECT COALESCE(SUM(ip.amount / (1 + COALESCE(i.tax_rate, 0) / 100)), 0) as total 
     FROM InvoicePayment ip
     JOIN Invoice i ON ip.invoiceId = i.id
     JOIN ProjectContract c ON i.contractId = c.id
     WHERE i.status IN ('acc','partial','paid')
     AND c.status = 'active'
     AND ip.payment_date <= ?`,
        [endOfMonthDate]
    );
    // Hitung nilai persediaan PADA AKHIR PERIODE yang diminta (bukan saldo live),
    // direkonstruksi dari riwayat InventoryLog agar Neraca bulan lalu tidak
    // ikut memuat pembelian yang terjadi di bulan berjalan.
    const inventoryEndDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
    const [inventory] = await db.query(
        `SELECT COALESCE(SUM(
            CASE WHEN l.type = 'in' THEN l.quantity ELSE -l.quantity END * i.unit_price
         ), 0) as total
         FROM InventoryLog l
         JOIN Inventory i ON l.inventoryId = i.id
         WHERE l.log_date <= ?`,
        [inventoryEndDate]
    );
    const [uangMukaPph] = await db.query(
        `SELECT COALESCE(SUM(je.debit) - SUM(je.credit), 0) as total
         FROM JournalEntry je JOIN Journal j ON je.journalId = j.id
         WHERE je.coa_code = '1310'
         AND (j.period_year < ? OR (j.period_year = ? AND j.period_month <= ?))`,
        [year, year, month]
    );

    const [assets] = await db.query(`SELECT * FROM FixedAsset`);

    let totalAsetTetap = 0;
    const categoryMap = {};
    assets.forEach(asset => {
        const acquired = new Date(asset.acquisition_date);
        if (acquired > endOfMonthDate) return;

        if (asset.status === 'disposed' && asset.disposal_date) {
            const disposed = new Date(asset.disposal_date);
            if (disposed <= endOfMonthDate) return;
        }

        const monthsElapsed = (endOfMonthDate.getFullYear() - acquired.getFullYear()) * 12 + (endOfMonthDate.getMonth() - acquired.getMonth());
        const totalMonths = asset.useful_life_years * 12;
        const depreciableValue = Number(asset.acquisition_value) - Number(asset.salvage_value || 0);
        const monthlyDepreciation = depreciableValue / totalMonths;
        const accumulated = Math.min(monthlyDepreciation * monthsElapsed, depreciableValue);
        const book_value = Math.max(Number(asset.acquisition_value) - accumulated, Number(asset.salvage_value || 0));
        totalAsetTetap += book_value;
        if (!categoryMap[asset.category]) categoryMap[asset.category] = 0;
        categoryMap[asset.category] += book_value;
    });
    const ALL_CATEGORIES = ['Peralatan IT', 'Kendaraan', 'Furniture', 'Bangunan', 'Mesin', 'Lainnya'];
    const asetTetapDetail = ALL_CATEGORIES.map(category => ({
        category,
        book_value: categoryMap[category] || 0
    }));

    const dateParam = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const [shortTerm] = await db.query(
        `SELECT category, COALESCE(SUM(amount - paid_amount), 0) as total FROM Liability
         WHERE term_type='short_term'
           AND status='outstanding'
           AND DATE(start_date) <= DATE(?)
         GROUP BY category`,
        [dateParam]
    );
    const [longTerm] = await db.query(
        `SELECT category, COALESCE(SUM(amount - paid_amount), 0) as total FROM Liability
         WHERE term_type='long_term'
           AND status='outstanding'
           AND DATE(start_date) <= DATE(?)
         GROUP BY category`,
        [dateParam]
    );
    const [unearned] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM Cashflow 
     WHERE coa_code = '2200' AND type = 'income'
     AND (YEAR(date) < ? OR (YEAR(date) = ? AND MONTH(date) <= ?))`,
        [year, year, month]
    );

    // Kurangi yang sudah diakui (dipindah ke 4100)
    const [recognized] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM Cashflow 
     WHERE coa_code = '4100' AND type = 'income'
     AND (YEAR(date) < ? OR (YEAR(date) = ? AND MONTH(date) <= ?))`,
        [year, year, month]
    );
    // Koreksi 2200 yang lewat Journal (mis. potongan PPh 23), supaya konsisten
    // dengan Buku Besar, bukan cuma dari Cashflow.
    const [unearnedJournalAdj] = await db.query(
        `SELECT COALESCE(SUM(je.credit) - SUM(je.debit), 0) as total
         FROM JournalEntry je JOIN Journal j ON je.journalId = j.id
         WHERE je.coa_code = '2200'
         AND (j.period_year < ? OR (j.period_year = ? AND j.period_month <= ?))`,
        [year, year, month]
    );

    // totalPiutang TIDAK ditambahkan ke sini lagi -- itu "sisa nilai kontrak
    // yang belum ditagih", bukan uang muka yang sudah diterima. Kalau
    // ditambahkan, sisa kontrak itu kehitung dobel: sekali sebagai Aset
    // (piutang), sekali lagi sebagai Kewajiban (unearned).
    // Hitung Utang Pajak dari Cashflow (COA 2400 PPN & 2410 PPh)
    const [utangPajak] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM Cashflow
         WHERE coa_code IN ('2400', '2410') AND type = 'income'
         AND (YEAR(date) < ? OR (YEAR(date) = ? AND MONTH(date) <= ?))`,
        [year, year, month]
    );
    const totalUtangPajak = Number(utangPajak[0]?.total || 0);

    // Hitung pendapatan yang sudah diakui (reklasifikasi 2200 -> 4100/4200/4300 via JournalEntry)
    const [journalRecognized] = await db.query(
        `SELECT COALESCE(SUM(je.debit), 0) as total FROM JournalEntry je
         JOIN Journal j ON je.journalId = j.id
         WHERE je.coa_code = '2200' AND j.type = 'revenue_recognition'
         AND (j.period_year < ? OR (j.period_year = ? AND j.period_month <= ?))`,
        [year, year, month]
    );

    const totalPiutang = Math.max((Number(piutang[0].total) || 0) - (Number(sudahDibayar[0].total) || 0), 0);
    const totalRecognized = (Number(recognized[0]?.total) || 0) + (Number(journalRecognized[0]?.total) || 0);
    const totalUnearned = Math.max((Number(unearned[0]?.total) || 0) - totalRecognized, 0);
    const ALL_LIABILITY_CATEGORIES = ['Hutang Bank', 'Hutang Usaha', 'Hutang Pajak', 'Hutang Gaji', 'Lainnya'];

    const shortTermDetail = ALL_LIABILITY_CATEGORIES.map(category => {
        let totalVal = Number(shortTerm.find(r => r.category === category)?.total || 0);
        if (category === 'Hutang Pajak') {
            totalVal += totalUtangPajak;
        }
        return {
            category,
            total: totalVal
        };
    });
    shortTermDetail.push({ category: 'Pendapatan Diterima di Muka', total: totalUnearned });

    const longTermDetail = ALL_LIABILITY_CATEGORIES.map(category => ({
        category,
        total: Number(longTerm.find(r => r.category === category)?.total || 0)
    }));

    const kas = (Number(income[0].total) || 0) - (Number(expense[0].total) || 0);
    const totalPersediaan = Number(inventory[0]?.total) || 0;
    const totalUangMukaPph = Number(uangMukaPph[0]?.total) || 0;
    const totalAsetLancar = kas + totalPiutang + totalPersediaan + totalUangMukaPph;
    const totalShort = shortTermDetail.reduce((s, r) => s + r.total, 0);
    const totalLong = longTermDetail.reduce((s, r) => s + r.total, 0);
    const totalKewajiban = totalShort + totalLong;
    const totalAset = totalAsetLancar + totalAsetTetap;

    return {
        aset: {
            lancar: { kas, piutang: totalPiutang, persediaan: totalPersediaan, uang_muka_pph: totalUangMukaPph, total: totalAsetLancar },
            tetap: { categories: asetTetapDetail, total: totalAsetTetap },
            total: totalAset
        },
        kewajiban: {
            jangka_pendek: { categories: shortTermDetail, total: totalShort },
            jangka_panjang: { categories: longTermDetail, total: totalLong },
            total: totalKewajiban
        },
        modal: {
            total: totalAset - totalKewajiban
        }
    };
};

const getNeraca = async (req, res) => {
    try {
        const now = new Date();
        const month = parseInt(req.query.month) || now.getMonth() + 1;
        const year = parseInt(req.query.year) || now.getFullYear();
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const [current, previous] = await Promise.all([
            getNeracaByPeriod(month, year),
            getNeracaByPeriod(prevMonth, prevYear)
        ]);
        res.json({ current, previous });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNeraca };