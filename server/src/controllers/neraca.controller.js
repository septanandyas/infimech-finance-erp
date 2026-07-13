const db = require('../utils/db');

const getNeracaByPeriod = async (month, year) => {
    const [income] = await db.query(
        `SELECT SUM(amount) as total FROM Cashflow WHERE type='income' 
         AND (YEAR(date) < ? OR (YEAR(date) = ? AND MONTH(date) <= ?))`,
        [year, year, month]
    );
    const [expense] = await db.query(
        `SELECT SUM(amount) as total FROM Cashflow WHERE type='expense'
         AND (YEAR(date) < ? OR (YEAR(date) = ? AND MONTH(date) <= ?))`,
        [year, year, month]
    );

    const [piutang] = await db.query(
        `SELECT SUM(total) as total FROM Invoice WHERE status IN ('sent','overdue')`
    );
    const [inventory] = await db.query(
        `SELECT COALESCE(SUM(total_value), 0) as total FROM Inventory`
    );

    const [assets] = await db.query(`SELECT * FROM FixedAsset`);
    const targetDate = new Date(year, month - 1, 1);
    let totalAsetTetap = 0;
    const categoryMap = {};
    assets.forEach(asset => {
        const acquired = new Date(asset.acquisition_date);
        if (acquired > targetDate) return;
        const monthsElapsed = (targetDate.getFullYear() - acquired.getFullYear()) * 12 + (targetDate.getMonth() - acquired.getMonth());
        const totalMonths = asset.useful_life_years * 12;
        const monthlyDepreciation = asset.acquisition_value / totalMonths;
        const accumulated = Math.min(monthlyDepreciation * monthsElapsed, asset.acquisition_value);
        const book_value = Math.max(Number(asset.acquisition_value) - accumulated, 0);
        totalAsetTetap += book_value;
        if (!categoryMap[asset.category]) categoryMap[asset.category] = 0;
        categoryMap[asset.category] += book_value;
    });
    const ALL_CATEGORIES = ['Peralatan IT', 'Kendaraan', 'Furniture', 'Bangunan', 'Mesin', 'Lainnya'];
    const asetTetapDetail = ALL_CATEGORIES.map(category => ({
        category,
        book_value: categoryMap[category] || 0
    }));

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const dateParam = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const [shortTerm] = await db.query(
        `SELECT category, COALESCE(SUM(amount), 0) as total FROM Liability
         WHERE term_type='short_term'
           AND status='outstanding'
           AND DATE(start_date) <= DATE(?)
         GROUP BY category`,
        [dateParam]
    );
    const [longTerm] = await db.query(
        `SELECT category, COALESCE(SUM(amount), 0) as total FROM Liability
         WHERE term_type='long_term'
           AND status='outstanding'
           AND DATE(start_date) <= DATE(?)
         GROUP BY category`,
        [dateParam]
    );
    const [unearned] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM UnearnedRevenue WHERE status='pending' AND DATE(received_date) <= DATE(?)`,
        [dateParam]
    );

    const totalUnearned = Number(unearned[0]?.total) || 0;
    const ALL_LIABILITY_CATEGORIES = ['Hutang Bank', 'Hutang Usaha', 'Hutang Pajak', 'Hutang Gaji', 'Lainnya'];

    const shortTermDetail = ALL_LIABILITY_CATEGORIES.map(category => ({
        category,
        total: Number(shortTerm.find(r => r.category === category)?.total || 0)
    }));
    shortTermDetail.push({ category: 'Pendapatan Diterima di Muka', total: totalUnearned });

    const longTermDetail = ALL_LIABILITY_CATEGORIES.map(category => ({
        category,
        total: Number(longTerm.find(r => r.category === category)?.total || 0)
    }));

    const kas = (Number(income[0].total) || 0) - (Number(expense[0].total) || 0);
    const totalPiutang = Number(piutang[0].total) || 0;
    const totalPersediaan = Number(inventory[0]?.total) || 0;
    const totalAsetLancar = kas + totalPiutang + totalPersediaan;
    const totalShort = shortTermDetail.reduce((s, r) => s + r.total, 0);
    const totalLong = longTermDetail.reduce((s, r) => s + r.total, 0);
    const totalKewajiban = totalShort + totalLong;
    const totalAset = totalAsetLancar + totalAsetTetap;

    return {
        aset: {
            lancar: { kas, piutang: totalPiutang, persediaan: totalPersediaan, total: totalAsetLancar },
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