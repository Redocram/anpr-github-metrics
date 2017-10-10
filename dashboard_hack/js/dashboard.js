const AVG_DIST_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");
//const OC_DIST_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");
const MAX_LABELS = 7;
const token = "4ce66352cef1e5faa1fb8361f60e4f51db78d595";
var ownerName = "italia";
var repoName = "anpr";

var repo = {
    allIssues: [],
    stats: {
        nOpenIssues: 0,
        nOpenIssuesNoLabel: 0,
        nCloseIssues: 0,
        nCloseIssuesNoComments: 0,
        totalIssue: 0
    }
};

var lastIssue = 0;
var lastRead;
var hasNextPage;

$("document").ready(function(){

	$(document).ajaxStart(function() {
          	$("#loading").show();
          	//$("#loadingBack").show();
      	}).ajaxStop(function() {
          	$("#loading").hide();
          	//$("#loadingBack").hide();
      	});

	apiCall(1);	
});

// ------------------------------------- api requests -------------------------------------//

function apiCall(callNumber) {
    if(callNumber==1 || hasNextPage === true) {
    	//forming json request
        var query = JSON.stringify({
            query: "query" + (callNumber>1 ? "($lastRead: String!)" : "") + "{" +
            "  repository(owner: \"" + ownerName + "\", name: \"" + repoName + "\") {" +
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
            url: "https://api.github.com/graphql?access_token=" + token,
            success: function(response){
                //var currentIssue = new Object();
                response.data.repository.issues.edges.forEach(function (issue) {
                    var closedAt = 0;
                    if (issue.node.closed) {
                        repo.stats.nCloseIssues++;
                        if (issue.node.comments.totalCount == 0)
                            repo.stats.nCloseIssuesNoComments++;
                        issue.node.timeline.nodes.forEach(function (node) {
                            if(node.createdAt)
                                closedAt = node.createdAt;
                        });
                    }
                    else {
                        repo.stats.nOpenIssues++;
                        if(issue.node.labels.totalCount==0)
                            repo.stats.nOpenIssuesNoLabel++;
                    }
                    var currentIssue = parseComments(issue, closedAt);
                    repo.allIssues.push(currentIssue);
                });

                hasNextPage = response.data.repository.issues.pageInfo.hasNextPage;
                lastRead = response.data.repository.issues.pageInfo.endCursor;

                if(hasNextPage === true) {
                    apiCall(++callNumber);
                }
                else {
                    Object.assign(repo.stats, statistics(repo.allIssues, AVG_DIST_STEPS));
                    fillHTML();
                }
            }
        });
    }
}

//cleans json response
function parseComments(issue, closedAt){
    var currentIssue = {
        createdAt: 0,
        labels: [],
        firstResponseTime: 0,
        closedAt: 0,
        closeTime: 0
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
    if(closedAt !== 0){
        currentIssue.closedAt = new Date(closedAt).getTime();
        currentIssue.closeTime = currentIssue.closedAt - dateIssue;
    }
    return currentIssue;
}

//calculate statistics
function statistics (arrayIssues, distributionSteps){
    var distNumber = distributionSteps.length;
    var stats = {
        firstRespDistributed: [],
        evaluateLabels: [],
        firstAverage: {},
        closeDistributed: [],
        closeAverage: {}
    };
    
    var firstAverage = 0;
    var totalCommented = 0;
    var closeAverage = 0;
    var totalClosed = 0;
    var evaluateLabels = Object();

    for (var i = 0; i < distNumber; i++) {
        stats.firstRespDistributed.push(0);
        stats.closeDistributed.push(0);
    }

    arrayIssues.forEach(function(issue){
        if(issue.firstResponseTime){
            firstAverage += issue.firstResponseTime;
            totalCommented ++;
        }
        if(issue.closeTime){
        	closeAverage += issue.closeTime;
        	totalClosed++;
        }
        if(issue.labels.length>0){
            issue.labels.forEach(function(label){
                if(!evaluateLabels[label]){
                    evaluateLabels[label] = 0;
                }
                evaluateLabels[label]++;
            });
        }

        var curFirstResp = issue.firstResponseTime;
        var curCloseTime = issue.closeTime;
        var oreResp = curFirstResp/3600000;
        var oreClose = curCloseTime/3600000;
        var esc = 0;
        for (var i = 0; i < distNumber-1; i++) {
            if(oreResp<distributionSteps[i]){
                stats.firstRespDistributed[i]++;
                curFirstResp=null;
                esc = 1;
            }
            if(oreClose<distributionSteps[i]){
            	stats.closeDistributed[i]++;
            	curCloseTime=null;
            	esc = 1;
            }
            if(esc==1)
            	break;
        }
        if(curFirstResp){
            stats.firstRespDistributed[distNumber-1]++;
        }
        if(curCloseTime){
        	stats.closeDistributed[distNumber-1]++;
        }
    });

    stats.firstAverage = convertMilliseconds(Math.floor(firstAverage / totalCommented));
    stats.closeAverage = convertMilliseconds(Math.floor(closeAverage / totalClosed));
    stats.evaluateLabels = sortLabels(evaluateLabels);

    return stats;
}

// ------------------------------------ formatting & converting -----------------------------------------//
function convertMilliseconds (ms){
    var convertedMs = new Object();
    var ms = Math.floor(ms/60000);
    convertedMs.Minutes = ms%60;
    ms = Math.floor(ms/60);
    convertedMs.Hours = ms%24;
    ms = Math.floor(ms/24);
    convertedMs.Days = ms%30;
    ms = Math.floor(ms/30);
    convertedMs.Months = ms%12;
    ms = Math.floor(ms/12);
    convertedMs.Years = ms;

    return convertedMs;
}

function humanizeHours(hours){
	var humanized;
	if(typeof hours=="string")
		humanized = hours;
	else if(hours<24)
		humanized = hours + "hr";
	else if(hours<168)
		humanized = (hours/24) + "d";
	else
		humanized = (hours/168) + "w";

	return humanized;
}

function avgToString(avg){
    var parsedAvg = avg.Years!=0 ? avg.Years + "Y : " : "";
    parsedAvg += avg.Months + "M : ";
    parsedAvg += avg.Days + "D<br/>";
    parsedAvg += avg.Hours + "h : ";
    parsedAvg += avg.Minutes + "m : ";
    parsedAvg += avg.Hours + "s";

    return parsedAvg;
}

function sortLabels(labelsList){
    var sortedLabels = new Array();
    
    for (var label in labelsList) {
        sortedLabels.push([label, labelsList[label]]);
    }
    
    sortedLabels.reverse(function(a, b) {
        return a[1] - b[1];
    });
	
	return sortedLabels;
}

// --------------------------------- graphs section ---------------------------------------------//
//first response times distributed
function firstRespChart(stats, distributionSteps){
	var humanReadableSteps = new Array();	//human readable distribution steps
	AVG_DIST_STEPS.forEach(function(step){
	   humanReadableSteps.push(humanizeHours(step));
	});
    var ctx = document.getElementById("firstRespChart");
    
    var data = {
        datasets: [],
        labels: []
    };

    //data.labels = distributionSteps;
    for (var i = 0; i < distributionSteps.length; i++) {
        coord = new Object();
        coord.x = distributionSteps[i];
        coord.y = stats.firstRespDistributed[i];
        data.datasets.push(coord);

    }

    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: humanReadableSteps,
            datasets: [{
                label: "Distribuzione tempi prima risposta",
                data: data.datasets,
                borderColor: ['rgba(165,223,223, 1)'],
                pointBorderColor: ['rgba(75,192,192, 1)'],
                fill: "false"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: {
                padding: 10
            }
        }
    });
}


