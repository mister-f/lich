//jshint esversion:8

const router = require('express').Router();
const pool = require('./../database');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const async = require('async');


// Reference: http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/
router.get('/:token', function(req, res) {
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

router.post('/:token', function(req, res) {
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
