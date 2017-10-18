console.log("porcospino");

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var port = 3000;
var Issue = require('models/issues');




function update(obj){
    var id = obj._id;
    Item.findById(id, function (err, item) {
        if(!item){
            item.save().then(function (item) {
                console.log('salvato');
            }).catch(function (err) {
                //res.status(400).send("unable to save to database");
            });
        }else{
            item.item = req.body.item;
            item.save().then(function (item) {
                console.log('salvato');
            }).catch(function (err) {
                //res.status(400).send("unable to update the database");
            });
        }
    });
}

window.open('dashboard.html');
