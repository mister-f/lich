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
var userType = 1;
var PORT = process.env.PORT || 30000;

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
	var username = req.body.uname;
	var password = req.body.psw;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				user = JSON.parse(JSON.stringify(results));
				req.session.loggedin = true;
				req.session.username = username;
				//console.log(user[0].type);
				if (user[0].type == 1) {
					userType = 1;
					res.redirect('/user');
				} else if (user[0].type == 0) {
					userType = 0;
					res.redirect('/admin');
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

app.get('/user', function(req, res) {
	if (req.session.loggedin && userType == 1) {
		var context = {};
		return res.render('user', context);
	} else {
		res.send('Please login to view this page!');
	}
	res.end();
});

app.get('/award', function(req, res, next) {
        if (req.session.loggedin && userType == 1) {
                var context = {};
                res.render('award', context); 
                connection.query('insert into awards (winnerName, winnerLastName, createdBy, dateCreated, dateGiven) values (?,?,"do","2019-12-07","2019-12-07")', [req.body.firstname, req.body.lastname], function(error, results, fields){
                	if(error){
					next(error);
					return;
				}
				res.redirect('/awardHist'); 
     		
     	});
        } else {
                res.send('Please login to view this page!');
                res.end();
        }
});

app.get('/awardhist', function(req, res, next) {
        if (req.session.loggedin && userType == 1) {
                var context = {};
                connection.query('SELECT * FROM awards', function(error, results, fields){
				if(error){
					next(error);
					return;
				}
				context.awards = results;
				res.render('awardHist', context);  
     		
     	});
            
        } else {
                res.send('Please login to view this page!');
        
        res.end();
    }
});

app.get('/admin', function(req, res) {
        if (req.session.loggedin && userType == 0) {
                var context = {};
                return res.render('admin', context);
        } else {
                res.send('Please login to view this page!');
        }
        res.end();
});

app.get('/adduser', function(req, res) {
        if (req.session.loggedin && userType == 0) {
                var context = {};
                return res.render('addUser', context);
        } else {
                res.send('Please login to view this page!');
        }
        res.end();
});

app.get('/addadmin', function(req, res) {
        if (req.session.loggedin && userType == 0) {
                var context = {};
                return res.render('addAdmin', context);
        } else {
                res.send('Please login to view this page!');
        }
        res.end();
});

app.get('/reports', function(req, res) {
        if (req.session.loggedin && userType == 0) {
                var context = {};
                return res.render('reports', context);
        } else {
                res.send('Please login to view this page!');
        }
        res.end();
});

app.get('/addnewuser', function(req, res) {
        if (req.session.loggedin && userType == 0) {
                var context = {};
                return res.render('addNewUser', context);
        } else {
                res.send('Please login to view this page!');
        }
        res.end();
});

app.get('/addnewadmin', function(req, res) {
        if (req.session.loggedin && userType == 0) {
                var context = {};
                return res.render('addNewAdmin', context);
        } else {
                res.send('Please login to view this page!');
        }
        res.end();
});

app.get('/logout', function(req, res, next) {
	if (req.session) {
		// delete session object
		req.session.destroy(function(err) {
			if(err) {
				return next(err);
			} else {
				return res.redirect('/');
			}
		});
	}
});

app.listen(PORT, function() {
	console.log(`Listening on ${ PORT }`);
});
