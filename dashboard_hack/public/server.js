'use strict';

var http = require('http');
var handlebars = require('handlebars');
//var octicons = require("octicons");
var fs = require('fs');
const port = 8080;
var outputHtml = '';
var dbResponse = null;

const requestHandler = (request, response) => {
	console.log(request.url);
	if(request.url == '/'){
		//repoListCall();

		const options = {
	        hostname: 'localhost',
	        port: 3000,
	        path: '/repos',
	        method: 'GET',
	        headers: {
	            'Content-Type': 'application/json'
	        }
	    };

	    const req = http.request(options, function (res) {
	    	//console.log("ciaociao");
	        let body = '';
	        //let dbResponse;
	        res.on('data', function (resData) {
	            body += resData;
	        });
	        res.on('end', function () {
	            dbResponse = JSON.parse(body);
	            //console.log(dbResponse);
	            body = '';
	           	//load and render template
	            //fs.readFile('public/index.hbs', 'utf-8', function(error, data){
	            //	if (!error) {
	            //		var source = data.toString();
	            //		renderSource(source, {reposList: encodeURIComponent(JSON.stringify(dbResponse))});
				//	}
				//	else{
				//		console.log(error);
				//	}
				//});
				fs.readFile('public/index.hbs', 'utf-8', function(err, data) {
    				if (!err) {
    					response.writeHead(200, {'Content-Type': 'text/html'});
    					//response.header("Access-Control-Allow-Origin", "*");
   						//response.header("Access-Control-Allow-Headers", "X-Requested-With");
    					var source = data.toString();
						renderSource(source, {reposList: encodeURIComponent(JSON.stringify(dbResponse))});
						//response.write(encodeURIComponent(JSON.stringify(dbResponse)));
						//response.json();
						response.write(outputHtml);
						response.end();
					}
					else{
						console.log(err);
					}
				});
	        });
	    });

	    req.on('error', (e) => {
	        console.error(e);
	    });

    	req.end();

	}
	else if(request.url == "/css/style.css"){
		fs.readFile('public/css/style.css', function(err, page) { 
			response.writeHead(200, {'Content-Type': 'text/css'});
			response.write(page); 
			response.end();
		});
	}
	else if(request.url == "/js/dashboard.js"){
		fs.readFile('public/js/dashboard.js', function(err, page) { 
			response.writeHead(200, {'Content-Type': 'text/js'});
			response.write(page); 
			response.end();
		});
	}
	else {
            response.writeHead(301,
              {Location: '/'}
            );
            response.end();
        }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
});


function renderSource(source, data) {
	  var template = handlebars.compile(source);
	  outputHtml = template(data);
	  //console.log(outputHtml);
	}