//jshint esversion:8
const express = require('express');
const createError = require('http-errors');
const session = require('express-session');
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars').create({defaultLayout:'main'});
const pool = require('./database');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());



app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));
app.use('/', require('./routes/index'));
app.get('/homeAdmin',function(req,res){
  res.render('homeAdmin');
});
app.get('/homeUser',function(req,res){
  res.render('homeUser');
});

app.get('/login', function(req, res) {
	res.render('login');
});

app.post('/auth', function(req, res) {
	var email = req.body.email;
	var password = req.body.password;
	if (email && password) {
		pool.query('SELECT * FROM employees WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				user = JSON.parse(JSON.stringify(results));
				//req.session.loggedin = true;
				//req.session.email = email;
				console.log(user[0].type);
				if (user[0].type == 1) {
					//userType = 1;
					//res.send('user!');
					res.redirect('/homeUser');
					} else if (user[0].type == 0) {
					userType = 0;
					//res.send('admin!');
					res.redirect('/homeAdmin');
				} else {
					res.send('Login error! Please try again!');
				}
			} else {
				res.send('Incorrect Username and/or Password!');
			}			
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

app.use('/employees', require('./routes/employees'));
app.use('/awards', require('./routes/awards'));
/*app.get('/homeAdmin',function(req,res){
  res.render('homeAdmin');
});
app.get('/homeUser',function(req,res){
  res.render('homeUser');
});*/
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
