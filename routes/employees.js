//jshint esversion:8
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const pool = require('./../database');

function get_employees(callback) {
  var sql = 'SELECT * FROM employees';
  pool.query(sql, function(error, results, fields) {
    callback(results);
  });
}

function get_single_employee(id, callback) {
  var sql = 'SELECT * FROM employees WHERE id = ' + id;
  pool.query(sql, function(error, results, fields) {
    callback(results);
  });
}

function create_employee(body, callback) {
  if (body.hasOwnProperty('email') && body.hasOwnProperty('last_name') && body.hasOwnProperty('first_name') && body.hasOwnProperty('type') && body.hasOwnProperty('password')){
    if (body.email == null || body.last_name == null || body.first_name == null || body.password == null || body.type == null) {
      let error = new Error('Missing required field data...');
      throw error;
    }
  } else {
    let error = new Error('Invalid syntax for creating new user!');
    throw error;
  }

  var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  var sql = 'INSERT INTO employees (email, last_name, first_name, password, type, date) VALUES (?, ?, ?, ?, ?, ?)';
  var values = [body.email, body.last_name, body.first_name, body.password, body.type, date];
  pool.query(sql, values, function(error, results, fields) {
    callback(results);
  });
}

function update_employee(id, body, callback) {
  var sql = "UPDATE employees SET ";
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

function delete_employee(id, callback) {
  var sql = 'DELETE FROM employees WHERE id = ' + id;
  pool.query(sql, function(error, results, fields) {
    callback(results);
  });
}

router.get('/', (req, res, next) => {
  get_employees(function(data) {
    res.status(200).render('viewEmployees', {data: data});
  });
});

router.get('/create', (req, res, next) => {
  res.status(200).render('createUser');
});

router.get('/:id', (req, res, next) => {
  get_single_employee(req.params.id, function(data) {
    res.status(200).render('editUser', {data: data});
  });
});

router.post('/', (req, res, next) => {
  create_employee(req.body, function(data) {
    res.status(201).redirect('/');
  });
});

router.put('/:id', (req, res, next) => {
  update_employee(req.params.id, req.body, function(data) {
    res.status(200).end();
  });
});

router.delete('/:id', (req, res, next) => {
  delete_employee(req.params.id, function(data) {
    res.status(204).send('User deleted.');
  });
});

module.exports = router;
