const express = require('express');
const app = express();

app.use(express.static('dashboard_hack'));

app.listen(5000, function () {
  console.log('Example app listening on port 3000!')
});
///QUESTO CODICE FUNZIONA MA CARICA SOLO IL FILE html SENZA IMMAGINI

// var http = require('http'),
// fs = require('fs');

// fs.readFile('dashboard_hack/dashboard.html', function (err, html) {
// if (err) {
//     throw err; 
// }       
// http.createServer(function(request, response) {  
//     response.writeHeader(200, {"Content-Type": "text/html"});  
//     response.write(html);  
//     response.end();  
// }).listen(8000);
// });

///CODICE DI ESEMPIO DI HEROKU

// var cool = require('cool-ascii-faces');
// var express = require('express');
// var app = express();
// var pg = require('pg');

// app.get('/db', function (request, response) {
//   pg.connect(process.env.DATABASE_URL, function(err, client, done) {
//     client.query('SELECT * FROM test_table', function(err, result) {
//       done();
//       if (err)
//        { console.error(err); response.send("Error " + err); }
//       else
//        { response.render('pages/db', {results: result.rows} ); }
//     });
//   });
// });

// app.set('port', (process.env.PORT || 5000));

// app.use(express.static(__dirname + '/public'));

// // views is directory for all template files
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');

// app.get('/', function(request, response) {
//   response.render('pages/index');
// });

// app.get('/cool', function(request, response) {
//   response.send(cool());
// });

// app.listen(app.get('port'), function() {
//   console.log('Node app is running on port', app.get('port'));
// });