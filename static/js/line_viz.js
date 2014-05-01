$(document).ready(function() {
    var osNameMap = {
        "win32": "Windows",
        "osx": "Mac OS X",
        "linux": "Linux",
        "src": "Source",
        "other": "Other"
    };

    var margin = {top: 20, right: 30, bottom: 40, left: 60},
        width = 650 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y-%m").parse;

    var x = d3.time.scale()
        .range([0, width]);

    var xTime = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.ordinal()
        .range(["#373e50", "#535d77", "#6e7c9f", "#8b96b2", "#a8b0c5"]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.time.format("%b"));

    console.log('x: ' + x());
    console.log('xTime: ' + xTime());

    var xAxis2 = d3.svg.axis() // years
        .scale(x)
        .ticks(d3.time.years, 1)
        .tickFormat(d3.time.format("%y"))
        .tickSize(0)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(-width)
        .tickFormat(d3.format("s"))
        .orient("left");

    var line = d3.svg.line()
        .interpolate("linear")
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.downloads); });

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("/os_monthly", function(err, rawData) {
        var groupedData = _.groupBy(rawData, function(datum) {
            return datum._id.t;
        });

        var last12Months = d3.keys(groupedData).slice(0, 12);

        var data = _.map(last12Months, function(key, index) {
            console.log(key);
            console.log(groupedData[key]);

            var othersTotal = 0;
            var downloads = {};
            var osStat = {
                date: key
            };

            for(var i=0; i < groupedData[key].length; i++) {
                var os = groupedData[key][i]["_id"]["os"];

                if(os === "win32" || os === "osx" || os === "linux" || os === "src") {
                    downloads[ groupedData[key][i]["_id"]["os"] ] = groupedData[key][i]["value"];
                } else {
                    othersTotal += groupedData[key][i]["value"];
                }

                downloads["other"] = othersTotal;
            }
            _.extend(osStat, downloads);

            return osStat;
        });

        console.log(data);

        color.domain(["win32", "linux", "osx", "src", "other"]);
        

        data.forEach(function(d) {
            d.date = parseDate(d.date);
        });

        var operatingSystems = color.domain().map(function(name) {
            return {
                name: name,
                values: data.map(function(d) {
                    return {date: d.date, downloads: +d[name]};
                })
            };
        });

        x.domain(d3.extent(data, function(d) { return d.date; }));

        y.domain([
            d3.min(operatingSystems, function(c) { return d3.min(c.values, function(v) { return v.downloads; }); }),
            d3.max(operatingSystems, function(c) { return d3.max(c.values, function(v) { return v.downloads; }); })
        ]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "xx axis")
            .attr("transform", "translate(0,"+ (height+19) + ")")
            .call(xAxis2);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        var os = svg.selectAll(".os")
            .data(operatingSystems)
            .enter().append("g")
            .attr("class", "os");

        os.append("path")
            .attr("class", "line")
            .attr("d", function(d) { return line(d.values.slice(1, d.values.length)); })
            .style("stroke", function(d) { return color(d.name); });

        os.append("path")
            .attr("class", "line current")
            .attr("d", function(d) { return line(d.values.slice(0, 2)); })
            .style("stroke", function(d) { return color(d.name); });

        os.append("text")
            .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { console.log(d); return "translate(" + x(d.value.date) + "," + y(d.value.downloads) + ")"; })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function(d) { return osNameMap[d.name]; });

        var legend = d3.select("body").insert("ul", ":first-child")
            .attr("class", "legend");

        var statEnter = legend
            .selectAll("li")
          .data(operatingSystems).enter().append("li");
        
        statEnter.append("span")
            .attr("class", "square")
            .style("background", function(d) { return color(d.name); });

        statEnter.append("span")
            .attr("class", "label")
            .text(function(d) { return osNameMap[d.name]; });

        var legendPxWidth = legend.style("width");
        var legendWidth = +legendPxWidth.substring(0, legendPxWidth.length-2);
        
        legend.style("width", (legendWidth + margin.left) + "px");
    });
});
