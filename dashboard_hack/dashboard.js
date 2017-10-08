const DISTRIBUTION_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");
const token = "dd8810c644c3136a7778a3c7183bbbe718e14378";

var repo = new Object();
repo.allIssues = new Array()
repo.stats = new Object();
repo.stats.nOpenIssues = 0;
repo.stats.nCloseIssues = 0;
repo.stats.nOpenIssuesNoLabel = 0;
repo.stats.nCloseIssuesNoComments = 0;
repo.stats.totalIssue;

var lastIssue = 0;
var lastRead;
var hasNextPage;

$("document").ready(function(){

    var query = JSON.stringify({
        query: "{\n" +
        "  repository(owner: \"italia\", name: \"anpr\") {\n" +
        "    issues(first: 100) {\n" +
        "      totalCount\n" +
        "      pageInfo{\n" +
        "        endCursor\n" +
        "        hasNextPage\n" +
        "      }\n" +
        "      edges {\n" +
        "        node {\n" +
        "          createdAt\n" +
        "          closed\n" +
        "          labels{\n" +
        "            totalCount\n" +
        "          }\n" +
        "          comments(first: 1) {\n" +
        "            edges{\n" +
        "              node{\n" +
        "                createdAt\n" +
        "              }\n" +
        "            }\n" +
        "          }\n" +
        "          timeline(last: 100){\n" +
        "            nodes {\n" +
        "              ... on ClosedEvent {\n" +
        "                createdAt\n" +
        "                }\n" +
        "            }\n" +
        "          }\n" +
        "        }\n" +
        "      }\n" +
        "    }\n" +
        "  }\n" +
        "}"
    });

    $.ajax({
	    method: 'post',
	    data: query,
	    url: "https://api.github.com/graphql?access_token=" + token,
	    success: function (response) {
	        var closedAt = 0;
	        response.data.repository.issues.edges.forEach(function (issue) {
	            var closedAt = 0;
	            if (issue.node.closed) {
	                repo.stats.nCloseIssues++;
	                if (issue.node.comments.totalCount == 0)
	                    repo.stats.nCloseIssuesNoComments++;
	                issue.node.timeline.nodes.forEach(function (node) {
	                    if(node.createdAt)
	                        closedAt = node.createAt;
	                });
	            }
	            else {
	                repo.stats.nOpenIssues++;
	                if(issue.node.labels.totalCount==0)
	                    repo.stats.nOpenIssuesNoLabel++;
	            }
	            currentIssue = parseComments(issue, closedAt);
	            repo.allIssues.push(currentIssue);
	        });

            hasNextPage = response.data.repository.issues.pageInfo.hasNextPage;
            lastRead = response.data.repository.issues.pageInfo.endCursor;
            repo.stats.totalIssue = response.data.repository.issues.totalCount;
            test();
	    }
    });

	
	
});

function test() {
    if(hasNextPage === true) {
        var query = JSON.stringify({
            query: "query($lastRead: String!){\n" +
            "  repository(owner: \"italia\", name: \"anpr\") {\n" +
            "    issues(first: 100, after: $lastRead) {\n" +
            "      pageInfo{\n" +
            "        endCursor\n" +
            "        hasNextPage\n" +
            "      }\n" +
            "      edges {\n" +
            "        node {\n" +
            "          createdAt\n" +
            "          closed\n" +
            "          labels{\n" +
            "            totalCount\n" +
            "          }\n" +
            "          comments(first: 1) {\n" +
            "            edges{\n" +
            "              node{\n" +
            "                createdAt\n" +
            "              }\n" +
            "            }\n" +
            "          }\n" +
            "          timeline(last: 100){\n" +
            "            nodes {\n" +
            "              ... on ClosedEvent {\n"+
            "                createdAt\n"+
            "                }\n" +
            "            }\n"+
            "          }\n" +
            "        }\n" +
            "      }\n" +
            "    }\n" +
            "  }\n" +
            "}",
            variables: { lastRead: lastRead },
        });

        $.ajax({
            method: 'post',
            data: query,
            url: "https://api.github.com/graphql?access_token=" + token,
            success: function(response){
                var currentIssue = new Object();
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
                    currentIssue = parseComments(issue, closedAt);
                    repo.allIssues.push(currentIssue);
                });

                hasNextPage = response.data.repository.issues.pageInfo.hasNextPage;
                lastRead = response.data.repository.issues.pageInfo.endCursor;
                if(hasNextPage === false){
                    Object.assign(repo.stats, statistics(repo.allIssues, DISTRIBUTION_STEPS));
                    
                    fillHTML();
                }
                if(hasNextPage === true)
                    test();
            }
        });
    }
}

