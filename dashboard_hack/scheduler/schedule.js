'use strict';

var schedule = require('node-schedule');
let server = require('../githubApi/server');

var j = schedule.scheduleJob('*/1 * * * *', function(){
    console.log('Controllo repo in data: ' + new Date());
    server.github();
    //console.log('On idle...');
});