'use strict';
let http = require('http');
let app = require('./app')

http.createServer(app.handleRequest).listen(8080);



// 'use strict';
//
// const http = require('http');
// const Handlebars = require('handlebars');
// const port = 8080;
// let result;
// let fs = require('fs');
// let repos;
//
// const requestHandler = (request, response) => {
//     console.log(request.url);
//     response.writeHead(200);
//     repoListCall(function() {
//             response.writeHead(200, {'Content-Type': 'text/html'});
//             // response.write(JSON.stringify(repos));
//         try {
//             fs.readFile('./index.html', 'utf8', function (err,data) {
//                 if (err) {
//                     response.writeHead(404);
//                     response.write('File not found!')
//                     return console.log(err);
//                 }else{
//                     response.write(data);
//                     // let source = data.toString();
//                     // var template = Handlebars.compile(source);
//                     // result = template(repos);
//                     // let outputHtml = template(repos);
//                     //response.write();
//                 }
//                 response.end();
//             });
//         } catch (ex) {
//             console.log(ex);
//         }
//     });
//
//
// }
//
// const server = http.createServer(requestHandler);
//
// server.listen(port, (err) => {
//     if (err) {
//         return console.log('something bad happened', err);
//     }
//
//     console.log(`server is listening on ${port}`);
// })
//
// function repoListCall(callback){
//     const options = {
//         hostname: 'localhost',
//         port: 3000,
//         path: '/repos',
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json'/*,
//             'Connection' : 'keep-alive',
//             'User-Agent' : 'My-Agent'*/
//         }
//     };
//
//     const req = http.request(options, function (res) {
//
//         let body = '';
//         res.on('data', function (resData) {
//             body += resData;
//         });
//         res.on('end', function () {
//             repos = JSON.parse(body);
//             body = '';
//
//             //load and render template
//             // try {
//             //     fs.readFile('./index.html', 'utf8', function (err,source) {
//             //         if (err) {
//             //             return console.log(err);
//             //         }
//             //         var template = Handlebars.compile(source);
//             //         result = template(repos);
//             //     });
//             //     console.log('fatto');
//             // } catch (ex) {
//             //     console.log(ex);
//             // }
//         });
//         res.on('end', callback);
//
//     });
//
//     req.on('error', (e) => {
//         console.error(e);
//     });
//     //req.write();
//
//     req.end();
// }