//jshint esversion:8
const express = require('express');
const createError = require('http-errors');
const session = require('express-session');
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars').create({defaultLayout:'main'});
const pool = require('./database');
const path = require('path');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const async = require('async');
const crypto = require('crypto');

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

app.get('/forgot', function(req, res) {
	res.render('forgot');
});

app.post('/forgot', function(req, res, next) {
	async.waterfall([
		function(done) {
			crypto.randomBytes(20, function(err, buf) {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done) {
			var email = req.body.email;
			pool.query('SELECT * FROM employees WHERE email = ?', [email], function(err, results, fields) {
				if (results.length > 0) {
					var date = new Date();
					date.setTime(date.getTime() + (60 * 60 * 1000));
					date.toISOString().slice(0, 19).replace('T', ' ');
					pool.query('UPDATE employees SET token = ?, tokenexpire = ? WHERE email = ?', [token, date, email], function (err, results, fields) {
						console.log('Token added to user.');
						done(err, token, email);
					});
				} else {
					console.log('Invalid email entered.');
					return res.redirect('/forgot');
				}

      			});
		},
		function(token, email, done) {
			const transporter = nodemailer.createTransport(sgTransport({
				auth: {
					api_user: process.env.SG_USER,
					api_key: process.env.SG_KEY
				},
			}));
			const options = {
				to: email,
        			from: 'noreply@certifilich.com',
				subject: 'Password Reset',
        			text: 'You are receiving this because a password reset requested for your account.\n\n' +
				'Click on the following link to complete the process:\n\n' +
				'http://' + req.headers.host + '/reset/' + token + '\n\n' +
				'If you did not request this, please ignore this email.\n'
			};
			transporter.sendMail(options, function(err) {
				console.log('Reset email sent.');
				done(err);
			});
		}
	], function(err) {
		if (err) return next(err);
		res.redirect('/forgot');
	});
});

app.get('/reset/:token', function(req, res) {
	pool.query('SELECT * FROM employees WHERE token = ?', [req.params.token], function(err, results, fields) {
		if (results.length > 0) {
			var user = JSON.parse(JSON.stringify(results));
			curDate = new Date();
			curDate.toISOString().slice(0, 19).replace('T', ' ');
			if (curDate > user.tokenexpire) {
				console.log('Expired token!');
				return res.redirect('/forgot');
			} else {
				res.render('reset');
		
			}
		} else {
			console.log('Invalid token!');
			return res.redirect('/forgot');
		}
	});
});

app.post('/reset/:token', function(req, res) {
        async.waterfall([
                function(done) {
			pool.query('SELECT * FROM employees WHERE token = ?', [req.params.token], function(err, results, fields) {
				var user = JSON.parse(JSON.stringify(results));
				var email = user[0].email;
				done(err, email);
			});
		},
		function(email, done) {
			var password = req.body.password;
			pool.query('UPDATE employees SET token = NULL, tokenexpire = NULL, password = ? WHERE token = ?', [password, req.params.token], function (err, results, fields) {
				console.log('Password Updated');
				done(err, email);
                        });
                },
                function(email, done) {
                        const transporter = nodemailer.createTransport(sgTransport({
                                auth: {
                                        api_user: process.env.SG_USER,
                                        api_key: process.env.SG_KEY
                                },
                        }));
                        const options = {
                                to: email,
                                from: 'noreply@certifilich.com',
                                subject: 'Password Has Been Changed',
                                text: 'Hello,\n\n' +
					'This is a confirmation that the password for ' + email + ' has just been changed.\n'
			};
                        transporter.sendMail(options, function(err) {
                                console.log('Confirmation email sent.');
                                done(err);
			});
                }
        ], function(err) {
                res.redirect('/');
        });
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
