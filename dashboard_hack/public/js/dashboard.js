const AVG_DIST_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");
//const OC_DIST_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");
const MAX_LABELS = 6;
//graphs
ctxEvaluateLabelsChart = null;
ctxAvgRespCloseChart = null;
ctxCloseChart = null;
ctxFirstRespChart = null;

// --------------- utilities and formatting functions --------------------//
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
    var parsedAvg = /*avg.Years != 0 ? avg.Years + "Y : " : "";
    parsedAvg +=*/ avg.Months + "M : ";
    parsedAvg += avg.Days + "D<br/>";
    parsedAvg += avg.Hours + "h : ";
    parsedAvg += avg.Minutes + "m";
    //parsedAvg += avg.Hours + "s";

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
    ctxFirstRespChart = document.getElementById("firstRespChart");
    
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

    var myChart = new Chart(ctxFirstRespChart, {
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
            legend: {
                display: false
            },
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
    ctxCloseChart = document.getElementById("closeChart");
    
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

    var myChart = new Chart(ctxCloseChart, {
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
            legend: {
                display: false
            },
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
    ctxAvgRespCloseChart = document.getElementById("avgRespCloseChart").getContext('2d');

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

    var myChart = new Chart(ctxAvgRespCloseChart, {
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
    ctxEvaluateLabelsChart = document.getElementById("evaluateLabelsChart");

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
    if(stats.length >0){
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
    }

    var myChart = new Chart(ctxEvaluateLabelsChart, {
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
function fillHTML(selectedRepo){    
    //panels
    $("#name").html("<a href='" + selectedRepo.url + "' id='name'>" + selectedRepo.name + "</a>");
    $("#parent").html(selectedRepo.parent ? "forked from <a href='" + selectedRepo.parent + "''>" + selectedRepo.parent + "</a>" : "");
    $("#forks").html(selectedRepo.totForks);
    $("#watchers").html(selectedRepo.totWatchers);
    $("#contributors").html(selectedRepo.totContributors != null ? selectedRepo.totContributors : "-");
    $("#branches").html(selectedRepo.totBranches != null ? selectedRepo.totBranches : "-");
    $("#nTicket").html(selectedRepo.stats.nClosedIssues + selectedRepo.stats.nOpenIssues);
    $('#avgFirstTime').html(avgToString(selectedRepo.stats.firstRespAverage));
    $('#avgCloseTime').html(avgToString(selectedRepo.stats.closeAverage));
    $('#tOpen').html(selectedRepo.stats.nOpenIssues);
    $('#tClosed').html(selectedRepo.stats.nClosedIssues);
    $("#closedNoComments").html(selectedRepo.stats.nClosedIssuesNoComments);
    $("#openNoLabel").html(selectedRepo.stats.nOpenIssuesNoLabel);
    //graphs
    firstRespChart(selectedRepo.stats, AVG_DIST_STEPS);
    closeChart(selectedRepo.stats, AVG_DIST_STEPS)
    evaluateLabelsChart(selectedRepo.stats.evaluateLabels, MAX_LABELS);
}

function fillDropdown(){
    repos.forEach(function(repo){
        $("#list").append("<li class='dropdown-item repos'>" + repo.name + "</li>");
    });
}

function clearGraphs(){
    ctxEvaluateLabelsChart = null;
    ctxAvgRespCloseChart = null;
    ctxCloseChart = null;
    ctxFirstRespChart = null;
}

$('document').ready(function(){
    fillDropdown();
    fillHTML(repos[0]);
});


$("#list").on("click", ".repos", function(event){
    var selectedName = $(this).text();
    var selectedRepo = repos.find(function(element){
        return element.name == selectedName;
    }, selectedName);
    $("#reposList").hide();
    clearGraphs();//clean page
    fillHTML(selectedRepo);//refill page
});

$("#exampleDropdownFormEmail1").click(function(){
    $("#reposList").show();
});

$(window).click(function() {
 $("#reposList").hide();
});

$('#exampleDropdownFormEmail1').keyup(function(){

    var that = this, $allListElements = $('#list > li');

    var $matchingListElements = $allListElements.filter(function(i, li){
        var listItemText = $(li).text().toUpperCase(), 
            searchText = that.value.toUpperCase();
        return ~listItemText.indexOf(searchText);
    });

    $allListElements.hide();
    $matchingListElements.show();

});