var mongoose = require('mongoose');
var Schema = mongoose.schema;

var Issue = new Schema({
    createAt: Number,
    labels: [String],
    firstResponseTime: Number,
    closedAt: Number,
    closeTime: Number
}, { 
    collection: 'issues' 
});

module.exports = mongoose.model('Issue', Issue);