//close times distributed
function closeChart(stats, distributionSteps){
    var humanReadableSteps = new Array();	//human readable distribution steps
	AVG_DIST_STEPS.forEach(function(step){
		humanReadableSteps.push(humanizeHours(step));
	});    
    var ctx = document.getElementById("closeChart");
    
    var data = {
        datasets: [],
        labels: []
    };

    //data.labels = distributionSteps;
    for (var i = 0; i < distributionSteps.length; i++) {
        coord = new Object();
        coord.x = distributionSteps[i];
        coord.y = stats.closeDistributed[i];
        data.datasets.push(coord);
    }

    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: humanReadableSteps,
            datasets: [{
                label: "Distribuzione tempi chiusura Issue",
                data: data.datasets,
                borderColor: ['rgba(255,99,132,1)'],
                pointBorderColor: ['rgba(54, 162, 235, 1)'],
                fill: "false"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: {
                padding: 10
            }
        }
    });
}

//average close/time distributed
function avgRespCloseChart(stats, distributionSteps){
    var ctx = document.getElementById("avgRespCloseChart").getContext('2d');

    var data = {
        labels: distributionSteps,
        datasets: [
            {
                label: "Tempo prima risposta",
                backgroundColor: 'rgba(54, 162, 235, 1)',
                borderColor: 'rgba(54, 162, 235, 1)',
                data: stats.firstRespDistributed
            },
            {
                label: "Tempo chiusura Ticket",
                backgroundColor: 'rgba(255,99,132,1)',
                borderColor: 'rgba(54, 162, 235, 1)',
                data: stats.closeDistributed
            }
        ]
    };

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
}

function evaluateLabelsChart(stats, maxLabels){		//DA RIVERDERE LA COSTRUZIONE DELL'ARRAY DATASETS
    var ctx = document.getElementById("evaluateLabelsChart")

    data = {
        datasets: [
 			{ data: [] }
        ],
        labels: []
    };

    countFirstLabels = maxLabels;
    stats.forEach(function(label){
        if(countFirstLabels>0){
            data.labels.push(label[0]);
            data.datasets[0].data.push(label[1]);
            countFirstLabels--;
        }
        else{
            data.labels[data.labels.length-1] = "Altre label";
            data.datasets[0].data[data.datasets[0].data.length-1] += label[1];
        }
    });

    console.log(data);

    var myChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: {
                padding: 10
            }
        }
    });
}

// --------------------------------- font-end filling blocks section ----------------------------------//
function fillHTML(){
    //graphs
    firstRespChart(repo.stats, AVG_DIST_STEPS);
    closeChart(repo.stats, AVG_DIST_STEPS)
    evaluateLabelsChart(repo.stats.evaluateLabels, MAX_LABELS);
    //other panels
    $("#name").html(ownerName + "/" + repoName);
    $("#nTicket").html(repo.stats.nCloseIssues + repo.stats.nOpenIssues);
    $('#avgFirstTime').html(avgToString(repo.stats.firstAverage));
    $('#avgCloseTime').html(avgToString(repo.stats.closeAverage));
    $('#tOpen').html(repo.stats.nOpenIssues);
    $('#tClosed').html(repo.stats.nCloseIssues);
    $("#closedNoComments").html(repo.stats.nCloseIssuesNoComments);
    $("#openNoLabel").html(repo.stats.nOpenIssuesNoLabel);
}