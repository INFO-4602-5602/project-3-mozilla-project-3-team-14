//
// Script to draw Vis 2
// 4/4/2018
//
var dataFile = "../data/mozilla-filt-coded.csv"
// GeoJSON converted from public-domain shape file from Natural Earth Data
// http://www.naturalearthdata.com/
var geoFile = "./110m_countries_2.json"

// set the dimensions and margins of the graph
var margin = {top: 40, right: 40, bottom: 40, left: 40};
var width = 880 - margin.left - margin.right
var height = 500 - margin.top - margin.bottom;
var map_size = {width: 800, height: 420};
var barchart_size = {margin: margin, width: 160, height: 150};
var data;
var geodata;

/* Strings for displaying visualization in human-readable format! */
var fearField = "What is your biggest fear as we move towards a more connected future?";
var fearsMapping = [
    "The loss of privacy", 
    "We'll lose touch with one another", 
    "I have no fears about a more connected future", 
    "We'll be less safe", 
    "Other (please specify)"];
var exciteField = "What are you most excited about as we move toward a more digitally connected future?";
var exciteMapping = [
    "None of the above", 
    "How much fun it will be", 
    "How it will bring the world together", 
    "How it will make us all smarter and better educated", 
    "How easy it will make life", 
    "Other (please specify)"];
var attributeData = {
    'Feared': {
        'question': fearField, 
        'answers': fearsMapping, 
        'maptitle': "Most Common Fears of a Connected Future",
        'title': "What's Your Biggest Fear?",
        'color': null },
    'Excited': {
        'question': exciteField, 
        'answers': exciteMapping,
        'maptitle': "Most Common Reasons for Excitement in a Connected Future",
        'title': "What're You Most Excited About?",
        'color': null }};

/* Run everything! */
function main() {
    // add svg to canvas, set size
    d3.select("#map").append("svg")
        .attr("width", map_size.width)
        .attr("height", map_size.height);

    /* need to load both JSON and CSV before we can go. */
    d3.queue()
        /* Load the GeoJSON: JSON format for specifying geographic data:
         * used to draw the map. geoJSON taken from: */
        .defer(d3.json, geoFile)
        /* This is the data loader function: load data from the CSV and
         * set up the HTML with an SVG */
        .defer(d3.csv, dataFile)
        /* execute this function when both above done! */
        .await(processData);

    d3.selectAll(".menubutton")
        .on("click", handleMenuClick)

    // create color scales
    attributeData.Feared.color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain([0, 1, 2, 3, 4]);
    attributeData.Excited.color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain([0, 1, 2, 3, 4, 5]);
}

function handleMenuClick(d, i) {
    text = d3.select(this).text();
    if (text == "Fears") {
        attribute = "Feared";
    } else {
        attribute = "Excited";
    }
    updateMap(geodata, data, attribute);
    d3.selectAll(".menubutton")
        .style("background-color", "white");
    d3.select(this)
        .style("background-color", "gold");
}

function handleCountryMouseoverEvent(d, i) {
    // outline on mousover
    d3.select(this)
      .style("stroke", "gold")
      .style("stroke-width", "2px");
    // make tooltip appear, set text
    d3.select("body #tooltip")
      .style("opacity", 0.9)
      .style("left", (d3.event.pageX + 5) + "px")
      .style("top", (d3.event.pageY + 5) + "px");
    d3.select("body #tooltip p")
      .text(d.properties.NAME);
}

function processData(error, geo, rawdata) {
    if (error) throw error;
    // group our data by country
    data = d3.nest()
        .key(function(d) { return d.Country; })
        // rollup: replace indiv records within group by one record
        .rollup(sumarizeCountry)
        .object(rawdata);
    geodata = geo;

    // remove loading text
    d3.select("#map h2").remove();

    // draw the map!
    drawMap(geo, data, "Feared");
}

function getCountryData(country) {
    if (data[country] == undefined) {
        console.log("Country not found");
        return null;
    } else {
        return data[country];
    }
}

