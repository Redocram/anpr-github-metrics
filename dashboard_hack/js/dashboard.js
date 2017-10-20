const AVG_DIST_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");
//const OC_DIST_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");
const MAX_LABELS = 6;
var tokenPartOne = "c";
var tokenPartTwo = "c";
var ownerName = "italia";
var repoName = "anpr";

var repo = {
    name: repoName,
    allIssues: [],
    stats: {
        //nOpenIssues: 0,
        //nOpenIssuesNoLabel: 0,
        //nClosedIssues: 0,
        //nClosedIssuesNoComments: 0,
        //totalIssues: 0
    }
};

var lastIssue = 0;
var lastRead;
var hasNextPage;

$("document").ready(function(){

	$(document).ajaxStart(function() {
        $("#loading").show();
        $('#loadingBack').fadeIn(400);
    }).ajaxStop(function() {
        $("#loading").hide();
        $("#loadingBack").fadeOut(250);
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
        

        $.ajax({
            url : "tokenPartOne.txt",
            dataType: "text",
            success : function (data) {
                tokenPartOne = data;
            },
            async: false //a tutti quelli a cui non piace quello che ho fatto, leggete prima questo sito: http://callbackhell.com/                 
        });    
        
        $.ajax({
            url : "tokenPartTwo.txt",
            dataType: "text",
            success : function (data) {
                tokenPartTwo = data;
            },
            async: false //a tutti quelli a cui non piace quello che ho fatto, leggete prima questo sito: http://callbackhell.com/                 
        });


        //send call
        $.ajax({
            method: 'post',
            data: query,
            url: "https://api.github.com/graphql?access_token=" + tokenPartOne + tokenPartTwo,
            success: function(response){
                //var currentIssue = new Object();
                response.data.repository.issues.edges.forEach(function (issue) {
                    //var closedAt = 0;
                    //if (issue.node.closed) {
                        //repo.stats.nClosedIssues++;
                        //if (issue.node.comments.totalCount == 0)
                            //repo.stats.nClosedIssuesNoComments++;
                        /*issue.node.timeline.nodes.forEach(function (node) {
                            if(node.createdAt)
                                closedAt = node.createdAt;
                        });*/
                    //}
                    /*else {
                        repo.stats.nOpenIssues++;
                        if(issue.node.labels.totalCount==0)
                            repo.stats.nOpenIssuesNoLabel++;
                    }*/
                    var currentIssue = parseIssue(issue);
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

//cleans json responses
function parseIssue(issue){
    var currentIssue = {
        createdAt: 0,
        labels: [],
        firstResponseTime: 0,
        //closedAt: 0,
        //closeTime: 0,
        //totalComments: 0
    };

    console.log(issue);

    var dateIssue = new Date(issue.node.createdAt).getTime();
    issue.node.labels.nodes.forEach(function(label){
        currentIssue.labels.push(label.name);
    });

    if(issue.node.comments.edges.length != 0){
        //currentIssue.totalComments = issue.node.comments.totalCount;
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

        //currentIssue.closedAt = new Date(closedAt).getTime();
        //currentIssue.closeTime = currentIssue.closedAt - dateIssue;
    }


    return currentIssue;
}

//calculate statistics
function statistics (arrayIssues, distributionSteps){
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
    
    var firstRespAverage = 0;
    var totalCommented = 0;
    var closeAverage = 0;
    var evaluateLabels = Object();

    for (var i = 0; i < distNumber; i ++) {
        stats.firstRespDistributed.push(0);
        stats.closeDistributed.push(0);
    }
    stats.totalIssues = arrayIssues.length;
    arrayIssues.forEach(function(issue){
        if(issue.firstResponseTime){
            firstRespAverage += issue.firstResponseTime;
            totalCommented ++;
        }

        if(issue.closeTime){
        	closeAverage += issue.closeTime;
        	stats.nClosedIssues ++;
            if (issue.totalComments == 0)
                stats.nClosedIssuesNoComments++;
        }
        else {
            stats.nOpenIssues ++;
            if(issue.labels.length == 0)
                stats.nOpenIssuesNoLabel++;
        }

        if(issue.labels.length>0){
            issue.labels.forEach(function(label){
                if(!evaluateLabels[label]){
                    evaluateLabels[label] = 0;
                }
                evaluateLabels[label] ++;
            });
        }

        var curFirstResp = issue.firstResponseTime;
        var curCloseTime = issue.closeTime;
        var oreResp = curFirstResp / 3600000;
        var oreClose = curCloseTime / 3600000;
        var esc = 0;
        for (var i = 0; i < distNumber-1; i ++) {
            if(oreResp<distributionSteps[i]){
                stats.firstRespDistributed[i] ++;
                curFirstResp = null;
                esc = 1;
            }
            if(oreClose<distributionSteps[i]){
            	stats.closeDistributed[i] ++;
            	curCloseTime = null;
            	esc = 1;
            }
            if(esc == 1)
            	break;
        }
        if(curFirstResp){
            stats.firstRespDistributed[distNumber-1] ++;
        }
        if(curCloseTime){
        	stats.closeDistributed[distNumber-1] ++;
        }
    });

    stats.firstRespAverage = convertMilliseconds(Math.floor(firstRespAverage / totalCommented));
    stats.closeAverage = convertMilliseconds(Math.floor(closeAverage / stats.nClosedIssues));
    stats.evaluateLabels = sortLabels(evaluateLabels);

    return stats;
}

// ------------------------------------ formatting & converting -----------------------------------------//
function convertMilliseconds (ms){
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

function humanizeHours(hours){
	var humanized;
	if(typeof hours == "string")
		humanized = hours;
	else if(hours < 24)
		humanized = hours + "hr";
	else if(hours < 168)
		humanized = (hours / 24) + "d";
	else
		humanized = (hours / 168) + "w";

	return humanized;
}

function avgToString(avg){
    var parsedAvg = avg.Years != 0 ? avg.Years + "Y : " : "";
    parsedAvg += avg.Months + "M : ";
    parsedAvg += avg.Days + "D<br/>";
    parsedAvg += avg.Hours + "h : ";
    parsedAvg += avg.Minutes + "m : ";
    parsedAvg += avg.Hours + "s";

    return parsedAvg;
}

function sortLabels(labelsList){		//NON FUNZIONA
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
    for (var i = 0; i < distributionSteps.length; i ++) {
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
    for (var i = 0; i < distributionSteps.length; i ++) {
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
                borderColor: ['#ff6384'],
                pointBorderColor: ['#36a2eb'],
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
                backgroundColor: '#36a2eb',
                borderColor: '#36a2eb',
                data: stats.firstRespDistributed
            },
            {
                label: "Tempo chiusura Ticket",
                backgroundColor: '#ff6384)',
                borderColor: '#36a2eb',
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

//label presence
function evaluateLabelsChart(stats, maxLabels){
    var ctx = document.getElementById("evaluateLabelsChart");

    data = {
        datasets: [{
 				data: [],
 				backgroundColor: []
 			 },
        ],
        labels: []
    };

    countFirstLabels = maxLabels;
    data.datasets[0].backgroundColor = ['#ffcd56', '#5bace1', '#ff6384', '#50da92', '#5b68fc', '#36a2eb', '#ff6384'];
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

    var myChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 10
            },
            legend: {
            	position: "left"
            },
            title: {
            display: true,
            text: 'Label più utilizzate'
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
    $("#nTicket").html(repo.stats.nClosedIssues + repo.stats.nOpenIssues);
    $('#avgFirstTime').html(avgToString(repo.stats.firstRespAverage));
    $('#avgCloseTime').html(avgToString(repo.stats.closeAverage));
    $('#tOpen').html(repo.stats.nOpenIssues);
    $('#tClosed').html(repo.stats.nClosedIssues);
    $("#closedNoComments").html(repo.stats.nClosedIssuesNoComments);
    $("#openNoLabel").html(repo.stats.nOpenIssuesNoLabel);
}