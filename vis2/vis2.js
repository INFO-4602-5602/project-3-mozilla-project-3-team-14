// set the dimensions and margins of the graph
var margin = {top: 40, right: 40, bottom: 40, left: 40};
var width = 800 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;

var colorScale = d3.scaleOrdinal(d3['schemeCategory20c']);

var xVal = "year";
var yVal = "percent";

// these functions are the accessors for each element in the dataset
var getX = function(d) { return +d[xVal]; };
var getY = function(d) { return +d[yVal]; };

// these are our scales for the axes
var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// these functions retrieve the appropriate values for the given
// element for the appropriately set scale
var getScaledX = function(d) { return x(d[xVal]); };
var getScaledY = function(d) { return y(d[yVal]); };

var svg;

function parse_data(data) {
    var parsed_rows = [];
    var by_major = {};

    // format the data properly
    for (var i in data) {
        var row = data[i];

        if (row.year && row.major) {
            row.year = +row.year;
            row.percent = parseFloat(row.percent).toFixed(3);

            parsed_rows.push(row);

            if (! (row.major in by_major)) {
                by_major[row.major] = [];
            }

            by_major[row.major].push(row);
        }
    }

    // remove stuff that doesn't have at least 10 years
    for (var major in by_major) {
        if (by_major[major].length <  10) {
            delete by_major[major];
        }
    }

    var majors = {};
    var i = 0;
    for (var major in by_major) {
        majors[major] = i;
        i++;
    }

    // remove invalid majors from the data
    parsed_rows = parsed_rows.filter(row => row.major in majors);

    return {
        'data' : parsed_rows,
        'by_major' : by_major,
        'majors' : majors,
    };
}

d3.csv("./data.csv", function(error, data) {
    var parsed = parse_data(data);
    var data = parsed.data;
    var by_major = parsed.by_major;
    var majors = parsed.majors;

    // scale things
    x.domain(d3.extent(data, getX));
    y.domain([0, 1]);

    svg = getSVGWithLabelsAndAxes('#vis2', x, y, "Percentage of Women in different majors over time");

    var line = d3.line()
        .x(getScaledX)
        .y(getScaledY);

    // gridlines code credit to: 
    // https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    // gridlines in x axis function
    function make_x_gridlines() {		
        return d3.axisBottom(x)
            .ticks(5)
    }

    // gridlines in y axis function
    function make_y_gridlines() {		
        return d3.axisLeft(y)
            .ticks(5)
    }

    // add the X gridlines
    svg.append("g")			
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(make_x_gridlines()
            .tickSize(-height)
            .tickFormat("")
        )

    // add the Y gridlines
    svg.append("g")			
        .attr("class", "grid")
        .call(make_y_gridlines()
            .tickSize(-width)
            .tickFormat("")
        )

    for (var major in majors) {
        info = by_major[major].sort(function(a, b){return a[xVal] - b[xVal]});

        svg.append("path")
            .data([info])
            .attr("class", "vis2-line " + getMajorAsClass(major))
            .attr("d", line)
            .attr("stroke", colorScale(majors[major]))
            .attr("stroke-width", 3)
            .style("fill", 'none')
            .on("mouseover", lineMouseOver)
            .on("mouseout", lineMouseOut);
    }

    svg.selectAll(".vis2-dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", function(d, i) { return "vis2-dot " + getMajorAsClass(d.major) })
        .attr("cx", getScaledX)
        .attr("cy", getScaledY)
        .attr("r", 4)
        .attr("fill", function(d, i) { return colorScale(majors[d.major]); })
        .on("mouseover", dotMouseOver)
        .on("mouseout", dotMouseOut);

});

// this function isolates the way we turn a major into an html class
function getMajorAsClass(major) {
    return major.replace(/ /g,'');
}

// this function takes a class name, a major, and an opacity
// and changes all elements of the given classname without the 
// given major to the new opacity.
function changeElementOpacityForDifferentMajors(class_name, major, new_opacity) {
    var elements = document.getElementsByClassName(class_name);

    for (var i in elements) {
        var element = elements[i];
        // var classes = element.className;

        if (element.className) {
            var classes = element.className.baseVal.split(" ");

            alt_major = classes.filter(c => c != class_name)[0];

            if (alt_major != major) {
                element.style.opacity = new_opacity;
            }
        }
    }
}

// this function:
// - makes everything not from this line's major translucent
// - adds a div describing the major being shown
function lineMouseOver(l, i) {
    var major = getMajorAsClass(l[0].major);

    changeElementOpacityForDifferentMajors("vis2-line", major, '.1');
    changeElementOpacityForDifferentMajors("vis2-dot", major, '.1');

    // this makes the tooltip visible
    div.transition()
        .duration(50)
        .style("opacity", .9);

    var string = "Women majoring in <i>" + l[0]['major'] + '</i>';

    // this sets the location and content of the tooltip to the point's location/coordinates
    div.html(string)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
}

// this function:
// - makes everything not from this line's major non-translucent
// - hides a div describing the major being shown
function lineMouseOut(l, i) {
    var major = getMajorAsClass(l[0].major);

    changeElementOpacityForDifferentMajors("vis2-line", major, '1');
    changeElementOpacityForDifferentMajors("vis2-dot", major, '1');

    div.transition()
        .duration(100)
        .style("opacity", 0);
}

// this div will be hidden at first, but will appear on hover to show
// tooltips
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// this function does two things:
// 1. it makes the radius a dot bigger
// 2. it makes a tooltip appear which displays the x and y coordinates of the point
function dotMouseOver(d, i) {
    d3.select(this).attr('r', '10');

    // this makes the tooltip visible
    div.transition()
        .duration(50)
        .style("opacity", .9);

    var percent = 100 * d[yVal];
    percent = percent.toFixed(1);

    var string = "Women made up " + percent + "% of the <i>" + d['major'] + '</i> major in ' + d[xVal];

    // this sets the location and content of the tooltip to the point's location/coordinates
    div.html(string)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
}

// this function does two things:
// 1. it resets the radius of a dot
// 2. it makes the tooltip invisible.
function dotMouseOut(d, i) {
    d3.select(this).attr('r', '4');

    div.transition()
        .duration(100)
        .style("opacity", 0);
}

// this function takes in three parameters:
// 1. an element to append an SVG to
// 2. an x-axis
// 3. a y-axis
// 
// it does the gruntwork of:
// - making the svg the right size
// - adding the x- and y-axes to the graph
// - labelling those axes
function getSVGWithLabelsAndAxes(element, x_axis, y_axis, label) {
    var svg = d3.select(element).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate("+ margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("class", "label")
        .text(xVal)
        .attr("x", width + 10)
        .attr("y", height);

    // y-axis label
    svg.append("text")
        .attr("class", "label")
        .text(yVal)
        .attr("y", - 10);

    // x-axis
    svg.append("g")
        .attr("transform", "translate(0, " + height + ")")
        .call(d3.axisBottom(x_axis));

    // y-axis
    svg.append("g")
        .call(d3.axisLeft(y_axis));

    if (label) {
        svg.append("text")
            .attr("x", (width / 2))             
            .attr("y", 0 - (margin.top / 3))
            .attr("text-anchor", "middle")  
            .style("font-size", "16px") 
            .style("text-decoration", "underline")  
            .text(label);
    }

    return svg;
}
