const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const intakeRoutes = require('./routes/intakeRoutes'); // 1. Weka njia ya intake hapa
const caseRoutes = require('./routes/caseRoutes'); 
const evidenceRoutes = require('./routes/evidenceRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const path = require('path');
const providerRoutes = require('./routes/providerRoutes');
const memberRoutes = require('./routes/memberRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruhusu faili za ushahidi (uploads) kupatikana mtandaoni
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes zote za Mfumo wetu
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/intake', intakeRoutes);
app.use('/api/v1/case', caseRoutes);
app.use('/api/v1/evidences', evidenceRoutes);
app.use('/api/v1/decisions', decisionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/members', memberRoutes);

// Test Route
app.get('/', (req, res) => {
  res.json({ message: "Karibu kwenye ZHSF Fraud Intelligence API backend!" });
});

// Kuwasha server
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server inafanya kazi kwenye port namba: ${PORT}`);
});