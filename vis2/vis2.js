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
var svg_size = {margin: margin, width: width, height: height};
var data;

// create color scale
var color = d3.scaleOrdinal(d3.schemeCategory10);

var fearField = "What is your biggest fear as we move towards a more connected future?";
var fearsMapping = [
    "The loss of privacy", 
    "We'll lose touch with one another", 
    "I have no fears about a more connected future", 
    "We'll be less safe", "Other (please specify)"];
var exciteField = "What are you most excited about as we move toward a more digitally connected future?";

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
}

function processData(error, geo, rawdata) {
    if (error) throw error;
    // group our data by country
    data = d3.nest()
        .key(function(d) { return d.Country; })
        // rollup: replace indiv records within group by one record
        .rollup(sumarizeCountry)
        .object(rawdata);
    console.log(data)

    drawMap(geo, data);
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
        return color(max);
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
function drawMap(geojson, data) {
    console.log(geojson);
    // projection: function that converts from long/lat to x/y
    //var projection = d3.geoEquirectangular()
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
            return getCountryAttrColor(d.properties.NAME_LONG, 'Feared'); })
        .on("mouseover", handleCountryMouseoverEvent)
        .on("mouseout", handleCountryMouseoutEvent)
        .on("click", handleCountryClickEvent);

    var legend = d3.legendColor()
        .shape('circle')
        .labels(fearsMapping)
        .scale(color);

    // add a color key
    svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(12,320)")
        .call(legend);

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
    svg = d3.select("#countryInfo svg")
    var x = d3.scaleLinear().rangeRound([0, 150]);
    var y = d3.scaleLinear().rangeRound([100, 0]);
    x.domain(fearsMapping);
    y.domain([0, d3.max(data, function(d) { return d; } )]);
    svg.append("g")
        .selectAll(".bar")
        .data(nums['Feared'])
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d); })
        .attr("y", function(d) { return y(d); })
        .attr("width", "20")
        .attr("height", function(d) { return 100 - y(d); });
}

/* run the script! */
main();

