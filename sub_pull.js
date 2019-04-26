/* Name: sub_pull.js
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

    // Get issues to populate in dropdown
    function getComics(res, mysql, context, complete){
        sql = "SELECT pull_box_id AS pbid, CONCAT(title, ' ', IFNULL(issue_descriptor, ''), ' #', issue_number) AS comic_issue FROM pull_box_comic INNER JOIN comic_series ON pull_box_comic.cid = comic_series.comic_id;";
        mysql.pool.query(sql, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end()
            }
            context.issues = results
            complete();
        });
    }

    // Get subs with their pulls
    function getSubsWithPulls(res, mysql, context, complete){
        sql = "SELECT sid, pbid, CONCAT(first_name, ' ', last_name) AS name, CONCAT(title, ' ', IFNULL(issue_descriptor, ''), ' #', issue_number) AS comic_issue FROM sub_pull_list INNER JOIN subscriber ON sub_pull_list.sid = subscriber.subscriber_id INNER JOIN pull_box_comic ON sub_pull_list.pbid = pull_box_comic.pull_box_id INNER JOIN comic_series ON pull_box_comic.cid = comic_series.comic_id;"
		mysql.pool.query(sql, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end()
            }
            context.subs_with_pulls = results
            complete();
        });
    }
  
	// Get a single sub/pull pair to update
	function getSinglePull(res, mysql, context, sid, pbid, complete){
        var sql = "SELECT sid, pbid, CONCAT(first_name, ' ', last_name) AS name FROM sub_pull_list INNER JOIN subscriber ON sub_pull_list.sid = subscriber.subscriber_id WHERE sid = ? AND pbid = ?";
        var inserts = [sid, pbid];
        mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.singlepull = results[0];
            complete();
        });
    }
  
  
    /* List subs with comics along with displaying a form to associate a sub with multiple comics */
    router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleter.js"];
        var mysql = req.app.get('mysql');
        var handlebars_file = 'sub_pull'

        getSubs(res, mysql, context, complete);
        getComics(res, mysql, context, complete);
        getSubsWithPulls(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 3){
                res.render(handlebars_file, context);
            }
        }
    });
	
	/* Display one subscriber for the specific purpose of updating it */
	router.get('/:sid/:pbid', function(req, res){
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["selecter.js", "updater.js"];
        var mysql = req.app.get('mysql');
        getSinglePull(res, mysql, context, req.params.sid, req.params.pbid, complete);
		getSubs(res, mysql, context, complete);
		getComics(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 3){
                res.render('sub_pull_update', context);
            }

        }
    });

    /* Associate comic or comics with a sub and then redirect to the sub_series page after adding */
    router.post('/', function(req, res){
        var mysql = req.app.get('mysql'); 
        var issueset = req.body.issue
        var sub = req.body.sid
		if (Array.isArray(issueset)) {
			for (let issue of issueset) {
			  console.log("Processing issue id " + issue)
			  var sql = "INSERT INTO sub_pull_list (sid, pbid) VALUES (?, ?);";
			  var inserts = [sub, issue];
			  sql = mysql.pool.query(sql, inserts, function(error, results, fields){
				if(error){
					console.log(error)
				}
			  });
			} //for loop ends here 
		}
		else {
			console.log("Processing issue id " + issueset)
			var sql = "INSERT INTO sub_pull_list (sid, pbid) VALUES (?, ?);";
			var inserts = [sub, issueset];
			sql = mysql.pool.query(sql, inserts, function(error, results, fields){
				if(error){
					console.log(error)
				}
			});
		}
        res.redirect('/sub_pull');
    });
	
	/* The URI that update data is sent to in order to update a pull/sub relationship */
    router.put('/:sid/:pbid', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "UPDATE sub_pull_list SET sid=?, pbid=? WHERE sid=? AND pbid=?;";
		var inserts = [req.body.name, req.body.issues, req.params.sid, req.params.pbid];
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

    /* Delete a sub's pull record */
    /* This route will accept a HTTP DELETE request in the form
     * /sid/{{sid}}/pbid/{{pbid}} -- which is sent by the AJAX form 
     */
    router.delete('/sid/:sid/pbid/:pbid', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM sub_pull_list WHERE sid = ? AND pbid = ?;";
        var inserts = [req.params.sid, req.params.pbid];
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