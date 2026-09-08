const db = require('./utils/db');

async function inspectLatestPayroll() {
    console.log('=== LATEST PAYROLL RECORDS IN DB ===');
    const [payrolls] = await db.query('SELECT * FROM payroll ORDER BY id DESC LIMIT 5');
    console.log(payrolls);

    console.log('\n=== LATEST JOURNALS IN DB ===');
    const [journals] = await db.query('SELECT * FROM Journal ORDER BY id DESC LIMIT 5');
    console.log(journals);

    console.log('\n=== LATEST JOURNAL ENTRIES IN DB ===');
    const [jes] = await db.query('SELECT je.*, j.reference, j.description as j_desc FROM JournalEntry je JOIN Journal j ON je.journalId = j.id ORDER BY je.id DESC LIMIT 15');
    console.log(jes);
}

inspectLatestPayroll().then(() => process.exit(0)).catch(console.error);
