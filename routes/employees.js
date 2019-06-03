//jshint esversion:8
const router = require('express').Router();
const pool = require('./../database');
const aws = require('aws-sdk');
const multer = require('multer');
const upload = multer();

const s3 = new aws.S3({
  accessKeyId: 'AKIA3U2PXSWDTJYR4SUJ',
  secretAccessKey: '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'
});

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

function create_employee(body, url, callback) {
  if (body.hasOwnProperty('email') && body.hasOwnProperty('user_type') && body.hasOwnProperty('password')){
    if (body.email == null || body.password == null || body.user_type == null) {
      let error = new Error('Missing required field data...');
      throw error;
    }
  } else {
    let error = new Error('Invalid syntax for creating new user!');
    throw error;
  }

  //var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  var sql = 'INSERT INTO employees (email, last_name, first_name, password, signature_url, user_type) VALUES (?, ?, ?, ?, ?, ?)';
  var values = [body.email, body.last_name, body.first_name, body.password, url, body.user_type];
  pool.query(sql, values, function(error, results, fields) {
    if (error) {
      console.log(error);
    }
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

/***************************************************************************
This function checks to see if the user is currently logged in before
allowing any routes to be accessed.  If the user is not logged in, they are
redirected back to the login page.
***************************************************************************/

router.use((req, res, next) => {
  if (req.session.loggedin !== true) {
    res.redirect('../');
  } else {
    if (req.session.type === 0) {
      res.render('homeUser');
    } else {
      next();
    }
  }
});

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
    res.status(200).render('editEmployee', {data: data});
  });
});

// Multer.upload() must be used to parse multiform data; body-parser will not handle this!
router.post('/', upload.single('user_sig'), (req, res, next) => {
  const body = JSON.parse(JSON.stringify(req.body));

  if (req.file) {
    var url;

    const params = {
      Bucket: 'certifilich',
      Key: req.file.originalname,
      Body: req.file.buffer
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
      }
      url = data;
      create_employee(body, url.Location, function(data) {
        res.status(201).send('User created.');
      });
    });
  } else {
    create_employee(body, null, function(data) {
      res.status(201).send('User created.');
    });
  }
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

// CREATE TABLE employees (
// 	id int AUTO_INCREMENT NOT NULL,
// 	email varchar(255) NOT NULL,
// 	last_name varchar(255),
// 	first_name varchar(255),
// 	password varchar(255) NOT NULL,employees
// 	signature_url varchar(255),
// 	user_type int(10) NOT NULL,
// 	created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
// 	PRIMARY KEY (id)
// );
