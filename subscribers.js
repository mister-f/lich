/* Name: subscribers.js
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

	/* Get all subscribers for display */
    function getSubs(res, mysql, context, complete){
        mysql.pool.query("SELECT subscriber_id AS id, first_name, last_name, email, IFNULL(discount, 0) AS discount FROM subscriber s LEFT JOIN (SELECT sid, COUNT(sid) AS discount FROM sub_comics INNER JOIN subscriber ON sub_comics.sid = subscriber.subscriber_id GROUP BY sid) d ON s.subscriber_id = d.sid;", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.subscribers = results;
            complete();
        });
    }
	
	/* Display one person for the specific purpose of updating it */
    function getSub(res, mysql, context, id, complete){
        var sql = "SELECT subscriber_id AS id, first_name, last_name, email FROM subscriber WHERE subscriber_id = ?";
        var inserts = [id];
        mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.sub = results[0];
            complete();
        });
    }

    /*Display all people. Requires web based javascript to delete users with AJAX*/
    router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleter.js"];
        var mysql = req.app.get('mysql');
        getSubs(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 1){
                res.render('subscribers', context);
            }

        }
    });

    /* Display one person for the specific purpose of updating people */
    router.get('/:id', function(req, res){
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["updater.js"];
        var mysql = req.app.get('mysql');
        getSub(res, mysql, context, req.params.id, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 1){
                res.render('sub_update', context);
            }

        }
    });

    /* Adds a person, redirects to the subscribers page after adding */
    router.post('/', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO subscriber (first_name, last_name, email) VALUES (?, ?, ?)";
        var inserts = [req.body.first_name, req.body.last_name, req.body.email];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.redirect('/subscribers');
            }
        });
    });

    /* The URI that update data is sent to in order to update a person */
    router.put('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "UPDATE subscriber SET first_name=?, last_name=?, email=? WHERE subscriber_id=?";
        var inserts = [req.body.first_name, req.body.last_name, req.body.email, req.params.id];
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

    /* Route to delete a person, simply returns a 202 upon success. Ajax will handle this. */
    router.delete('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM subscriber WHERE subscriber_id = ?";
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