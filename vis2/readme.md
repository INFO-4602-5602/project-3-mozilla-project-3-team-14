#README FOR VIS #2
-----------------

Visualization 2 shows the things the world is excited about/things the world fears with respect to a connected future. Underlying data is from the Mozilla survey. 

## Design Process
We got together to brainstorm some ideas for research questions. We were inspired by the Mozilla blogpost about 10 lessons learned and were eager to demonstrate some of the results in a more visual, in-depth, and interactive manner. I wanted to explore people's the things people feared and were excited about with respect to a connected future. I especially was interested in two questions:
1. Can we see regional trends in global fears and excitements?
2. How do individual country responses compare to one another?

The first question requires a global map for a quick overview. Since the data is ordinal, different hues are used to encode the survey answers for each attribute. Perceptional "pop-out" lets users see countries which do not conform to the overall worldwide distribution, and perceptional ensemble methods let us quickly see the most common answer worldwide. Only one attribute can be viewed at a time, but a menu lets users switch to the other attribute.

The second question is explored in two ways! First, we can view individual country responses for all attribute answers at the same time in the form of two bar graphs, one for each categorical attribute (fears or excitements). From the map we can see the most common answer, but to see the breakdown within a country we have to have more detail. I debated between bar charts and pie charts to display the percentage of responses for each category. In the end, I decided on Bar Charts because this lets us compare across countries more easily (length is easier to judge length than area). Transitions help us track if each bar is shrinking or growing when a new country is clicked. The second way we can compare individual country responses is by repainting the map. If you click on a bar in the bar graph, the map is repainted with a monochrome choroplath scale showing the degree that each country agreed with that attribute answer.

I first built a mock-up using MS-Paint :D.
Then, proceeded to construct the real thing using D3. This whole visualization was built by Brian Lubars. We divided work into separate visualizations, so each team-member would build a separate visualization.

## Running the Project
1. Launch a server in the root directory: `project-3-mozilla-project-3-team-14> python3 -m http.server 8000`
2. http://localhost:8000/vis2/index.html 

## Project requirements/Additions
* Three attributes are visualized here: Country, Fears, Excitements. A fourth (number of respondents per country) is listed in text.
* Comparisons between data attributes: geographic, fears, excitements
* Geography: data displayed as world map
* Interactive:
  * As a country is hovered over: tooltips and gold outlines
  * Clicking a country displays bar charts and outlines it in gold
  * Menu lets users pick between coloring map with fears or excitements
  * Clicking a bar in the bar graph will repaint the map, letting us observe to what degree each country agrees with that attribute answer
* Uncertainty: weakly sort of done by displaying # of respondents, but not ideal admittedly.
* perceptually-informed design: mentioned in the design process section
* Semantic zoom: can view data at a world-level, and zoom into view at a country-level.

## Technical Decisions
D3 v4 is used to power this visualization. In **preprocessing**, I created a compressed version of the survey data and stored it in ../data, and this version is used to read in and produce this visualization. GeoJSON data is used to draw the map, details on the generation of this are listed in the reference resources. The CSV/JSON file sizes total 7MB. Reading in the files takes the majority of time. Drawing the map is also a relatively laborious process and takes a while, but fortunately this only has to be done once, when the page is first loaded. While CSV is being loaded, a "Loading..." text is displayed. CSS was used to format the page in a simple yet hopefully-intuitive design.

## Reference Resources
This visualization was built with help from the following resources:
* D3-GEO documentation: https://github.com/d3/d3-geo/blob/master/README.md#_projection
* Choropleth example with D3: http://bl.ocks.org/rgdonohue/9280446
* Shapefile that I turned into the GeoJSON: http://www.naturalearthdata.com/
* How to generate GeoJSON from shapefile: https://stackoverflow.com/questions/9542834/geojson-world-database
* Group CSV data heirarchically: http://learnjsdata.com/group_data.html
* Map legend: http://d3-legend.susielu.com/#symbol-ordinal
* Add labels to bars: https://stackoverflow.com/questions/42491106/add-labels-to-bar-chart-d3
