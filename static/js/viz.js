$(document).ready(function() {
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 650 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .2);

    var xTime = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .rangeRound([height, 0]);

    color = d3.scale.ordinal()
        .range(["#6ca439", "#a9c888"]);

    var xAxis1 = d3.svg.axis() // months
        .scale(x)
        .orient("bottom")
        .tickSize(0)
        .tickFormat(d3.time.format("%b"));

    var xAxis2 = d3.svg.axis() // years
        .scale(xTime)
        .ticks(d3.time.years, 1)
        .tickFormat(d3.time.format("%y"))
        .tickSize(0)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(-width)
        .tickFormat(d3.format("s"));

    var svg = d3.select("#viz").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("/monthly", function(err, allData) {
        // parse dates into objects
        for (var i = 0; i < allData.length; i++) {
            var parts = allData[i]["_id"].split("-");
            allData[i]["_id"] = new Date(+parts[0], (+parts[1])-1);
        }

        var now = new Date(2013, 11);
        var start = new Date(now);
        start.setMonth(now.getMonth() - 11); // j
        console.log("now: " + now);
        console.log("start: " + start);
        var data = allData.filter(function(d) { return d["_id"] <= now && d["_id"] >= start ? d : false; });

        data.sort(function(a, b) {
            return (a["_id"] < b["_id"]) ? -1 : 1;
        });

        color.domain(d3.keys(data[0].value));
        var xDomain = data.map(function(d) { return d["_id"]; }); // return an array of dates as the domain
        x.domain(xDomain);
        xTime.domain(xDomain);
        y.domain([0, d3.max(data, function(d) { return +d.value.unique + +d.value.total; })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0,"+ height + ")")
            .call(xAxis1);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0,"+ (height+20) + ")")
            .call(xAxis2);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        var dates = svg.selectAll("g.date")
            .data(data);
        
        dates.enter().append("g")
            .attr("class", "date");

        var bottom = dates.append("rect")
            .attr("class", "data unique")
            .attr("fill", color("unique"));
        
        bottom.attr("y", function(d) { return y(+d.value.unique); })
            .attr("height", function(d) { return Math.abs(y(d.value.unique) - y(0)) });

        var top = dates.append("rect")
            .attr("class", "data total")
            .attr("fill", color("total"));

        top.attr("y", function(d) { return y(+d.value.unique + +d.value.total); })
            .attr("height", function(d) { return Math.abs(y(d.value.total) - y(0)); });

        dates.selectAll("rect.data")
            .attr("x", function(d) { return x(d["_id"]); })
            .attr("width", x.rangeBand());

    });
});

