//jshint esversion:8
const express = require('express');
const createError = require('http-errors');
const session = require('express-session');
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars').create({defaultLayout:'main'});
const pool = require('./database');
const path = require('path');


// Create the express application
const app = express();

// Set up our view engine
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));

// Set up req.body parsing
app.use(bodyParser.urlencoded({extended: true}, bodyParser.json()));

// Create the session object
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Render the appropriate home page vs. login
app.get('/', (req, res, next) => {
  if (req.session.loggedin === true) {
    if (req.session.type === 1) {
      res.render('homeAdmin');
    } else {
      res.render('homeUser');
    }
  } else {
    res.render('login');
  }
});

// Accept login data
// Reference: https://codeshack.io/basic-login-system-nodejs-express-mysql/
app.post('/', (req, res, next) => {
	if (req.body.email && req.body.password) {
    var email = req.body.email;
    var password = req.body.password;
    var sql = 'SELECT * FROM employees WHERE email = ? AND password = ?';
		pool.query(sql, [email, password], function(error, results, fields) {
			if (results.length > 0) {
				user = JSON.parse(JSON.stringify(results));
				req.session.loggedin = true;
				req.session.email = email;
        req.session.type = user[0].user_type;
        req.session.user_id = user[0].id;
				if (req.session.type === 1) {
					res.render('homeAdmin');
        } else if (req.session.type === 0) {
					res.render('homeUser');
				} else {
					res.send('Login error! Please try again!');
				}
			} else {
				res.send('Incorrect Username and/or Password!');
			}
		});
	} else {
		res.send('Please enter Username and Password!');
	}
});

// Logout route
app.get('/logout', (req, res, next) => {
  req.session.destroy(function(err) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect('/');
});

// Routing
app.use('/awards', require('./routes/awards'));
app.use('/employees', require('./routes/employees'));
app.use('/recover', require('./routes/recover'));
app.use('/reset', require('./routes/reset'));
app.use('/user', require('./routes/user'));

// Error handling
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send(err.message);
});

// Listen
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
