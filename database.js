//jshint esversion:8
const mysql = require('mysql');
const util = require('util');


//Create DB connection
const pool = mysql.createPool({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: 'test_db',
  connectionLimit: 10,
  waitForConnections: true
});

pool.getConnection((err,conn) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
  }
  if (conn) {
    console.log('Database connected successfully.');
    conn.release();
  }
});

module.exports = pool;
