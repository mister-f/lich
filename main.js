/*
 * Name: main.js
 * Date: 05-17-18
 * Source: Code adapted from https://github.com/knightsamar/CS340-Sample-Web-App
 * 
 * Uses express, dbcon for database connection, body parser to parse 
 * form data  handlebars for HTML templates  
*/

var express = require('express');
var mysql = require('./dbcon.js');
var bodyParser = require('body-parser');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.use(bodyParser.urlencoded({extended:true}));
app.use('/static', express.static('public'));
app.set('view engine', 'handlebars');
app.set('port', 18475);
app.set('mysql', mysql);

app.use('/subscribers', require('./subscribers.js'));
app.use('/series', require('./series.js'));
app.use('/upcoming', require('./upcoming.js'));
app.use('/pullbox', require('./pullbox.js'));
app.use('/sub_series', require('./sub_series.js'));
app.use('/sub_pull', require('./sub_pull.js'));
app.use('/title_search', require('./title_search.js'));
app.use('/', express.static('public'));

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
