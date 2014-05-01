var parseDate = d3.time.format("%Y-%m").parse;

function toShortVersion(version) {
    return version.substring(0, 3) + ".x";
}

function shortenVersions(data) {
    _.each(data, function(element, index) {
        element._id.version = toShortVersion(element._id.version);
    });
}

function filter(data) {
    var filtered = [];

    // remove nulls
    _.each(data, function(element, index) {
        if (element._id.version != null) {
            filtered.push(element);
        }
    });

    //only keep past 12 months
    var now = new Date(2013, 11); // test data ends at december
    var start = new Date(now);
    start.setMonth(now.getMonth() - 11);
    var tmp = filtered.filter(function(d) { 
        return ((parseDate(d._id.t) <= now) && (parseDate(d._id.t) >= start) ? d : false);
    });
    console.log(tmp.length);

    // only keep even versions e.g. 1.8.x, 2.0.x, etc.
    function isEven(v) { 
        var num = +v.split('.')[1];
        return num % 2 == 0 ? true : false;
    };
    var evens = tmp.filter(function(d) {
        return isEven(d._id.version) ? d : false;
    });

    //only keep past 5 major versions
    function shortVersion(v) { return +v.substring(0, 3); }
    var result = [];
    var numVersions = 5; // number of versions to keep
    var versions = [];
    _.each(evens, function(element, index) {
        var present = _.indexOf(versions, shortVersion(element._id.version));
        if (present != -1) {
            result.push(element);
        } else {
            if (versions.length < numVersions) {
                versions.push(shortVersion(element._id.version));
                result.push(element);
            }
        }
    });

    return result;
}

function versionToNum(v) {
    return +v.substring(0,3);
}

function maxY(data) {
    var max = 0; 
    _.each(data, function(elem, index) {
        _.each(elem.values, function(e, i) {
            if ((e.y0 + e.y) > max) {
                max = e.y0 + e.y;
            }
        });
    });
    return max;
}

// returns a list of string dates of format "2014-04"
// if date is a Date() object, set isObject to true
function getDates(data, isObject) {
    var dates = {};
    _.each(data, function(elem, index) {
        _.each(elem.values, function(e, i) {
            var date = isObject === true ? e._id.t.getTime() : e._id.t;
            if (!(date in dates)) {
                dates[e._id.t] = true;
            }
        });
    });
    return isObject === true ? _.keys(dates).map(function(d) { return new Date(d) }) : _.keys(dates);
}

function deepPluck(list, propName) {
    var qualifiers = propName.split('.');
    var result = [];
    _.each(list, function(elem, index) {
        var value = elem;
        _.each(qualifiers, function(e, i) {
            value = value[e];
        });
        result.push(value);
    });
    return result;
}

// adds default data
function pad(data) {
    var dates = getDates(data);
    _.each(data, function(elem, index) {
        var containedDates = deepPluck(elem.values, "_id.t");
        var needDefaults = _.difference(dates, containedDates);
        _.each(needDefaults, function(e, i) {
            elem.values.push({_id: {t: e, version: elem.key}, value: 0});
        });
    });
    return data;
}

// last pass before finish
function cleanup(data) {
    // transform dates from "2012-04" to a date object
    _.each(data, function(elem, index) {
        _.each(elem.values, function(e, i) {
            e._id.t = parseDate(e._id.t);
        });
    });
    return data;
}

// combine(data) is called after nest.entries(data)
function combine(data) {
    var tmp = {};
    var result = [];

    _.each(data, function(element, index) {
        _.each(element.values, function(e, i) {
            var date = e._id.t;
            var version = e._id.version;

            if (!(version in tmp)) {
                tmp[version] = {};
            }
            if (!(date in tmp[version])) {
                tmp[version][date] = {_id: {t: date, version: version}, value: 0};
            }
            tmp[version][date].value += e.value; 
        });
    });

    _.each(tmp, function(v, k) {
        var values = [];
        _.each(v, function(point, date) {
            values.push(point);
        });
        result.push({key: k, values: values});
    });
    return result;
}

