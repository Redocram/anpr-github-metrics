const AVG_DIST_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");
//const OC_DIST_STEPS = new Array(1, 3, 6, 12, 24, 168, "Oltre");
const MAX_LABELS = 6;

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
$('document').ready(function fillHTML(){
    //graphs
    firstRespChart(repos[0].stats, AVG_DIST_STEPS);
    closeChart(repos[0].stats, AVG_DIST_STEPS)
    evaluateLabelsChart(repos[0].stats.evaluateLabels, MAX_LABELS);
    //other panels
    $("#name").html(ownerName + "/" + repos[0].name);
    $("#nTicket").html(repos[0].stats.nClosedIssues + repos[0].stats.nOpenIssues);
    $('#avgFirstTime').html(avgToString(repos[0].stats.firstRespAverage));
    $('#avgCloseTime').html(avgToString(repos[0].stats.closeAverage));
    $('#tOpen').html(repos[0].stats.nOpenIssues);
    $('#tClosed').html(repos[0].stats.nClosedIssues);
    $("#closedNoComments").html(repos[0].stats.nClosedIssuesNoComments);
    $("#openNoLabel").html(repos[0].stats.nOpenIssuesNoLabel);
});

$(".repos").change(function(){

});