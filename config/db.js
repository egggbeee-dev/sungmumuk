require('dotenv').config();
const mysql = require('mysql2/promise'); // promise 버전을 사용하여 async/await 가능

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit:10
});
module.exports = pool;






