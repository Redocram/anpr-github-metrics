'use strict';

//let fs = require('fs');
let mongoose = require('mongoose');




/*if (fs.existsSync('reposFinale.json')){
    fs.readFile('reposFinale.json', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }else{
            data = JSON.parse(data);
            dbConnection(data);
        }
    });
}*/

//function dbConnection(data) {
//    let db = mongoose.connect('mongodb://localhost:27017/dashboard', {useMongoClient:true});
    let Schema = mongoose.Schema;
    let Repo = new Schema({
        name: String,
        url: String,
        totIssues: Number,
        stats: {}
    }/*, {collection: 'repository'}*/);

    module.exports = mongoose.model('Repos', Repo);

    //let repository = db.model('Repos');
    //truncateCollection(db);
    //updateCollection(data, repository);

//}

/*function updateCollection(data, repository) {
    data.forEach(function (singleRepo) {
        let document = new repository();
        document.name = singleRepo.name;
        document.url = singleRepo.url;
        document.totIssues = singleRepo.totIssues;
        if (singleRepo.issues)
            document.issues = singleRepo.issues;
        document.save();
    });
}*/

/*function truncateCollection(db) {
    db.dropCollection('repository', function (err, result) {
        if (err){
            return console.log(err);
        }else{
            'Collection repository deleted'
        }
    })
}*/
