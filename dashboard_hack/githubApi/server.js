'use strict';

module.exports.github = githubApi

    function githubApi () {
//node requires
    const https = require('https');
    const http = require('http');
    let fs = require('fs');

//initialize variables
    const AVG_DIST_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");

    let repos = [];
    let totalIssues = 0;
    let responseData = '';
    let gitHubResponse;

    let lastRead;
    let hasNextPage;

    let callNumber = 1;
    let dbTrigger = 0;

//get auth configs
    let config = require('./config.json'); //token and owner
    console.log(new Date().toLocaleString() + '\tloaded configuration file');
    console.log(new Date().toLocaleString() + '\tstarting Repos query');

//start repos calls
    apiReposCall(callNumber);

// ------------- repo calls and parse ----------------//
    function apiReposCall(callNumber) {
        if ((callNumber == 1 || hasNextPage === true)) {
            var query = JSON.stringify({
                query: "query" + (callNumber > 1 ? "($lastRead: String!)" : "") + "{" +
                config.type + "  (login: \"" + config.ownerName + "\") {" +
                "	repositories(first: 100" + (callNumber > 1 ? ", after: $lastRead" : "") + ") {" +
                "		pageInfo{" +
                "			endCursor" +
                "			hasNextPage" +
                "		}" +
                "		nodes {" +
                "			name" +
                "			url" +
                "           watchers{" +
                "               totalCount" +
                "           }" +
                "           collaborators{" +
                "               totalCount" +
                "           }" +
                "           parent{" +
                "               url" +
                "           }" +
                "           forks{" +
                "               totalCount" +
                "           }" +
                "			issues{" +
                "				totalCount" +
                "			}" +
                "		}" +
                "	}" +
                "  }" +
                "}",
                variables: {lastRead: lastRead}
            });

            const options = {
                hostname: 'api.github.com',
                path: '/graphql?access_token=' + config.userToken,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Connection': 'keep-alive',
                    'User-Agent': 'My-Agent'
                }
            };

            const req = https.request(options, workOnResponse);

            req.on('error', (e) => {
                console.error(e);
            });
            req.write(query);

            req.end();


        }
    }

    function workOnResponse(res) {
        //console.log('statusCode:', res.statusCode);
        //console.log('headers:', res.headers);
        let body = '';
        res.on('data', function (resData) {
            body += resData;
        });
        res.on('end', function () {
            gitHubResponse = JSON.parse(body);
            body = '';
        });
        res.on('end', fillRepos);
        res.on('end', initiliazeHasNextPageAndLastRead);
        res.on('end', gitHubResponseHasNextPage);

        function fillRepos() {
            gitHubResponse.data.organization.repositories.nodes.forEach(function (repository) {
                let currentRepo = parseRepo(repository);
                repos.push(currentRepo);
                if (currentRepo.totIssues > 0)
                    dbTrigger++;
            });
        }

        function parseRepo(repository) {
            let newRepo = {
                name: "",
                url: "",
                parent: "",
                totForks: 0,
                totIssues: 0,
                totWatcher: 0,
                totCollaborators: 0
            };

            newRepo.totIssues = repository.issues.totalCount;
            newRepo.name = repository.name;
            newRepo.url = repository.url;
            newRepo.parent = repository.parent ? repository.parent.url : "";
            newRepo.totForks = repository.forks.totalCount;
            newRepo.totForks = repository.collaborators.totalCount;
            newRepo.totForks = repository.watchers.totalCount;
            totalIssues += newRepo.totIssues;
            return newRepo;
        }

        function initiliazeHasNextPageAndLastRead() {
            hasNextPage = gitHubResponse.data.organization.repositories.pageInfo.hasNextPage;
            lastRead = gitHubResponse.data.organization.repositories.pageInfo.endCursor;
        }


        function gitHubResponseHasNextPage() {
            gitHubResponse = null;
            responseData = '';
            if (hasNextPage === true) {
                apiReposCall(++callNumber)
            }
            else {
                console.log(new Date().toLocaleString() + '\tended Repos query');
                console.log(new Date().toLocaleString() + '\tstarting Issues query');
                callNumber = 1;
                repos.forEach(function (repo) {
                    if (repo.totIssues > 0) {
                        apiIssuesCall(repo, callNumber);    //start issues calls on repos calls ended
                        gitHubResponse = null;
                        responseData = '';
                    }
                });
            }
        }
    }