function fillHTML(){
    //console.log(repo.stats);
    firstRespChart(repo.stats, DISTRIBUTION_STEPS);
    //implementation inner HTML
    var numTicket = document.getElementById('nTicket');
    numTicket.innerHTML = repo.stats.totalIssue;

    console.log(repo);
    var middleCall = document.getElementById('midCall');
    var parsedAvg = (repo.stats.firstAverage.Years!=0) ? repo.stats.firstAverage.Years + "Y:" : "";
    parsedAvg += repo.stats.firstAverage.Months + "Month:";
    parsedAvg += repo.stats.firstAverage.Days + "Day ";
    parsedAvg += repo.stats.firstAverage.Hours + "h:";
    parsedAvg += repo.stats.firstAverage.Minutes + "m:";
    parsedAvg += repo.stats.firstAverage.Hours + "s";
    middleCall.innerHTML = parsedAvg;

    var openTicket = document.getElementById('tOpen');
    openTicket.innerHTML = repo.stats.nOpenIssues;

    var closedTicket = document.getElementById('tClosed');
    closedTicket.innerHTML = repo.stats.nCloseIssues;
}


function parseComments(issue, closedAt){
    var currentIssue = new Object();
    var dateIssue = new Date(issue.node.createdAt).getTime();
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


function statistics (arrayIssues, distributionSteps){
    var distNumber = distributionSteps.length;
    var stats = new Object();
    stats.firstRespDistributed = new Array();
    stats.firstAverage = new Object();
    stats.closeDistributed = new Array();
    stats.closeAverage = new Object();
    firstAverage = 0;
    closeAverage = 0;
    var totalCommented = 0;
    var totalClosed = 0;

    for (var i = 0; i < distNumber; i++) {
        stats.firstRespDistributed.push(0);
    }

    arrayIssues.forEach(function(issue){
        if(issue.firstResponseTime){
            firstAverage += issue.firstResponseTime;
            totalCommented ++;
        }
        if(issue.closeTime){
        	closeAverage += issue.CloseTime;
        	totalClosed++;
        }
        curFirstResp = issue.firstResponseTime;
        curCloseTime = issue.closeTime;
        oreResp = curFirstResp/3600000;
        oreClose = curCloseTime/3600000;
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
    return stats;
}


function convertMilliseconds (ms){
    convertedMs = new Object();
    ms = Math.floor(ms/60000);
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

function avgRespCloseChart(stats, distributionSteps){
    //average response-close times
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

function firstRespChart(stats, distributionSteps){
    //first response times distributed
    var ctx = document.getElementById("firstRespChart");

    var data = new Array();
    data.datasets = new Array();
    data.labels = distributionSteps;
    for (var i = 0; i < distributionSteps.length; i++) {
        coord = new Object();
        coord.x = distributionSteps[i];
        coord.y = stats.firstRespDistributed[i];
        data.datasets.push(coord);

    }
console.log(data);
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distributionSteps,
            datasets: [{
                label: "Distribuzione tempi prima risposta",
                data: data.datasets,
                borderColor: ['rgba(54, 162, 235, 1)'],
                pointBorderColor: ['rgba(54, 162, 235, 1)'],
                fill: "false"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function closeChart(stats, distributionSteps){
    //close times distributed
    var ctx = document.getElementById("closeChart");

    var data = new Array();
    data.datasets = new Array();
    data.labels = distributionSteps;
    for (var i = 0; i < distributionSteps.length; i++) {
        coord = new Object();
        coord.x = distributionSteps[i];
        coord.y = stats.closeDistributed[i];
        data.datasets.push(coord);
    }

    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distributionSteps,
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
            maintainAspectRatio: true
        }
    });
}