//jshint esversion:8

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const pool = require('./../database');
const multer = require('multer');
const upload = multer();


function change_name(body, id, callback) {
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
    if (body[item] != "" && body[item] != null) {
      sql += item + " = '" + body[item];
      if (count < param_count) {
        sql += "', ";
      }
      count++;
    }
  }

  sql += "' WHERE id = " + id;
  console.log(sql);
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
  var user = {
    email: req.session.email,
    id: req.session.user_id
  };

  console.log(user);

  res.render('editName', {user: user});
});

router.put('/:id', upload.none(), (req, res, next) => {
  var body = JSON.parse(JSON.stringify(req.body));
  console.log(body);
  change_name(body, req.params.id, function(data) {
    res.status(200).end();
  });
});


module.exports = router;