/* this function returns a color to fill the svg path for a country,
 * based on the given attribute (maximum fears or excitements). */
function getCountryAttrColor(country, attribute) {
    if (data[country] == undefined) {
        console.log("Country not found");
        console.log(country);
        return "#ddd";
    } else {
        d = data[country][attribute];
        props = Object.keys(d);
        max = props[0];
        for (var i = 0; i < props.length; i++) {
            if (d[props[i]] > d[max]) {
                max = props[i];
            }
        }
        return attributeData[attribute].color(max);
    }
}

/* this function returns a color to fill the svg path for a country,
 * based on the given attribute (maximum fears or excitements). */
function getCountryAttrAnsColor(country, attribute, answer, colorscale) {
    if (data[country] == undefined) {
        console.log("Country not found");
        console.log(country);
        return "#ddd";
    } else {
        d = data[country][attribute];

        var totalResponses = 0;
        if (nums != null) {
            for (prop in d) {
                totalResponses += d[prop];
            }
        }

        var percent = 0;
        if (d[answer] != undefined) {
            percent = d[answer] * 100 / totalResponses;
        }

        return colorscale(percent);
    }
}

function sumarizeCountry(entries) {
    var filt = entries.filter(function(d) { 
            return (d[fearField] != "") && (d[exciteField] != ""); })
    /* count each response for fears and excitements */
    fear = filt.reduce(function(sum, entry) {
        d = +entry[fearField];
        if (sum[d] == undefined) {
            sum[d] = 1;
        } else {
            sum[d] += 1;
        }
        return sum;
    }, {});
    exc = filt.reduce(function(sum, entry) {
        d = +entry[exciteField];
        if (sum[d] == undefined) {
            sum[d] = 1;
        } else {
            sum[d] += 1;
        }
        return sum;
    }, {});

    return {"Feared":fear, "Excited":exc};
}

/* This function draws the world map projection, coloring each country
 * according to the given attribute */
//function drawMap(data, attribute) {
function drawMap(geojson, data, attribute) {
    // update map title
    d3.select("#map h3")
        .text(attributeData[attribute].maptitle);

    // projection: function that converts from long/lat to x/y
    var projection = d3.geoNaturalEarth1()
        .scale(150) // default scale is 150
        .translate([map_size.width / 2, (map_size.height / 2)])
        .precision(.1);
    // generator creates svg path from projection
    var generator = d3.geoPath()
        .projection(projection);
    // add path to svg
    var svg = d3.select('#map svg');

    // draw longitude/lattitude lines
    svg.append('g')
        .attr("class", "graticule")
        .selectAll('path')
        .data(d3.geoGraticule().lines)
        .enter()
        .append("path")
        .attr("d", generator)

    // draw countries
    svg.append('g')
        .attr("class", "country")
        .selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', generator)
        .style("fill", function(d) { 
            return getCountryAttrColor(d.properties.NAME_LONG, attribute); })
        .on("mouseover", handleCountryMouseoverEvent)
        .on("mouseout", handleCountryMouseoutEvent)
        .on("click", handleCountryClickEvent);

    var legend = d3.legendColor()
        .shape('circle')
        .scale(attributeData[attribute].color)
        .labels(attributeData[attribute].answers);

    // add a color key
    svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(12,320)")
        .call(legend);
}

function updateSingleColorMap(geojson, attribute, answer) {
    var svg = d3.select('#map svg')

    // make color scale
    pureColor = attributeData[attribute].color(answer);
    console.log(pureColor);
    var monoColor = d3.scaleLinear()
        .domain([0, 100])
        .interpolate(d3.interpolateRgb)
        .range([d3.rgb("#ffffff"), d3.rgb(pureColor)]);

    // update map title
    d3.select("#map h3")
        .text(attributeData[attribute].maptitle);
    d3.select("#map h4")
        .text("(Showing '" + attributeData[attribute].answers[answer] + "')");

    // draw countries
    svg.select("g.country").selectAll('path')
        .data(geojson.features)
        .transition()
        .duration(800)
        .style("fill", function(d) { 
            return getCountryAttrAnsColor(d.properties.NAME_LONG, attribute, answer, monoColor); })

    var legendLinear = d3.legendColor()
        .shapeWidth(30)
        .cells(6)
        .orient("horizontal")
        .scale(monoColor);
    svg.select("g.key").remove();
    g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(4,380)")
        .call(legendLinear);

}

