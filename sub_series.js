/* Name: sub_series.js
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

    // Get subscribers to populate in dropdown
    function getSubs(res, mysql, context, complete){
        mysql.pool.query("SELECT subscriber_id AS sid, first_name, last_name FROM subscriber", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.subs = results;
            complete();
        });
    }

    // Get comics to populate in dropdown
    function getComics(res, mysql, context, complete){
        sql = "SELECT comic_id AS cid, title FROM comic_series;";
        mysql.pool.query(sql, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end()
            }
            context.comics = results
            complete();
        });
    }

    // Get subs with their comics
    function getSubsWithComics(res, mysql, context, complete){
        sql = "SELECT sid, cid, CONCAT(first_name, ' ', last_name) AS name, title, DATE_FORMAT(subscription_date, \"%Y-%m-%d\") AS subscription_date FROM sub_comics INNER JOIN subscriber ON sub_comics.sid = subscriber.subscriber_id INNER JOIN comic_series ON sub_comics.cid = comic_series.comic_id ORDER BY name, title;"
		mysql.pool.query(sql, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end()
            }
            context.subs_with_comics = results
            complete();
        });
    }
  
	// Get a single sub/series pair to update
	function getSingleSub(res, mysql, context, sid, cid, complete){
        var sql = "SELECT sid, cid, CONCAT(first_name, ' ', last_name) AS name, DATE_FORMAT(subscription_date, \"%Y-%m-%d\") AS subscription_date FROM sub_comics INNER JOIN subscriber ON sub_comics.sid = subscriber.subscriber_id WHERE sid = ? AND cid = ?";
        var inserts = [sid, cid];
        mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.singlesub = results[0];
            complete();
        });
    }
  
  
    /* List subs with comics along with displaying a form to associate a sub with multiple comics*/
    router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleter.js"];
        var mysql = req.app.get('mysql');
        var handlebars_file = 'sub_series'

        getSubs(res, mysql, context, complete);
        getComics(res, mysql, context, complete);
        getSubsWithComics(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 3){
                res.render(handlebars_file, context);
            }
        }
    });
	
	/* Display one subscriber for the specific purpose of updating it */
	router.get('/:sid/:cid', function(req, res){
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["selecter.js", "updater.js"];
        var mysql = req.app.get('mysql');
        getSingleSub(res, mysql, context, req.params.sid, req.params.cid, complete);
		getSubs(res, mysql, context, complete);
		getComics(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 3){
                res.render('sub_series_update', context);
            }

        }
    });

    /* Associate comic or comics with a sub and then redirect to the sub_series page after adding */
    router.post('/', function(req, res){
        var mysql = req.app.get('mysql'); 
        var comicset = req.body.series;
        var sub = req.body.sid;
		var date = req.body.subscription_date;
		console.log(req.body);
		if (Array.isArray(comicset)) {
			for (let comic of comicset) {
			  console.log("Processing comic id " + comic)
			  var sql = "INSERT INTO sub_comics (sid, cid, subscription_date) VALUES (?, ?, ?);";
			  var inserts = [sub, comic, date];
			  sql = mysql.pool.query(sql, inserts, function(error, results, fields){
				if(error){
					console.log(error)
				}
			  });
			} //for loop ends here 
		}
		else {
			console.log("Processing comic id " + comicset)
			var sql = "INSERT INTO sub_comics (sid, cid, subscription_date) VALUES (?, ?, ?);";
			var inserts = [sub, comicset, date];
			sql = mysql.pool.query(sql, inserts, function(error, results, fields){
				if(error){
					console.log(error)
				}
			});
		}
        res.redirect('/sub_series');
    });
	
	/* The URI that update data is sent to in order to update a series */
    router.put('/:sid/:cid', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "UPDATE sub_comics SET sid=?, cid=?, subscription_date=? WHERE sid=? AND cid=?;";
		var inserts = [req.body.name, req.body.series, req.body.subscription_date, req.params.sid, req.params.cid];
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

    /* Delete a sub's comic record */
    /* This route will accept a HTTP DELETE request in the form
     * /sid/{{sid}}/cid/{{cid}} -- which is sent by the AJAX form 
     */
    router.delete('/sid/:sid/cid/:cid', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM sub_comics WHERE sid = ? AND cid = ?;";
        var inserts = [req.params.sid, req.params.cid];
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