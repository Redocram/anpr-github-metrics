'use strict';

const http = require('http');
const handlebars = require('handlebars');
const port = 8080;

const requestHandler = (request, response) => {
  console.log(request.url);
  repoListCall();
  //response.end('Hello Node.js Server!');
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
            'Content-Type': 'application/json'/*,
            'Connection' : 'keep-alive',
            'User-Agent' : 'My-Agent'*/
        }
    };

    const req = http.request(options, workOnDbResponse);

    req.on('error', (e) => {
        console.error(e);
    });
    //req.write();

    req.end();

    function workOnDbResponse(res) {
        let body = '';
        let repoList;
        res.on('data', function (resData) {
            body += resData;
        });
        res.on('end', function () {
            repoList = JSON.parse(body);
            body = '';

           	//load and render template
            try {
    			var source = require('./index.html');
				var template = Handlebars.compile(source);
				var result = template(repoList);
			} catch (ex) {
    			console.log(ex);
			}
        });
    }
}