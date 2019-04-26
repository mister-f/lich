/* Name: upcoming.js
 * Description: Contains functions to query SQL database and route handlers to list/remove/add/update rows
 * Date: 06-11-18
 * Source: Code adapted from https://github.com/knightsamar/CS340-Sample-Web-App
 * 
 * Uses express, dbcon for database connection, body parser to parse 
 * form data, handlebars for HTML templates  
*/

module.exports = function(){
    var express = require('express');
    var router = express.Router();

	// Get comic titles to populate dropdown
    function getTitles(res, mysql, context, complete){
        mysql.pool.query("SELECT comic_id AS id, title FROM comic_series;", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.titles  = results;
            complete();
        });
    }
	
	// Get upcoming comics for display
	function getUpcoming(res, mysql, context, complete){
        mysql.pool.query("SELECT upcoming_id AS id, title, issue_number, IFNULL(issue_descriptor, '') AS issue_descriptor, DATE_FORMAT(release_date, \"%Y-%m-%d\") AS release_date FROM upcoming_comic INNER JOIN comic_series ON upcoming_comic.cid = comic_series.comic_id;", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.upcoming = results;
            complete();
        });
    }

	// Get a single upcoming comic for update
    function getSingleUp(res, mysql, context, id, complete){
        var sql = "SELECT upcoming_id AS id, cid, title, issue_number, IFNULL(issue_descriptor, '') AS issue_descriptor, DATE_FORMAT(release_date, \"%Y-%m-%d\") AS release_date FROM upcoming_comic INNER JOIN comic_series ON upcoming_comic.cid = comic_series.comic_id WHERE upcoming_id = ?;";
        var inserts = [id];
        mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.singleup = results[0];
            complete();
        });
    }

    /*Display all upcoming comics. Requires web based javascript to delete users with AJAX*/
    router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleter.js"];
        var mysql = req.app.get('mysql');
        getUpcoming(res, mysql, context, complete);
		getTitles(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 2){
                res.render('upcoming', context);
            }

        }
    });

    /* Display one upcoming comic for the specific purpose of updating it */
    router.get('/:id', function(req, res){
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["selecter.js", "updater.js"];
        var mysql = req.app.get('mysql');
        getSingleUp(res, mysql, context, req.params.id, complete);
		getTitles(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 2){
                res.render('upcoming_update', context);
            }

        }
    });

    /* Adds an upcoming comic, redirects to the upcoming page after adding */
    router.post('/', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO upcoming_comic (cid, issue_number, issue_descriptor, release_date) VALUES (?, ?, ?, ?);";
        var inserts = [req.body.title, req.body.issue_number, req.body.issue_descriptor, req.body.release_date];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.redirect('/upcoming');
            }
        });
    });

    /* The URI that update data is sent to in order to update a upcoming comic */
    router.put('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "UPDATE upcoming_comic SET cid=?, issue_number=?, issue_descriptor=?, release_date=? WHERE upcoming_id=?";
        var inserts = [req.body.title, req.body.issue_number, req.body.issue_descriptor, req.body.release_date, req.params.id];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(error)
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.status(200);
                res.end();
            }
        });
    });

    /* Route to delete an upcoming comic, simply returns a 202 upon success. Ajax will handle this. */
    router.delete('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM upcoming_comic WHERE upcoming_id = ?;";
        var inserts = [req.params.id];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            }else{
                res.status(202).end();
            }
        })
    })

    return router;
}();