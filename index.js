/*
 * Name: index.js
 * Date: 04-25-19
 * Description: Team Lich Express backend setup file.
 */

var cool = require('cool-ascii-faces');
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var session = require('express-session');
var app = express();
var PORT = process.env.PORT || 5000;

var connection = mysql.createConnection({
	host : process.env.RDS_HOSTNAME,
	user : process.env.RDS_USERNAME,
	password : process.env.RDS_PASSWORD,
	port: '3306',
	database : 'nodelogin'
});

connection.connect(function(err) {
	if(!err) {
		console.log("Database is connected.");
	} else {
		console.log("Error connecting to database: " + err.stack);
	}
});

app.engine('handlebars', handlebars.engine);
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(session({
	secret : process.env.SESSION_SECRET,
	resave : true,
	saveUninitialized: true
}));

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/login.html'));
});

app.post('/auth', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/cool');
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

app.get('/cool', function(req, res) {
	if (req.session.loggedin) {
		res.send(cool());
	} else {
		res.send('Please login to view this page!');
	}
	res.end();
});

app.listen(PORT, function() {
	console.log(`Listening on ${ PORT }`);
});
