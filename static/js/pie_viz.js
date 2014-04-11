$(document).ready(function() {
    // var w = 300,                        //width
    // h = 300,                            //height
    // r = 100,                            //radius
    // color = d3.scale.category20c();     //builtin range of colors
 
    // data = [{"label":"one", "value":20}, 
    //         {"label":"two", "value":50}, 
    //         {"label":"three", "value":30}];
    
    d3.json("/os", function(err, allData) {
        var osNameMap = {
            "win32": "Windows",
            "osx": "Mac OS X",
            "linux": "Linux",
            "src": "Source",
            "other": "Other"
        };

        var data = [];
        var other = {_id: "other", value: 0};
        _.each(allData, function(element, index) {
            if (typeof osNameMap[element._id] !== "undefined") {
                data.push(element);
            } else {
                other.value += element.value;
            }
        });
        data.push(other); 

        _.each(data, function(element, index) {
            element.label = osNameMap[element._id];
            if (typeof element.label == "undefined") {
                element.label = "Other";
            }
        });

        var svg = d3.select("#viz")
            .append("svg")
            .append("g");

        svg.append("g")
            .attr("class", "slices");
        svg.append("g")
            .attr("class", "labels");
        svg.append("g")
            .attr("class", "lines");

        var width = 960,
            height = 450,
            radius = Math.min(width, height) / 2;

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) {
                return d.value;
            });

        var arc = d3.svg.arc()
            .outerRadius(radius * 0.8)
            .innerRadius(radius * 0.4);

        var outerArc = d3.svg.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var key = function(d) { return d.data.label; };

        var color = d3.scale.ordinal()
            .domain([data[0]._id, data[1]._id, data[2]._id, data[3]._id, data[4]._id])
            .range(["#373e50", "#535d77", "#6e7c9f", "#8b96b2", "#a8b0c5"]);


        // function randomData() {
        //     var labels = color.domain();
        //     return labels.map(function(label){
        //         return { label: label, value: Math.random() };
        //     });
        // }

        // change(randomData());
        change(data);


        function change(data) {
            console.log(data);
            /* ------- PIE SLICES -------*/
            var slice = svg.select(".slices").selectAll("path.slice")
                .data(pie(data), key);

            slice.enter()
                .insert("path")
                .style("fill", function(d) { return color(d.data.label); })
                .attr("class", "slice");

            slice
                .transition().duration(1000)
                .attrTween("d", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        return arc(interpolate(t));
                    };
                });

            slice.exit()
                .remove();

            /* ------- TEXT LABELS -------*/

            var comma = d3.format(",");

            var text = svg.select(".labels").selectAll("text")
                .data(pie(data), key);

            text.enter()
                .append("g")
                .attr("class", "label")
                .append("text")
                .attr("class", "value")
                .attr("dy", "-6px")
                .text(function(d) {
                    return comma(d.data.value);
                });
            d3.selectAll(".label")
                .append("text")
                .attr("class", "os")
                .attr("dy", "15px")
                .text(function(d) {
                    return d.data.label;
                });
            
            function midAngle(d) {
                return d.startAngle + (d.endAngle - d.startAngle)/2;
            }

            var close = (Math.PI*2) - (.05 * Math.PI * 2); // close to top of arc

            text.transition().duration(1000)
                .attrTween("transform", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        var pos = outerArc.centroid(d2);
                        var mid = midAngle(d2);
                        pos[0] = radius * 1.2 * (mid < Math.PI || mid > close? 1 : -1);
                        return "translate("+ pos +")";
                    };
                })
                .styleTween("text-anchor", function(d){
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        var mid = midAngle(d2);
                        return mid < Math.PI || mid > close ? "end" : "start";
                    };
                });

            text.exit()
                .remove();

            /* ------- SLICE TO TEXT POLYLINES -------*/

            var polyline = svg.select(".lines").selectAll("polyline")
                .data(pie(data), key);
            
            polyline.enter()
                .append("polyline");

            polyline.transition().duration(1000)
                .attrTween("points", function(d){
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        console.log(d);
                        var d2 = interpolate(t);
                        var pos = outerArc.centroid(d2);
                        end = d.endAngle;
                        start = d.startAngle;
                        console.log(midAngle(d));
                        var mid = midAngle(d2);
                        console.log("mid: " + mid + ", close: " + close);
                        pos[0] = radius * 1.2 * (mid < Math.PI || mid > close? 1 : -1);
                        console.log(pos[0]);
                        return [arc.centroid(d2), outerArc.centroid(d2), pos];
                    };
                });
            
            polyline.exit()
                .remove();
        }
    });
});
