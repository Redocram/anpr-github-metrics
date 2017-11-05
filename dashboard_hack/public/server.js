'use strict';

const http = require('http');
const Handlebars = require('handlebars');
const port = 8080;
let result;
let fs = require('fs');
let repoList;

const requestHandler = (request, response) => {
    console.log(request.url);
    response.writeHead(200, {'Content-Type': 'text/html'});
    repoListCall(function(err, data) {
        if (err) {
            response.writeHead(404, {'Content-type': 'text/plan'});
            response.write('Page Was Not Found');
            response.end();
        } else {
            response.writeHead(200);
            response.write('ciao');
            console.log('data');
            response.end();
        }
    });


}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }

    console.log(`server is listening on ${port}`);
})

function repoListCall(callback){
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

    const req = http.request(options, function (res) {

        let body = '';
        res.on('data', function (resData) {
            body += resData;
        });
        res.on('end', function () {
            repoList = JSON.parse(body);
            body = '';

            //load and render template
            try {
                fs.readFile('./index.html', 'utf8', function (err,source) {
                    if (err) {
                        return console.log(err);
                    }
                    var template = Handlebars.compile(source);
                    result = template(repoList);
                });
                console.log('fatto');
            } catch (ex) {
                console.log(ex);
            }
        });
        res.on('end', callback);

    });

    req.on('error', (e) => {
        console.error(e);
    });
    //req.write();

    req.end();
}