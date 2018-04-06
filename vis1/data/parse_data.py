#!/usr/bin/env python3

import json
import geojson
import operator
import geopandas as gpd
import fiona
import types
import requests
import pandas as pd
import numpy as np
from collections import defaultdict

class MozillaSurveyData():
    """
    Class that contains the functions needed to read in a csv file and filter it to provide data for a visualization
    """
    def __init__(self, filename='../data/mozilla-filt-coded.csv', filename2='countries_old.geojson'):
        self.moz_data = None
        self.country_data = None
        self.header = []
        self.filename = filename
        self.filename2 = filename2

    """
    Function that opens up the csv file and reads in the data into a large dict
    """
    def read_data(self):
        self.moz_data = pd.read_csv(self.filename, encoding="ISO-8859-1")
        self.country_data = gpd.read_file(self.filename2)

    """
    Function that formats the data by adding new data to the original geojson file
    that contains all of the coordinate mappings for the polygons of countries in
    the world
    """
    def format_data(self):
        self.d_counts = {'survey_num':defaultdict(int), 'connected':{}, 'nerd':{}}
        # Read in country survey counts
        for i, country in enumerate(self.moz_data['Country or Region (optional)']):
            self.d_counts['survey_num'][country] += 1
        for country in self.d_counts['survey_num'].keys():
            self.d_counts['connected'][country] = defaultdict(int)
            self.d_counts['nerd'][country] = defaultdict(int)
        for country, choice in zip(self.moz_data['Country or Region (optional)'], self.moz_data['Thinking about a future in which so much of your world is connected to the internet leaves you feeling:']):
            try:
                self.d_counts['connected'][country][int(choice)] += 1
            except:
                pass
        for country, choice in zip(self.moz_data['Country or Region (optional)'], self.moz_data['I consider myself:']):
            try:
                self.d_counts['nerd'][country][int(choice)] += 1
            except:
                pass

        # Find maxes of the dicts to color correctly
        for country in self.d_counts['connected'].keys():
            self.d_counts['connected'][country]['max'] = max(self.d_counts['connected'][country].items(), key=operator.itemgetter(1))[0]
        colors = {0:'orange', 1:'blue', 2:'green', 3:'purple', 4:'red', 5:'pink'}

        # Define new vars to be added to the geojson file
        self.country_data['stroke'] = ""
        self.country_data['fill'] = ""
        self.country_data['description'] = ""
        # Populate the data in the json pandas dataframe
        for i, country in enumerate(self.country_data['name']):
            if country in self.d_counts['connected'].keys():
                self.country_data['stroke'][i] = colors[self.d_counts['connected'][country]['max']]
                self.country_data['fill'][i] = colors[self.d_counts['connected'][country]['max']]
                self.country_data['description'][i] = self.gen_desc(country)
            elif country == "United States of America":
                self.country_data['stroke'][i] = colors[self.d_counts['connected']['United States']['max']]
                self.country_data['fill'][i] = colors[self.d_counts['connected']['United States']['max']]
                self.country_data['description'][i] = self.gen_desc('United States')
            else:
                self.country_data['stroke'][i] = colors[5]
                self.country_data['fill'][i] = colors[5]
                self.country_data['description'][i] = 'Number of Survey Submitted: undefined'

        # Change the altitude of the coordinates

    """
    Helper function to generate a description
    """
    def gen_desc(self, country):
        description = 'Number of Survey Submitted: ' + str(sum(self.d_counts['connected'][country].values())-self.d_counts['connected'][country]['max'])
        return description

    """
    Function to dump a pandas df to geojson
    """
    def dump(self, outfile='countries.geojson'):
        with open(outfile, 'w') as fp:
            geojson.dump(self.country_data, fp)

if __name__ == '__main__':
    vis = MozillaSurveyData()
    vis.read_data()
    vis.format_data()
    vis.dump()
