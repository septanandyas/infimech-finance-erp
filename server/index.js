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

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Finance ERP running on port ${PORT}`));