// ------------- api calls and parse ----------------//
    function apiIssuesCall(repo, callNumber) {
        if ((callNumber == 1 || hasNextPage === true)) {
            //forming json request
            var query = JSON.stringify({
                query: "query" + (callNumber > 1 ? "($lastRead: String!)" : "") + "{" +
                "  repository(owner: \"" + config.ownerName + "\", name: \"" + repo.name + "\") {" +
                "    issues(first: 100" + (callNumber > 1 ? ", after: $lastRead" : "") + ") {" +
                "      pageInfo{" +
                "        endCursor" +
                "        hasNextPage" +
                "      }" +
                "      edges {" +
                "        node {" +
                "          createdAt" +
                "          closed" +
                "          labels(first: 10){" +
                "            totalCount" +
                "            nodes{" +
                "               name" +
                "            }" +
                "          }" +
                "          comments(first: 1) {" +
                "            edges{" +
                "              node{" +
                "                createdAt" +
                "              }" +
                "            }" +
                "          }" +
                "          timeline(last: 100){" +
                "            nodes {" +
                "              ... on ClosedEvent {" +
                "                createdAt" +
                "                }" +
                "            }" +
                "          }" +
                "        }" +
                "      }" +
                "    }" +
                "  }" +
                "}",
                variables: {lastRead: lastRead}
            });

            const options = {
                hostname: 'api.github.com',
                path: '/graphql?access_token=' + config.userToken,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Connection': 'keep-alive',
                    'User-Agent': 'My-Agent'
                }
            };

            const req = https.request(options, workOnIssueResponse);

            req.on('error', (e) => {
                console.error(e);
            });
            req.write(query);

            req.end();
        }

        function workOnIssueResponse(res) {

            //console.log('statusCode:', res.statusCode);
            //console.log('headers:', res.headers);

            let body = '';
            res.on('data', function (resData) {
                body += resData;
            });
            res.on('end', function () {
                gitHubResponse = JSON.parse(body);
                body = '';
            });
            res.on('end', fillRepoIssues);
            res.on('end', initiliazeIssueHasNextPageAndLastRead);
            res.on('end', issueResponseHasNextPage);

            function fillRepoIssues() {

                //if (typeof repo.issues == 'undefined') {
                    repo.issues = [];
                //}
                gitHubResponse.data.repository.issues.edges.forEach(function (issue) {
                    var currentIssue = parseIssue(issue);
                    repo.issues.push(currentIssue);
                });
            }

            function parseIssue(issue) {
                let currentIssue = {
                    createdAt: 0,
                    labels: [],
                    firstResponseTime: 0
                };

                let dateIssue = new Date(issue.node.createdAt).getTime();
                if (issue.node.labels.nodes.length > 0) {
                    currentIssue.labels = [];
                    issue.node.labels.nodes.forEach(function (label) {
                        currentIssue.labels.push(label.name);
                    });
                }

                if (issue.node.comments.edges.length != 0) {
                    let firstResponse = new Date(issue.node.comments.edges[0].node.createdAt).getTime();
                    currentIssue.firstResponseTime = firstResponse - dateIssue;
                }

                currentIssue.createdAt = dateIssue;

                if (issue.node.closed) {
                    issue.node.timeline.nodes.forEach(function (node) {
                        if (node.createdAt) {
                            currentIssue.closedAt = new Date(node.createdAt).getTime();
                            currentIssue.closeTime = currentIssue.closedAt - dateIssue;
                        }
                    });
                }

                return currentIssue;
            }

            function initiliazeIssueHasNextPageAndLastRead() {
                hasNextPage = gitHubResponse.data.repository.issues.pageInfo.hasNextPage;
                lastRead = gitHubResponse.data.repository.issues.pageInfo.endCursor;
            }

            function issueResponseHasNextPage() {
                gitHubResponse = null;
                responseData = '';
                if (hasNextPage === true) {
                    apiIssuesCall(repo, ++callNumber);
                }
                else {
                    if (--dbTrigger == 0) {
                        console.log(new Date().toLocaleString() + '\tended Issues query');
                        console.log(new Date().toLocaleString() + '\tcalculating statistics');
                        repos.forEach(function (repo) {
                            //if (repo.issues) {
                                //calculate statistics if repo has issues
                                var stats = statistics(repo.issues, AVG_DIST_STEPS);
                                repo.stats = [];
                                repo.stats = stats;
                                delete repo.issues;
                            //}
                            //delete repo.totIssues;
                        });
                        console.log(new Date().toLocaleString() + '\tendend statistics');

                        console.log(new Date().toLocaleString() + '\tstarting db update');
                        /*call the repoApi service and write to mongo*/
                        repos.forEach(function (repo) {
                            apiMongoCall(repo);
                        });
                        console.log(new Date().toLocaleString() + '\tended db update');
                        console.log('ALL PROCESSES CORRECTLY ENDED');
                        /*ONLY FOR FINAL DEBUG*/
                        /*THIS FILE IS READY TO BE WRITTEN IN A DB*/
                        // fs.appendFile("reposStats.json", JSON.stringify(repos), function(err) {
                        //      if(err) {
                        //          return console.log(err);
                        //      }
                        //
                        //  });
                    }
                }
            }
        }
    }

