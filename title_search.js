/* Name: title_search.js
 * Description: Contains functions to query SQL database and route handlers to display search results
 * Date: 06-11-18
 * Source: Code adapted from https://github.com/knightsamar/CS340-Sample-Web-App
 * 
 * Uses express, dbcon for database connection, body parser to parse 
 * form data, handlebars for HTML templates  
*/

module.exports = function(){
    var express = require('express');
    var router = express.Router();

	//Perform search and save results in context
	function getSearch(res, mysql, context, search, complete){
        var sql = "SELECT comic_id AS id, title, publisher, IFNULL(total_subscribers, 0) AS total_subscribers, (CASE WHEN active = 1 THEN 'Yes' ELSE 'No' END) AS active FROM comic_series c LEFT JOIN (SELECT cid, COUNT(cid) AS total_subscribers FROM sub_comics INNER JOIN comic_series ON sub_comics.sid = comic_series.comic_id GROUP BY cid) t ON c.comic_id = t.cid WHERE title LIKE '%" + search + "%';";
		var inserts = [search];
        mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.searchResult = results;
            complete();
        });
    }
	
	//Route to display search results
	router.post('/', function(req, res){
        callbackCount = 0;
		var context = {};
        var mysql = req.app.get('mysql');
        getSearch(res, mysql, context, req.body.searchTerm, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 1){
                res.render('results', context);
            }

        }
    });
	
	//Route for initial search page
	router.get('/', function(req, res){
        var callbackCount = 0;
        var mysql = req.app.get('mysql');
        res.render('title_search');
    });
	
	return router;
}();