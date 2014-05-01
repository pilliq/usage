$(document).ready(function() {
    
    var formatDate = d3.time.format("%B");
    var formatNumber = d3.format(",");
    var formatPercent = d3.format(".2%");

    d3.json("/monthly", function(err, allData) {
        //parse dates into objects
        for (var i = 0; i < allData.length; i++) {
            var parts = allData[i]["_id"].split("-");
            allData[i]["_id"] = new Date(+parts[0], (+parts[1])-1);
        }

        var now = new Date(2013, 11);
        var previousDate = new Date(now);
        previousDate.setMonth(now.getMonth() - 1);
        var startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 2);
        var projectedDate = new Date(now); // current

        var data = allData.filter(function(d) { return d["_id"] <= projectedDate && d["_id"] >= startDate ? d : false; });

        console.log(data);

        data.sort(function(a, b) {
            return (a["_id"] < b["_id"]) ? -1 : 1;
        });

        var start = data[0]
        var previous = data[1];
        var projected = data[2];
        
        var projectedTotal = previous.value.total + 1000;
        var projectedUnique = previous.value.unique + 1000;

        var totalChangeValue = projectedTotal - previous.value.total;
        var totalChangePercent = totalChangeValue / previous.value.total;

        var uniqueChangeValue = projectedUnique - previous.value.unique;
        var uniqueChangePercent = uniqueChangeValue / previous.value.unique;
        

        d3.select("#previous-header")
            .text(formatDate(previousDate));

        d3.select("#projected-header")
            .text(formatDate(projectedDate))
          .append("span")
            .attr("class", "caveat")
            .text(" (projected)");


        d3.select("#previous-total")
            .text(formatNumber(previous.value.total));

        d3.select("#projected-total")
            .text(formatNumber(projectedTotal));

        d3.select("#total-change-value")
            .text(formatNumber(totalChangeValue));

        d3.select("#total-change-percent")
            .text(formatPercent(totalChangePercent));

        if (totalChangeValue < 0) {
            d3.select("#total-change-up")
                .classed("not", true);
        } else if (totalChangeValue > 0) {
            d3.select("#total-change-down")
                .classed("not", true);
        } else {
            d3.select("#total-change-down")
                .classed("not", true);
            d3.select("#total-change-up")
                .classed("not", true);
        }

        d3.select("#previous-unique")
            .text(formatNumber(previous.value.unique));

        d3.select("#projected-unique")
            .text(formatNumber(projectedUnique));

        d3.select("#unique-change-value")
            .text(formatNumber(uniqueChangeValue));

        d3.select("#unique-change-percent")
            .text(formatPercent(uniqueChangePercent));

        if (uniqueChangeValue < 0) {
            d3.select("#unique-change-up")
                .classed("not", true);
        } else if (uniqueChangeValue > 0) {
            d3.select("#unique-change-down")
                .classed("not", true);
        } else {
            d3.select("#unique-change-down")
                .classed("not", true);
            d3.select("#unique-change-up")
                .classed("not", true);
        }

    });
});
