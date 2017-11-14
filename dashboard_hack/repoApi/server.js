var express = require('express'),
    app = express(),
    port = process.env.PORT || 3000,
    mongoose = require('mongoose'),
    Repo = require('./api/models/repoModel'),
    bodyParser = require('body-parser');

let config = require('./api/config');

//mongoose instance connnection url connection
mongoose.Promise = global.Promise;
// mongoose.connect('mongodb://localhost:27017/dashboard', {useMongoClient:true});
mongoose.connect('mongodb://' + config.mLabUser + ':' + config.mLabPsw +'@' + config.mLabDB +'.mlab.com:49025/dashboard', {useMongoClient:true});


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var routes = require('./api/routes/apiRoutes');
routes(app);

app.use(function(req, res){
	res.status(404).send({url: req.originalUrl + ' not found'});
});



app.listen(port);
console.log('RESTful API server started on port: ' + port);