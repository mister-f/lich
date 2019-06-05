//jshint esversion:8

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const pool = require('./../database');
const multer = require('multer');
const upload = multer();
const async = require('async');
const AWS = require('aws-sdk');
const latex = require('node-latex');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

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
  if (body.hasOwnProperty('type') && body.hasOwnProperty('last_name') && body.hasOwnProperty('first_name') && body.hasOwnProperty('award_date') && body.hasOwnProperty('email')) {
    if (body.type == null || body.last_name == null || body.first_name == null || body.award_date == null || body.email == null) {
      let error = new Error('Missing required field data...');
      throw error;
    }
  } else {
    let error = new Error('Invalid syntax for creating new award!');
    throw error;
  }

  var sql = 'INSERT INTO awards (type, last_name, first_name, email, created_by, award_date) VALUES (?, ?, ?, ?, ?, ?)';
  var values = [body.type, body.last_name, body.first_name, body.email, id, body.award_date];
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

function send_award(callback) {
	async.waterfall([
                function(done) {
                        pool.query('select A.id, A.type, A.first_name AS afn, A.last_name AS aln, A.email, A.award_date, E.first_name, E.last_name, E.signature_url from awards A inner join employees E on A.created_by = E.id where A.id=(select max(id) from awards);', function(error, results, fields) {
                                if (results.length > 0) {
                                        console.log('Certificate info retrieved.');
                                        var data = JSON.parse(JSON.stringify(results));
                                        var awardee = data[0].afn + ' ' + data[0].aln;
                                        var awardType = data[0].type;
                                        var awardDate = data[0].award_date;
                                        var email = data[0].email;
                                        var givenBy = data[0].first_name + ' ' + data[0].last_name;
                                        var imageFile = data[0].signature_url;
                                        imageFile = imageFile.replace(/^.*\/\/[^\/]+/, '');
                                        imageFile = imageFile.replace(/^\/+/g, '');
                                        done(error, awardee, awardType, awardDate, email, givenBy, imageFile);
                                } else {
                                        console.log('Certificate query error.');
                                }
                        });
                },
                function(awardee, awardType, awardDate, email, givenBy, imageFile, done) {
                        //download signature from S3 bucket
                        var fileKey = imageFile;
                        console.log('Trying to download file', fileKey);

                        AWS.config.update(
                        {
                                accessKeyId: process.env.AWS_KEY,
                                secretAccessKey: process.env.AWS_SECRET,
                        });
                        var s3 = new AWS.S3();
                        var options = {
                                Bucket    : 'certifilich',
                                Key    : fileKey,
                        };

                        //save signature file;
                        var file = fs.createWriteStream('./texpdf/' + imageFile);
                        s3.getObject(options).createReadStream().pipe(file);
 
			fs.writeFile('./texpdf/options.tex', '\\documentclass[12pt,a4paper]{article}\n' +
					'\\usepackage[utf8]{inputenc}\n' +
					'\\usepackage{pdflscape}\n' +
				//	'\\usepackage{fancybox}\n' +
					'\\usepackage{graphicx}\n\n' +
					'\\begin{document}\n' +
					'\\begin{titlepage}\n' +
					'\\begin{landscape}\n' +
					'\\begin{center}\n\n' +
				//	'\\thisfancyput(3.25in,-4.5in){%\n' +
				//	'	\\setlength{\\unitlength}{1in}\\fancyoval(7,9.5)}\n\n' +
					'\\huge\\textbf{This certificate is awarded to:}\n\n' +
					'\\medskip\n\n' +
					'\\Huge\\textbf{' + awardee + '}\n\n' +
					'\\bigskip\n\n' +
					'\\huge\\textbf{to recognize them for the accomplishment of:}\n\n' +
					'\\medskip\n\n' +
					'\\Huge\\textbf{' + awardType + '}\n\n' +
					'\\bigskip\n\n' +
					'\\huge\\textbf{on the following date:}\n\n' +
					'\\medskip\n\n' +
					'\\Huge\\textbf{' + awardDate + '}\n\n' +
					'\\vfill\n\n' +
					'\\includegraphics[width=6cm]{' + imageFile + '}\n\n' +
					'\\underline{\\hspace{6cm}}\\\\\n' +
					'\\smallskip\n' +
					'\\large\\textbf{Signed by ' + givenBy + '}\n\n' +
					'\\end{center}\n' +
					'\\end{landscape}\n' +
					'\\end{titlepage}\n' +
					'\\end{document}\n\n', function(err) {
                                if (err) {
                                        console.log('File write error!');
                                }
                                console.log('options.tex created.')
                        });
			done(null, imageFile, email);
                },
		function(imageFile, email, done) {
		
                        const input = fs.createReadStream('./texpdf/options.tex')
                        const imgInput = fs.createReadStream('./texpdf/' + imageFile)
			const output = fs.createWriteStream('./texpdf/certificate.pdf')
                        const pdf = latex(input, {
				inputs: imgInput
			});

                        pdf.pipe(output)
                        pdf.on('error', err => console.error(err))
                        pdf.on('finish', function () {
				console.log('PDF generated!');
				done(null, imageFile, email);
			});
                },
                function(imageFile, email, done) {
                        const transporter = nodemailer.createTransport(sgTransport({
                                auth: {
                                        api_user: process.env.SG_USER,
                                        api_key: process.env.SG_KEY
                                },
                        }));
                        const options = {
                                to: email,
                                from: 'noreply@certifilich.com',
                                subject: 'You\'ve received a certificate!',
                                text: 'Hello,\n\n' +
                                        'Congratulations! You received an award! Please download the attached .pdf file to see your reward.\n',
                                attachments: [
                                        {
                                                path: './texpdf/certificate.pdf'
                                        }
                                ]
                        };
                        transporter.sendMail(options, function(err) {
                                console.log('Certificate sent.');
                                done(err, imageFile);
                        });
                },
                function(imageFile, done) {
                        var path = './texpdf/'
                        imageFile = path + imageFile
                        fs.unlink(imageFile, function (err) {
                                if (err) throw err;
                                console.log(imageFile + " was deleted.");
                        })
			var tex = path + 'options.tex'
                        fs.unlink(tex, function (err) {
                                if (err) throw err;
                                console.log("options.tex was deleted.");
                        })
                        var cert = path + 'certificate.pdf'
                        fs.unlink(cert, function (err) {
                                if (err) throw err;
                                console.log("certificate.pdf was deleted.");
                        })
						done();
                }
	], function(err) {
		console.log(err);
	});
	callback();
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
	  send_award(function() {
	  	console.log('Certificate done sending.');
	  });
	  res.status(201).redirect('/');
  });
});

router.delete('/:id', (req, res, next) => {
  delete_award(req.params.id, function(data) {
    res.status(204).send('Award deleted.');
  });
});


module.exports = router;
