'use strict';

var mongoose = require('mongoose'),
	Repo = mongoose.model('Repos');

exports.list_all_repos = function(req, res){
	Repo.find({}, function(err, repo){
		if(err)
			res.send(err);
		res.json(repo);
	});
};

exports.create_a_repo = function(req, res){
	var new_repo = new Repo(req.body);
	new_repo.save(function(err, repo){
		if(err)
			res.send(err);
		res.json(repo);
	});
};

exports.read_a_repo = function(req, res){
	Repo.findById(req.params.repoId, function(err, repo){
		if(err)
			res.send(err);
		res.json(repo);
	});
};

exports.update_a_repo = function(req, res){
	Repo.update({name: req.params.repoName}, req.body, { upsert : true }, function(err, repo){
		if(err)
			res.send(err);
		res.json(repo);
    });
};

exports.delete_a_repo = function(req, res){
	Repo.remove({_id: req.params.repoId}, function(err, repo){
		if(err)
			res.send(err);
		res.json({message: 'Repo successfully deleted'});
	});
};