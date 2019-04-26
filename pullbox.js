/* Name: pullbox.js
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
	
	// Get pullbox comics for display
	function getPullbox(res, mysql, context, complete){
        mysql.pool.query("SELECT pull_box_id AS id, title, issue_number, IFNULL(issue_descriptor, '') AS issue_descriptor, cost FROM pull_box_comic INNER JOIN comic_series ON pull_box_comic.cid = comic_series.comic_id;", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.pullbox = results;
            complete();
        });
    }

	// Get a single pull comic for update
    function getPull(res, mysql, context, id, complete){
        var sql = "SELECT pull_box_id AS id, cid, title, issue_number, IFNULL(issue_descriptor, '') AS issue_descriptor, cost FROM pull_box_comic INNER JOIN comic_series ON pull_box_comic.cid = comic_series.comic_id WHERE pull_box_id = ?;";
        var inserts = [id];
        mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.pull = results[0];
            complete();
        });
    }

    /*Display all pull comics. Requires web based javascript to delete users with AJAX*/
    router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleter.js"];
        var mysql = req.app.get('mysql');
        getPullbox(res, mysql, context, complete);
		getTitles(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 2){
                res.render('pullbox', context);
            }

        }
    });

    /* Display one pull comic for the specific purpose of updating it */
    router.get('/:id', function(req, res){
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["selecter.js", "updater.js"];
        var mysql = req.app.get('mysql');
        getPull(res, mysql, context, req.params.id, complete);
		getTitles(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 2){
                res.render('pullbox_update', context);
            }

        }
    });

    /* Adds a pull comic, redirects to the pullbox page after adding */
    router.post('/', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO pull_box_comic (cid, issue_number, issue_descriptor, cost) VALUES (?, ?, ?, ?);";
        var inserts = [req.body.title, req.body.issue_number, req.body.issue_descriptor, req.body.cost];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.redirect('/pullbox');
            }
        });
    });

    /* The URI that update data is sent to in order to update a pull comic */
    router.put('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "UPDATE pull_box_comic SET cid=?, issue_number=?, issue_descriptor=?, cost=? WHERE pull_box_id=?";
        var inserts = [req.body.title, req.body.issue_number, req.body.issue_descriptor, req.body.cost, req.params.id];
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

    /* Route to delete a pull comic, simply returns a 202 upon success. Ajax will handle this. */
    router.delete('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM pull_box_comic WHERE pull_box_id = ?;";
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