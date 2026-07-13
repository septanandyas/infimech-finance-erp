require('dotenv').config();
const db = require('./src/utils/db');

async function run() {
    try {
        console.log('Adding coa_code column to Cashflow table...');
        try {
            await db.query(`ALTER TABLE Cashflow ADD COLUMN coa_code VARCHAR(20) DEFAULT NULL`);
            console.log('Column coa_code added.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Column coa_code already exists.');
            } else {
                throw e;
            }
        }

        console.log('Adding foreign key constraint...');
        try {
            await db.query(`ALTER TABLE Cashflow ADD CONSTRAINT fk_cashflow_coa FOREIGN KEY (coa_code) REFERENCES ChartOfAccount(code) ON DELETE SET NULL`);
            console.log('Foreign key constraint added.');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_CANT_CREATE_TABLE' || e.message.includes('Duplicate')) {
                console.log('Foreign key constraint might already exist:', e.message);
            } else {
                console.log('Error adding foreign key constraint:', e.message);
            }
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await db.end();
        console.log('Done.');
    }
}

run();
