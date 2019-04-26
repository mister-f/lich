var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_funkand',
  password        : '5748',
  database        : 'cs340_funkand'
});

module.exports.pool = pool;
