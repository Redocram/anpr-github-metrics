var config = {};
var repos = [];
var totalIssues = 0;

var lastRead;
var hasNextPage;

//var firstRequest;
//var elapsedTime;

$("document").ready(function(){
	$.ajax({
	    url : "config.json",
	    dataType: "json",
	    success : function (data) {
	        config = data;
	    },
	    async: false //a tutti quelli a cui non piace quello che ho fatto, leggete prima questo sito: http://callbackhell.com/                 
	});  
	
	//firstRequest = new Date().getTime();
	//console.log("start repo calls");
	apiReposCall(1);
	//numNecessaryCalls = Math.ceil(totalIssues/100);
});


// ------------------------------------- api repo request -------------------------------------//

function apiReposCall(callNumber) {
	//elapsedTime = new Date().getTime() - firstRequest;
	//console.log(elapsedTime/1000 + " secs");
    if((callNumber==1 || hasNextPage === true) /*&& (callNumber%10>0 && elapsedTime<60000)*/) {
    	//forming json request
        var query = JSON.stringify({
            query: "query" + (callNumber>1 ? "($lastRead: String!)" : "") + "{" +
            "  organization(login: \"" + config.ownerName + "\") {" +
            "	repositories(first: 100" + (callNumber>1 ? ", after: $lastRead" : "") + ") {" +
            "		pageInfo{" +
            "			endCursor" +
            "			hasNextPage" +
            "		}" +
            "		totalCount" +
            "		nodes {" +
            "			name" +
        	"			url" +
        	"			issues{" +
          	"				totalCount" +
        	"			}" +
            "		}" +
            "	}" +
            "  }" +
            "}",
            variables: { lastRead: lastRead }
        });             

        //send call
        $.ajax({
            method: 'post',
            data: query,
            url: "https://api.github.com/graphql?access_token=" + config.userToken,
            success: function(response){
                response.data.organization.repositories.nodes.forEach(function (repository) {
                    var currentRepo = parseRepo(repository);
                    repos.push(currentRepo);
                });

                hasNextPage = response.data.organization.repositories.pageInfo.hasNextPage;
                lastRead = response.data.organization.repositories.pageInfo.endCursor;

                if(hasNextPage === true) {
                    apiReposCall(++callNumber);
                }
                else{
                	//console.log("finished repos in " + elapsedTime/1000 + " secs");
                	//console.log("start issue calls");
					repos.forEach(function(repo){
						//console.log(repo.name);
						if(repo.totIssues > 0){
							apiIssuesCall(repo, 1);
						}
					});
                }
            }                      
            
        });
    }
    /*else{
    	console.log("waiting" + (60000-elapsedTime)/1000 + "seconds");
    	setTimeout(apiReposCall(callNumber), 60000 - elapsedTime);
    	firstRequest = new Date().getTime();

    }*/
}

//cleans json responses
function parseRepo(repository){
    var currentRepo = {
    	name: "",
    	url: "",
    	totIssues: 0
	};

	currentRepo.totIssues = repository.issues.totalCount; 
    currentRepo.name = repository.name;
    currentRepo.url = repository.url;
    totalIssues += currentRepo.totIssues;
    return currentRepo;
}


// ------------------------------------- api repo request -------------------------------------//

function apiIssuesCall(repo, callNumber) {
	//elapsedTime = new Date().getTime() - firstRequest;
	//console.log(elapsedTime/1000 + " secs");
    if((callNumber==1 || hasNextPage === true) /*&& (callNumber%10>0 && elapsedTime<60000)*/) {
    	//forming json request
        var query = JSON.stringify({
            query: "query" + (callNumber>1 ? "($lastRead: String!)" : "") + "{" +
            "  repository(owner: \"" + config.ownerName + "\", name: \"" + repo.name + "\") {" +
            "    issues(first: 100" + (callNumber>1 ? ", after: $lastRead" : "") + ") {" +
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
            "              ... on ClosedEvent {"+
            "                createdAt"+
            "                }" +
            "            }"+
            "          }" +
            "        }" +
            "      }" +
            "    }" +
            "  }" +
            "}",
            variables: { lastRead: lastRead },
        });             

        //send call
        $.ajax({
            method: 'post',
            data: query,
            url: "https://api.github.com/graphql?access_token=" + config.userToken,
            success: function(response){
            	repo.issue = [];
                response.data.repository.issues.edges.forEach(function (issue) {

                    var currentIssue = parseIssue(issue);
                    repo.issues.push(currentIssue);
                });

                hasNextPage = response.data.repository.issues.pageInfo.hasNextPage;
                lastRead = response.data.repository.issues.pageInfo.endCursor;

                if(hasNextPage === true) {
                    apiIssuesCall(++callNumber);
                }
                /*else{
                	console.log("finished issues in " + elapsedTime/1000 + " secs");
                }*/
            }                      
            
        });
    }
    /*else{
    	console.log("waiting" + (60000-elapsedTime)/1000 + "seconds");
    	setTimeout(apiIssuesCall(callNumber), 60000 - elapsedTime);
    	firstRequest = new Date().getTime();
    }*/
}

//cleans json response
function parseIssue(issue){
    var currentIssue = {
        createdAt: 0,
        labels: [],
        firstResponseTime: 0,
    };

    var dateIssue = new Date(issue.node.createdAt).getTime();
    issue.node.labels.nodes.forEach(function(label){
        currentIssue.labels.push(label.name);
    });

    if(issue.node.comments.edges.length != 0){
        var firstResponse = new Date(issue.node.comments.edges[0].node.createdAt).getTime();
        currentIssue.firstResponseTime = firstResponse - dateIssue;
    }
    currentIssue.createdAt = dateIssue;
    if(issue.node.closed){
        issue.node.timeline.nodes.forEach(function (node) {
            if(node.createdAt){
                currentIssue.closedAt = new Date(node.createdAt).getTime();
                currentIssue.closeTime = currentIssue.closedAt - dateIssue;
            }
        });
    }
    return currentIssue;
}