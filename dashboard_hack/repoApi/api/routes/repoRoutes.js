'use strict';

module.exports = function(app){
	var repo = require('../controllers/repoController');

	//dbWriter Routes
	app.route('/repos')
		.get(repo.list_all_repos)
		.post(repo.create_a_repo);

	app.route('/repos/:repoName')
		.get(repo.read_a_repo)
		.put(repo.update_a_repo)
		.delete(repo.delete_a_repo);
};