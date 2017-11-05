'use strict';

const http = require('http');
var handlebars = require('handlebars');
var fs = require('fs');
const port = 8080;
var outputHtml = '';

const requestHandler = (request, response) => {
	//console.log(request);
	response.writeHead(200, {'Content-Type': 'text/html'});
	repoListCall();
	response.end(outputHtml);

	/*fs.readFile('/js/dashboard.js', function (err, data) {
		if (err) console.log(err);
		response.writeHead(200, {'Content-Type': 'text/javascript'});
		response.write(data);
		response.end();
	});*/

	/*fs.readFile('css/style.css', function (err, data) {
		if (err) console.log(err);
		response.writeHead(200, {'Content-Type': 'text/css'});
		response.write(data);
		response.end();
	});*/
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
        let repoList = null;
        res.on('data', function (resData) {
            body += resData;
        });
        res.on('end', function () {
            repoList = JSON.parse(body);
            body = '';
           	//load and render template
            fs.readFile('./index.hbs', 'utf-8', function(error, data){
            	if (!error) {
            		var source = data.toString();
            		renderSource(source, repoList);
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
	}
}