$(document).ready(function() {
    var margin = {top: 20, right: 30, bottom: 40, left: 60},
        width = 650 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    var formatDate = d3.time.format("%b");
    var formatNumbers = d3.format("s");
    var formatPercent = d3.format(".0%");

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var z = d3.scale.ordinal().range(["#702a13", "#a83f1d", "#e05426", "#e67651", "#ec987d", "#f3bba8"]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(formatDate);

    var xAxis2 = d3.svg.axis() // years
        .scale(x)
        .ticks(d3.time.years, 1)
        .tickFormat(d3.time.format("%y"))
        .tickSize(0)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(0)
        .orient("left")
        .tickFormat(formatPercent);

    var stack = d3.layout.stack()
        .offset("expand")
        .order("reverse")
        .values(function(d) { return d.values; })
        .x(function(d) { return d.date; })
        .y(function(d) { return d.value; });

    var nest = d3.nest()
        .key(function(d) { return d._id.version; });

    var area = d3.svg.area()
        .interpolate("linear")
        .x(function(d) { return x(d._id.t); })
        .y0(function(d) { return y(d.y0); })
        .y1(function(d) { return y(d.y0 + d.y); });

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var defs = svg.append("defs");

    var patternSize = 4;
    var dotRadius = 2;

    function newPattern(name, size, defs) {
        return defs.append('pattern')
            .attr("id", name)
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", size)
            .attr("height", size)
            .append("g");
    }

    d3.json("/versions", function(allData) {
        var data = filter(allData);
        console.log(data);
        shortenVersions(data);
        console.log(data);
        console.log(nest.entries(data));
        console.log(combine(nest.entries(data)));
        console.log(pad(combine(nest.entries(data))));
        //console.log(stack(nest.entries(data)));
        console.log(stack(pad(combine(nest.entries(data)))));
        var formatted = cleanup(pad(combine(nest.entries(data))));
        console.log(formatted);
        
        var layers = stack(formatted);
        console.log("layers");
        console.log(layers);

        layers = layers.sort(function(a, b) {
            var x = versionToNum(a.key);
            var y = versionToNum(b.key);
            return x == y ? 0 : x < y ? -1 : 1;
        });

        var dates = getDates(formatted, true);
        x.domain([d3.min(dates), d3.max(dates)]);
        y.domain([0, maxY(formatted)]);
        console.log(y.domain());
        console.log(x.domain());
        
        var patternEnter = defs.selectAll("pattern")
            .data(layers)
          .enter().append("pattern")
            .attr("id", function(d) { return d.key; })
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", patternSize)
            .attr("height", patternSize)
            .append("g")

        patternEnter.append("rect")
            .attr("x", -patternSize)
            .attr("y", -patternSize)
            .attr("height", patternSize*3)
            .attr("width", patternSize*3)
            .style("stroke", "none")
            .style("fill", "#fff");

        patternEnter.append("circle")
            .attr("r", dotRadius)
            .attr("cx", patternSize/2)
            .attr("cy", patternSize/2)
            .style("fill", function(d, i) { return z(i); });

        var layerEnter = svg.selectAll(".layer")
            .data(layers)
          .enter();

        layerEnter.append("path")
            .attr("class", "layer")
            .attr("d", function(d) { if (d.key == "2.4.x") { console.log(area(d.values)); } return area(d.values.slice(1, d.values.length)); })
            .style("fill", function(d, i) { console.log(d, z(i));return z(i); });

        layerEnter.append("path")
            .attr("class", "layer current")
            .attr("d", function(d) { return area(d.values.slice(0, 2)); })
            .style("fill", function(d) { return "url(#" + d.key + ")"; });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "xx axis")
            .attr("transform", "translate(0," + (height+19) + ")")
            .call(xAxis2);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        var legend = d3.select("body").insert("ul", ":first-child")
            .attr("class", "legend");

        var statEnter = legend
            .selectAll("li")
          .data(layers).enter().append("li");
        
        statEnter.append("span")
            .attr("class", "square")
            .style("background", function(d, i) { return z(i); });

        statEnter.append("span")
            .attr("class", "label")
            .text(function(d) { return d.key; });

        var legendPxWidth = legend.style("width");
        var legendWidth = +legendPxWidth.substring(0, legendPxWidth.length-2);
        
        legend.style("width", (legendWidth + margin.left) + "px");
    });
});
