'use strict';

let mongoose = require('mongoose');

let Schema = mongoose.Schema;
let Repo = new Schema({
    name: String,
    url: String,
    totIssues: Number,
    parent: String,
    totForks: Number,
    totWatchers: Number,
    totCollaborators: Number,
    stats: {}
}/*, {collection: 'repository'}*/);

module.exports = mongoose.model('Repos', Repo);
