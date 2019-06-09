//jshint esversion:8

const router = require('express').Router();
const pool = require('./../database');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const async = require('async');
const crypto = require('crypto');

router.get('/', function(req, res) {
	res.render('recover');
});


//Reference: http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/
router.post('/', function(req, res, next) {
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
					res.redirect('/recover');
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
		res.redirect('/recover');
	});
});

router.get('/reset/:token', function(req, res) {
	pool.query('SELECT * FROM employees WHERE token = ?', [req.params.token], function(err, results, fields) {
		if (results.length > 0) {
			var user = JSON.parse(JSON.stringify(results));
			curDate = new Date();
			curDate.toISOString().slice(0, 19).replace('T', ' ');
			if (curDate > user.tokenexpire) {
				console.log('Expired token!');
				return res.redirect('/recover');
			} else {
				res.render('reset');
			}
		} else {
			console.log('Invalid token!');
			return res.redirect('/recover');
		}
	});
});

router.post('/reset/:token', function(req, res) {
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
        text: 'Hello,\n\n' + 'This is a confirmation that the password for ' + email + ' has just been changed.\n'
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

module.exports = router;