// -------------------- mongo repoApi calls -----------------------//
    function apiMongoCall(repo) {
        //forming json request
        var query = JSON.stringify(repo);

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/repos/' + repo.name,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'/*,
                'Connection' : 'keep-alive',
                'User-Agent' : 'My-Agent'*/
            }
        };

        const req = http.request(options, workOnDbResponse);

        req.on('error', (e) => {
            console.error(e);
        });
        req.write(query);

        req.end();
    }

    function workOnDbResponse(res) {
        let body = '';
        let dbResponse;
        res.on('data', function (resData) {
            body += resData;
        });
        res.on('end', function () {
            dbResponse = JSON.parse(body);
            body = '';
            /*ONLY FOR DEBUG*/
            // fs.appendFile("dbResponse.json", JSON.stringify(dbResponse), function(err) {
            //      if(err) {
            //          return console.log(err);
            //      }
            //  });
        });

    }

// ------------- issues statistics and utility functions ----------------//
    function statistics(arrayIssues, distributionSteps) {
        var distNumber = distributionSteps.length;
        var stats = {
            firstRespDistributed: [],
            evaluateLabels: [],
            firstRespAverage: {},
            closeDistributed: [],
            closeAverage: {},
            totalIssues: 0,
            nClosedIssues: 0,
            nClosedIssuesNoComments: 0,
            nOpenIssues: 0
        };

        if(arrayIssues){
            var firstRespAverage = 0;
            var totalCommented = 0;
            var closeAverage = 0;
            var evaluateLabels = {};

            for (var i = 0; i < distNumber; i++) {
                stats.firstRespDistributed.push(0);
                stats.closeDistributed.push(0);
            }

            stats.totalIssues = arrayIssues.length;

            arrayIssues.forEach(function (issue) {
                if (issue.firstResponseTime) {
                    firstRespAverage += issue.firstResponseTime;
                    totalCommented++;
                }

                if (issue.closeTime) {
                    closeAverage += issue.closeTime;
                    stats.nClosedIssues++;
                    if (issue.totalComments == 0)
                        stats.nClosedIssuesNoComments++;
                }
                else {
                    stats.nOpenIssues++;
                    if (issue.labels.length == 0)
                        stats.nOpenIssuesNoLabel++;
                }

                if (issue.labels.length > 0) {
                    issue.labels.forEach(function (label) {
                        if (!evaluateLabels[label]) {
                            evaluateLabels[label] = 0;
                        }
                        evaluateLabels[label]++;
                    });
                }

                var curFirstResp = issue.firstResponseTime;
                var curCloseTime = issue.closeTime;
                var oreResp = curFirstResp / 3600000;
                var oreClose = curCloseTime / 3600000;
                var esc = 0;
                for (var i = 0; i < distNumber - 1; i++) {
                    if (oreResp < distributionSteps[i]) {
                        stats.firstRespDistributed[i]++;
                        curFirstResp = null;
                        esc = 1;
                    }
                    if (oreClose < distributionSteps[i]) {
                        stats.closeDistributed[i]++;
                        curCloseTime = null;
                        esc = 1;
                    }
                    if (esc == 1)
                        break;
                }
                if (curFirstResp) {
                    stats.firstRespDistributed[distNumber - 1]++;
                }
                if (curCloseTime) {
                    stats.closeDistributed[distNumber - 1]++;
                }
            });

            stats.firstRespAverage = convertMilliseconds(Math.floor(firstRespAverage / totalCommented));
            stats.closeAverage = convertMilliseconds(Math.floor(closeAverage / stats.nClosedIssues));
            stats.evaluateLabels = evaluateLabels;
        }
        return stats;
    }

    function convertMilliseconds(ms) {
        var convertedMs = new Object();
        var ms = Math.floor(ms / 60000);
        convertedMs.Minutes = ms % 60;
        ms = Math.floor(ms / 60);
        convertedMs.Hours = ms % 24;
        ms = Math.floor(ms / 24);
        convertedMs.Days = ms % 30;
        ms = Math.floor(ms / 30);
        convertedMs.Months = ms % 12;
        ms = Math.floor(ms / 12);
        convertedMs.Years = ms;

        return convertedMs;
    }

}