/* This function re-colors the map, coloring according to given attribute */
function updateMap(geojson, data, attribute) {
    var svg = d3.select('#map svg')

    // update map title
    d3.select("#map h3")
        .text(attributeData[attribute].maptitle);
    d3.select("#map h4")
        .text("");

    // draw countries
    svg.select("g.country").selectAll('path')
        .data(geojson.features)
        .transition()
        .duration(800)
        .style("fill", function(d) { 
            return getCountryAttrColor(d.properties.NAME_LONG, attribute); })

    // add a color key
    var legend = d3.legendColor()
        .shape('circle')
        .scale(attributeData[attribute].color)
        .labels(attributeData[attribute].answers);
    svg.select("g.key").remove();
    svg.append("g")
        .attr("class", "key")
        //.attr("transform", "translate(12,320)")
        .attr("transform", "translate(12,300)")
        .call(legend);
}

function handleCountryMouseoverEvent(d, i) {
    // outline on mousover
    d3.select(this)
      .style("stroke", "gold")
      .style("stroke-width", "2px");
    // make tooltip appear, set text
    d3.select("body #tooltip")
      .style("opacity", 0.8)
      .style("left", (d3.event.pageX + 5) + "px")
      .style("top", (d3.event.pageY + 5) + "px");
    d3.select("body #tooltip p")
      .text(d.properties.NAME);
}

function handleCountryMouseoutEvent(d, i) {
    // outline on mousover
    if(this != activeCountryItem) {
        d3.select(this)
            .style("stroke", "#aaa")
            .style("stroke-width", "1px");
    }
    d3.select("body #tooltip")
        .style("opacity", 0)
        .style("left", "0px")
        .style("top", "0px");
}


function handleAnswerClick(d, i) {
    updateSingleColorMap(geodata, d.attr, d.x);
}

function handleAnswerMouseoverEvent(d, i) {
    // outline on mousover
    d3.select(this)
      .style("stroke", "gold")
      .style("stroke-width", "2px");
}

function handleAnswerMouseoutEvent(d, i) {
    d3.select(this)
        .style("stroke", "none");
        //.style("stroke-width", "1px");
}

/* This function takes in an associative array, and returns 
 * an array, required for use in D3 graphing the data */
function objectToArray(data, attr) {
    var len = attributeData[attr].answers.length;
    var arr = [];
    for (var i = 0; i < len; i++) {
        arr.push({'x':i, 'y':0, 'attr':attr});
        if (data[attr][i] != undefined) {
            // property 'i' is present in object
            arr[i].y = data[attr][i];
        }
    }

    return arr;
}

activeCountryItem = null;
/* function to handle the clicking of a country. Transition that
 * country to active state: 
 * highlight it, and display its stats */
function handleCountryClickEvent(d, i) {
    // deselect old country
    d3.select(activeCountryItem)
        .style("stroke", "#aaa")
        .style("stroke-width", "1px");
    // select new country
    activeCountryItem = this;
    d3.select(this)
        .style("stroke", "gold")
        .style("stroke-width", "2px");
    d3.select("#countryInfo h3")
        .text(d.properties.NAME);
    nums = getCountryData(d.properties.NAME_LONG);
    var totalResponses = 0
    if (nums != null) {
        for (prop in nums['Feared']) {
            totalResponses += nums['Feared'][prop];
        }
    }
    d3.select("#countryInfo p")
        .text("Total Responses: " + totalResponses);
    // make bar chart
    svg = d3.select("#countryInfo svg.fears");
    console.log(svg);
    drawBarChart(svg, nums, 'Feared', totalResponses);
    svg = d3.select("#countryInfo svg.excitements");
    drawBarChart(svg, nums, 'Excited', totalResponses);
}

