"use strict";

var url = "/api/overview/";
var volumeByTimeChart, volumeByTimeXAxis, dayHourHeatmap;
var outFormats = {
    "month": "%b %y",
    "week": "%m/%d/%y",
    "day": "%a %m/%d",
    "hour": "%m/%d %H:%M"
};

var dashboard = new Ractive({
    el: document.getElementById("dashboard"),
    template: "#dashboard-template",
    data: {
        loading: true,
        filter: {},
        data: {
            'volume_over_time': {
                'period_size': 'day',
                'results': []
            },
            'day_hour_heatmap': []
        },
        describeFilter: function (filter) {
            var components = [];
            var keys = _.keys(filter).sort();

            keys.forEach(function (key) {
                if (key.endsWith("_0")) {
                    components.push({s: key.slice(0, -2),  v: ">=", o: filter[key]});
                } else if (key.endsWith("_1")) {
                    components.push({s: key.slice(0, -2),  v: "<=", o: filter[key]});
                } else {
                    components.push({s: key,  v: "=", o: filter[key]});
                }
            });

            return components;
        }
    },
    delimiters: [ '[[', ']]' ],
    tripleDelimiters: [ '[[[', ']]]' ]
});

updateFilter();

dashboard.observe('filter', function (filter) {
    d3.json(buildURL(filter), function (error, newData) {
        if (error) throw error;
        dashboard.set('loading', false);
        dashboard.set('data', newData);
    });
});

dashboard.observe('loading', function (loading) {
    if (loading) {
        showLoading();
    } else {
        hideLoading();
    }
});

dashboard.observe('data', function (data) {
    if (!dashboard.get('loading')) {
        if (!volumeByTimeChart) {
            var retval = buildVolumeByTimeChart(data.volume_over_time);
            volumeByTimeChart = retval[0];
            volumeByTimeXAxis = retval[1];
        } else {
            volumeByTimeXAxis.tickFormat = outFormats[data.volume_over_time.period_size];
            volumeByTimeChart.data = data.volume_over_time.results;
            volumeByTimeChart.draw(200);
        }
        dayHourHeatmap = buildDayHourHeatmap(data.day_hour_heatmap);
    }
});

d3.select(window).on("hashchange", updateFilter);

// ========================================================================
// Functions
// ========================================================================

function showLoading() {
    d3.selectAll(".loading").style("display", "block");
}

function hideLoading() {
    console.log("hidden");
    d3.selectAll(".loading").style("display", "none");
}

function buildQueryParams(obj) {
    var str = "";
    for (var key in obj) {
        if (str != "") {
            str += "&";
        }
        str += key + "=" + encodeURIComponent(obj[key]);
    }
    return str;
}

function buildURL(filter) {
    return url + "?" + buildQueryParams(filter);
}

function parseQueryParams(str) {
    if (typeof str != "string" || str.length == 0) return {};
    var s = str.split("&");
    var s_length = s.length;
    var bit,
        query = {},
        first,
        second;
    for (var i = 0; i < s_length; i++) {
        bit = s[i].split("=");
        first = decodeURIComponent(bit[0]);
        if (first.length == 0) continue;
        second = decodeURIComponent(bit[1]);
        if (typeof query[first] == "undefined") query[first] = second; else if (query[first] instanceof Array) query[first].push(second); else query[first] = [query[first], second];
    }
    return query;
}

function buildVolumeByTimeChart(data) {
    var parentWidth = d3.select("#volume-over-time").node().clientWidth;

    var margin = {top: 20, right: 20, bottom: 50, left: 50},
        width = parentWidth,
        height = 500;

    var svg = dimple.newSvg("#volume-over-time", width, height);

    var myChart = new dimple.chart(svg, data.results);
    myChart.setMargins(margin.left, margin.top, margin.right, margin.bottom);

    var x = myChart.addTimeAxis("x", "period_start", "%Y-%m-%dT%H:%M:%S", outFormats[data.period_size]);
    x.title = "Date";
    var y = myChart.addMeasureAxis("y", "period_volume");
    y.title = "Call Volume";
    var s = myChart.addSeries(null, dimple.plot.line);
    var t = myChart.addSeries(null, dimple.plot.bubble);
    myChart.draw();
    return [myChart, x];
}

