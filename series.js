/* Name: series.js
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

	// Get comic series for diplay
    function getSeries(res, mysql, context, complete){
        mysql.pool.query("SELECT comic_id AS id, title, publisher, IFNULL(total_subscribers, 0) AS total_subscribers, (CASE WHEN active = 1 THEN 'Yes' ELSE 'No' END) AS active FROM comic_series c LEFT JOIN (SELECT cid, COUNT(cid) AS total_subscribers FROM sub_comics INNER JOIN comic_series ON sub_comics.sid = comic_series.comic_id GROUP BY cid) t ON c.comic_id = t.cid;", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.series = results;
            complete();
        });
    }

	// Get a single series for update
    function getTitle(res, mysql, context, id, complete){
        var sql = "SELECT comic_id AS id, title, publisher, active FROM comic_series WHERE comic_id = ?;";
        var inserts = [id];
        mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.title = results[0];
            complete();
        });
    }

    /*Display all series. Requires web based javascript to delete users with AJAX*/
    router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleter.js"];
        var mysql = req.app.get('mysql');
        getSeries(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 1){
                res.render('series', context);
            }

        }
    });

    /* Display one series for the specific purpose of updating it */
    router.get('/:id', function(req, res){
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["updater.js"];
        var mysql = req.app.get('mysql');
        getTitle(res, mysql, context, req.params.id, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 1){
                res.render('series_update', context);
            }

        }
    });

    /* Adds a series, redirects to the series page after adding */
    router.post('/', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO comic_series (title, publisher, active) VALUES (?, ?, ?)";
        var inserts = [req.body.title, req.body.publisher, req.body.active];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.redirect('/series');
            }
        });
    });

    /* The URI that update data is sent to in order to update a series */
    router.put('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "UPDATE comic_series SET title=?, publisher=?, active=? WHERE comic_id=?";
        var inserts = [req.body.title, req.body.publisher, req.body.active, req.params.id];
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

    /* Route to delete a series, simply returns a 202 upon success. Ajax will handle this. */
    router.delete('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM comic_series WHERE comic_id = ?";
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