Visualization 1 is a depiction of the way countries feel about a more connected future.  It uses the Mozilla survey data and there are a few stages in the design process that are laid out below.

Brainstorming:
The first step in the process was to come up with an idea for a visualization.  We got together as a group and then exchanged research ideas.  I decided I wanted to visualize how people were feeling about a more connected future on a global scale.  Because we had access to country data, I was excited to try and map the data to a Google Earth derivative, so I would have all the functionality of panning, zooming, and tilting the camera.  I did some research and found a great solution that would use WebGL and Cesium.

WebGL and Cesium:
The second step in the process was to get the environments setup for WebGl and Cesium.  I used an open source example on Cesium's homepage to setup the initial visualization.  I then had to format the title and description divs to overlay on top of the Cesium background.  This was achieved through modifications to the css file.  I did some research and found that I would need to generate a geojson file in order to visualize the customized data on top of the initial template.

Datawrangling (most difficult part):
I started off by finding country visualization data on the internet that has polygon objects in a latitude/longitude coordinate system.  I then used a python script to load this data in and match up the countries with the parsed data from the Mozilla survey dataset.  I then generated a geojson file using a pandas dataframe and the geopandas package.  Finally, I exported this data and loaded it into the Cesium object through the html file.
  