function buildDayHourHeatmap(data) {
    var parentWidth = d3.select("#day-hour-heatmap").node().clientWidth;

    var margin = {top: 50, right: 0, bottom: 100, left: 30},
        width = parentWidth - margin.left - margin.right,
        height = 430 - margin.top - margin.bottom,
        gridSize = Math.floor(width / 24),
        legendElementWidth = gridSize * 2,
        buckets = 9,
        colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
    // alternatively colorbrewer.YlGnBu[9]
        days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];

    data.forEach(function (d) {
        d.day = +d.dow_received;
        d.hour = +d.hour_received;
        d.value = +d.volume;
    });

    if (data.length < 24 * 7) {
        for (var i = 0; i < 7; i++) {
            for (var j = 0; j < 24; j++) {
                if (!_.find(data, function (d) {
                        return d.day === i && d.hour === j;
                    })) {
                    data.push({day: i, hour: j, value: 0});
                }
            }
        }
    }

    data = _.sortBy(data, function (d) {
        return d.day * 24 + d.hour;
    });

    var colorScale = d3.scale.quantile().domain([0, buckets - 1, d3.max(data, function (d) {
        return d.value;
    })]).range(colors);

    var svg = d3.select("#day-hour-heatmap").select("svg");

    if (svg.size() === 0) {
        svg = d3.select("#day-hour-heatmap").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    } else {
        svg = svg.select("g");
    }

    var dayLabels = svg.selectAll(".dayLabel").data(days).enter().append("text").text(function (d) {
        return d;
    }).attr("x", 0).attr("y", function (d, i) {
        return i * gridSize;
    }).style("text-anchor", "end").attr("transform", "translate(-6," + gridSize / 1.5 + ")").attr("class", function (d, i) {
        return i >= 0 && i <= 4 ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis";
    });

    var timeLabels = svg.selectAll(".timeLabel").data(times).enter().append("text").text(function (d) {
        return d;
    }).attr("x", function (d, i) {
        return i * gridSize;
    }).attr("y", 0).style("text-anchor", "middle").attr("transform", "translate(" + gridSize / 2 + ", -6)").attr("class", function (d, i) {
        return i >= 7 && i <= 16 ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis";
    });

    var heatMap = svg.selectAll(".hour").data(data);

    heatMap.enter().append("rect").attr("x", function (d) {
        return d.hour * gridSize;
    }).attr("y", function (d) {
        return d.day * gridSize;
    }).attr("rx", 4).attr("ry", 4).attr("class", "hour bordered").attr("width", gridSize).attr("height", gridSize);

    heatMap.exit().remove();

    heatMap.style("fill", colors[0]);

    heatMap.transition().duration(1000).style("fill", function (d) {
        return colorScale(d.value);
    });

    heatMap.append("title").text(function (d) {
        return d.value;
    });

    svg.selectAll(".legend").remove();

    var legend = svg.selectAll(".legend").data([0].concat(colorScale.quantiles()), function (d) {
        return d;
    }).enter().append("g").attr("class", "legend");

    legend.append("rect").attr("x", function (d, i) {
        return legendElementWidth * i;
    }).attr("y", height).attr("width", legendElementWidth).attr("height", gridSize / 2).style("fill", function (d, i) {
        return colors[i];
    });

    legend.append("text").attr("class", "mono").text(function (d) {
        return "≥ " + Math.round(d);
    }).attr("x", function (d, i) {
        return legendElementWidth * i;
    }).attr("y", height + gridSize);
}

function updateFilter() {
    if (window.location.hash) {
        dashboard.set('filter', parseQueryParams(window.location.hash.slice(1)));
    } else {
        dashboard.set('filter', {});
    }
}


