require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/cashflow', require('./src/routes/cashflow.routes'));
app.use('/api/invoice', require('./src/routes/invoice.routes'));
app.use('/api/saldo', require('./src/routes/saldo.routes'));
app.use('/api/neraca', require('./src/routes/neraca.routes'));
app.use('/api/fixedasset', require('./src/routes/fixedasset.routes'));
app.use('/api/liability', require('./src/routes/liability.routes'));

app.use('/api/unearned', require('./src/routes/unearned.routes'));
app.use('/api/contract', require('./src/routes/contract.routes'));
app.use('/api/journal', require('./src/routes/journal.routes'));
app.use('/api/labarugi', require('./src/routes/labarugi.routes'));
app.use('/api/ledger', require('./src/routes/ledger.routes'));
app.use('/api/coa', require('./src/routes/coa.routes'));
app.use('/api/inventory', require('./src/routes/inventory.routes'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Finance ERP running on port ${PORT}`));