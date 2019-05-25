const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const pool = require('./../database');

function get_awards(callback) {
  var sql = 'SELECT * FROM awards';
  pool.query(sql, function(error, results, fields) {
    callback(results);
  });
}

function get_single_award(id, callback) {
  var sql = 'SELECT * FROM awards WHERE id = ' + id;
  pool.query(sql, function(error, results, fields) {
    callback(results);
  });
}

function create_award(body, callback) {
  if (body.hasOwnProperty('type') && body.hasOwnProperty('last_name') && body.hasOwnProperty('first_name') && body.hasOwnProperty('created_by') && body.hasOwnProperty('created_on')){
    if (body.type == null || body.last_name == null || body.first_name == null || body.created_by == null || body.created_on == null) {
      let error = new Error('Missing required field data...');
      throw error;
    }
  } else {
    let error = new Error('Invalid syntax for creating new award!');
    throw error;
  }

  var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  var sql = 'INSERT INTO awards (type, last_name, first_name, created_by, created_on) VALUES (?, ?, ?, ?, ?)';
  var values = [body.type, body.last_name, body.first_name, body.created_by, body.created_on];
  pool.query(sql, values, function(error, results, fields) {
    callback(results);
  });
}



function delete_award(id, callback) {
  var sql = 'DELETE FROM awards WHERE id = ' + id;
  pool.query(sql, function(error, results, fields) {
    callback(results);
  });
}

function update_award(id, body, callback) {
  var sql = "UPDATE awards SET ";
  var item;
  var param_count = 0;
  var count = 1;
  for (item in body) {
    if (body[item] != "" && body[item] != null) {
      param_count++;
    }
  }

  console.log('Count: ' + count);
  console.log('Param count: ' + param_count);
  for (item in body) {
    if (item === 'date') {
      let error = new Error('Date field cannot be modified!');
      throw error;
    } else {

      if (body[item] != "" && body[item] != null) {
        sql += item + " = '" + body[item];
        if (count < param_count) {
          sql += "', ";
        }
        count++;
      }
    }
  }

  sql += "' WHERE id = " + id;
  console.log(sql);
  pool.query(sql, function(error, results, fields) {
    callback(results);
  });
}

router.get('/', (req, res, next) => {
  get_awards(function(data) {
    res.status(200).render('viewAwards', {data: data});
  });
});

router.get('/create', (req, res, next) => {
  res.status(200).render('createAward');
});

router.get('/:id', (req, res, next) => {
  get_single_award(req.params.id, function(data) {
    res.status(200).render('editAward', {data: data});
  });
});

router.post('/', (req, res, next) => {
  create_award(req.body, function(data) {
    res.status(201).redirect('/');
  });
});

router.put('/:id', (req, res, next) => {
  update_award(req.params.id, req.body, function(data) {
    res.status(200).end();
  });
});

router.delete('/:id', (req, res, next) => {
  delete_award(req.params.id, function(data) {
    res.status(204).send('Award deleted.');
  });
});


module.exports = router;