/* This function draws a country-specific bar chart for the given
 * attribute. */
function drawBarChart(svg, data, attribute, total) {
    // convert data into good format for d3 to build a bar chart
    thisData = objectToArray(nums, attribute);
    var x = d3.scaleLinear().range([0, barchart_size.width]);
    var y = d3.scaleLinear().range([barchart_size.height, 0]);
    x.domain([0, d3.max(thisData, function(d) { return d.x; } )]);
    //y.domain([0, d3.max(thisData, function(d) { return d.y; } )]);
    y.domain([0, 100]);
    bars = svg.select("g")
        .attr("transform", "translate(" + 
            barchart_size.margin.left + "," + 
            barchart_size.margin.top + ")")
        .selectAll("rect")
        .data(thisData);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.x); })
        .attr("y", function(d) { return y(d.y * 100 / total); })
        .attr("fill", function(d) { return attributeData[attribute].color(d.x); })
        .attr("width", "25")
        .attr("height", function(d) { return barchart_size.height - y(d.y * 100 / total); })
        .on("click", handleAnswerClick)
        .on("mouseover", handleAnswerMouseoverEvent)
        .on("mouseout", handleAnswerMouseoutEvent);

    bars.transition()
        .duration(200)
        .attr("x", function(d) { return x(d.x); })
        .attr("y", function(d) { return y(d.y * 100 / total); })
        .attr("fill", function(d) { return attributeData[attribute].color(d.x); })
        .attr("width", "25")
        .attr("height", function(d) { return barchart_size.height - y(d.y * 100 / total); });

    labels = svg.select("g").selectAll("text")
        .data(thisData);

    labels.enter()
        .append("text")
        .attr("class", "barlabel")
        .text(function(d) { return attributeData[attribute].answers[d.x] })
        .attr("transform", function(d) { 
            cx = x(d.x) + barchart_size.margin.left + 10 - 40;
            cy = 30 + y(d.y * 100 / total) - 40;
            return "rotate(-45," + cx + "," + cy + ")"; })
        .attr("y", function(d) { return 30 + y(d.y * 100 / total) - 40; })
        .attr("x", function(d) { return x(d.x) + barchart_size.margin.left + 10 - 40; });

    labels.transition()
        .duration(200)
        .attr("transform", function(d) { 
            cx = x(d.x) + barchart_size.margin.left + 10 - 40;
            cy = 30 + y(d.y * 100 / total) - 40;
            return "rotate(-45," + cx + "," + cy + ")"; })
        .attr("y", function(d) { return 30 + y(d.y * 100 / total) - 40; })
        .attr("x", function(d) { return x(d.x) + barchart_size.margin.left + 10 - 40; });

    /* only need to do this part once. */
    if (svg.selectAll("g").size() < 2) {
      // Add the X Axis
      /*
      svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + barchart_size.margin.left + ", " + (barchart_size.height + barchart_size.margin.top) + ")")
        .call(d3.axisBottom(x)); */

      // Add the Y Axis
      svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + barchart_size.margin.left + ", " + barchart_size.margin.top + ")")
        .call(d3.axisLeft(y).ticks(5));

      // add the text labels
      svg.append("text") // X
        .attr("class", "label")
        .text("Most " + attribute)
        .attr("x", barchart_size.width - 60)
        .attr("y", barchart_size.height + barchart_size.margin.top + 15);
      svg.append("text") // Y
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(barchart_size.height/2 + 30)) //y after transform, neg = down
        .attr("y", 12)  // y after transform, neg = right
        .style("text-anchor", "middle")
        .text("Percent");
      svg.append("text") // Title
        .attr("class", "label")
        .attr("y", 12)
        .attr("x", 20)
        .text(attributeData[attribute].title)
        .style("font-weight", "bold");
    }
}

/* run the script! */
main();

