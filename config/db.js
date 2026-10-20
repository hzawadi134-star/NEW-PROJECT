const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT,
  // ONGEZA MSTARI HUU CHINI ILI KURUHUSU SSL YA NEON
  ssl: true, 
});

// Jaribio la kuunganisha database
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Hitilafu imetokea wakati wa kuunganisha database:', err.stack);
  }
  console.log('Kanzidata ya PostgreSQL imeunganishwa kikamilifu! 🚀');
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
