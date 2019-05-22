//jshint esversion:8
const mysql = require('mysql');
const util = require('util');


//Create DB connection
const pool = mysql.createPool({
  host: 'lichdev.c7pwkereld54.us-east-2.rds.amazonaws.com',
  user: 'passe',
  password: 'temppassword',
  database: 'test_db',
  waitForConnections: true,
  connectionLimit: 10
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
