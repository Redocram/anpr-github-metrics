'use strict';

const http = require('http');
var handlebars = require('handlebars');
var fs = require('fs');
const port = 8080;
var outputHtml = '';

const requestHandler = (request, response) => {
	//console.log(request.url);
	if(request.url == '/'){
		response.writeHead(200, {'Content-Type': 'text/html'});
		repoListCall();
		response.write(outputHtml);
		response.end();
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
})

function repoListCall(){
	const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/repos',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, workOnDbResponse);

    req.on('error', (e) => {
        console.error(e);
    });

    req.end();

    function workOnDbResponse(res) {
        let body = '';
        let dbResponse; /*= {
        	reposList: []
        };*/
        res.on('data', function (resData) {
            body += resData;
        });
        res.on('end', function () {
            dbResponse/*.reposList*/ = JSON.parse(body);
            body = '';
           	//load and render template
            fs.readFile('public/index.hbs', 'utf-8', function(error, data){
            	if (!error) {
            		var source = data.toString();
            		renderSource(source, {reposList: /*encodeURIComponent(JSON.stringify(*/dbResponse/*))*/});
				}
				else{
					console.log(error);
				}
			});
        });
    }

    function renderSource(source, data) {
	  var template = handlebars.compile(source);
	  outputHtml = template(data);
	  //console.log(outputHtml);
	}
}