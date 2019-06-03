//jshint esversion:8

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const pool = require('./../database');
const multer = require('multer');
const upload = multer();

function get_awards(id, callback) {
  var sql = 'SELECT * FROM awards WHERE created_by = ' + id;
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

function create_award(body, id, callback) {
  if (body.hasOwnProperty('type') && body.hasOwnProperty('last_name') && body.hasOwnProperty('first_name') && body.hasOwnProperty('award_date')) {
    if (body.type == null || body.last_name == null || body.first_name == null || body.award_date == null) {
      let error = new Error('Missing required field data...');
      throw error;
    }
  } else {
    let error = new Error('Invalid syntax for creating new award!');
    throw error;
  }

  var sql = 'INSERT INTO awards (type, last_name, first_name, created_by, award_date) VALUES (?, ?, ?, ?, ?)';
  var values = [body.type, body.last_name, body.first_name, id, body.award_date];
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

/***************************************************************************
This function checks to see if the user is currently logged in before
allowing any routes to be accessed.  If the user is not logged in, they are
redirected back to the login page.
***************************************************************************/

router.use((req, res, next) => {
  if (req.session.loggedin !== true) {
    res.redirect('../');
  } else {
    if (req.session.type === 1) {
      res.render('homeAdmin');
    } else {
      next();
    }
  }
});

router.get('/', (req, res, next) => {
  get_awards(req.session.user_id, function(data) {
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

router.post('/', upload.none(), (req, res, next) => {
  var body = JSON.parse(JSON.stringify(req.body));
  create_award(body, req.session.user_id, function(data) {
    res.status(201).redirect('/');
  });
});

router.delete('/:id', (req, res, next) => {
  delete_award(req.params.id, function(data) {
    res.status(204).send('Award deleted.');
  });
});


module.exports = router;
