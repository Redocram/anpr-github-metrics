var schedule = require('node-schedule');
 
var j = schedule.scheduleJob('*/1 * * * *', function(){
  console.log('The answer to life, the universe, and everything!' + new Date());	//per il momento scrive ogni minuto un console.log
});