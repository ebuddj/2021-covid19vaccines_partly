#!/usr/bin/python
# -*- coding: UTF8 -*-
# @See http://www.python.org/dev/peps/pep-0263/

#######
# ABOUT
#######

# Covid-19 vaccination data from OWID

########
# AUTHOR
########

# Teemo Tebest (teemo.tebest@gmail.com)

#########
# LICENSE
#########

# CC-BY-SA 4.0 EBU / Teemo Tebest

#######
# USAGE
#######

# python 2021-covid19vaccines_partly.py

# Load the Pandas libraries with alias pd.
import pandas as pd

# Import request for adding headers to our request.
from urllib.request import Request, urlopen

# Read the file and filter columns.
# https://stackoverflow.com/questions/62278538/pd-read-csv-produces-httperror-http-error-403-forbidden/62278737#62278737
url ='https://covid.ourworldindata.org/data/owid-covid-data.csv'
req = Request(url)
req.add_header('User-Agent', 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:77.0) Gecko/20100101 Firefox/77.0')
content = urlopen(req)
df = pd.read_csv(content, usecols=['continent','location','date','people_fully_vaccinated_per_hundred'])

# Filter data by row values.
df = df[df['continent'] == 'Europe']

# Convert NaN to None
# https://stackoverflow.com/questions/28639953/python-json-encoder-convert-nans-to-null-instead/34467382#34467382
df = df.where(pd.notnull(df), 0)

# Loop throught the all European countries and create data.
data = {}
df = df[df['date'] > '2020-12-10']
# https://chrisalbon.com/python/data_wrangling/pandas_list_unique_values_in_column/
for country in df.location.unique():
  country_data_name = country
  # Change Vatican to Holy See because that corresponds with the map data.
  if country == 'Vatican':
    country_data_name = 'Holy See';
  # Skip administrative areas as they are not countries.
  if country == 'Isle of Man' or country == 'Faeroe Islands' or country == 'Guernsey' or country == 'Jersey' or country == 'Gibraltar':
    continue
  previous_value = 0
  data[country_data_name] = {'Province_State':country_data_name}
  for index, values in (df[df['location'] == country]).iterrows():
    # If the value is not zero, fill the data.
    if values.people_fully_vaccinated_per_hundred != 0:
      previous_value = values.people_fully_vaccinated_per_hundred
      # Data format to be like following
      # data[Finland][2020-12-31] = 3.1
      # data[Finland][2021-01-01] = 3.1
      # data[Finland][2021-01-02] = 3.3
      data[country_data_name][values.date] = values.people_fully_vaccinated_per_hundred
    # If the value is zero, fill the data with the previous value.
    else:
      data[country_data_name][values.date] = previous_value

# Export data.
import json
data = {'vaccinated':data}
with open('../media/data/data.json', 'w') as outfile:
  json.dump(data, outfile)



# List of ERNO countries
erno_countries = ['Albania','Bosnia and Herzegovina','Bulgaria','Croatia','Hungary','Kosovo','Montenegro','North Macedonia','Romania','Serbia','Slovenia']

# Loop throught the ERNO countries and create data.
data = {}
df = df[df['date'] > '2020-12-24']
for erno_country in erno_countries:
  previous_value = 0
  data[erno_country] = {'Province_State':erno_country}
  for index, values in (df[df['location'] == erno_country]).iterrows():
    if values.people_fully_vaccinated_per_hundred != 0:
      previous_value = values.people_fully_vaccinated_per_hundred
      data[erno_country][values.date] = values.people_fully_vaccinated_per_hundred
    else:
      data[erno_country][values.date] = previous_value

# Export data.
import json
data = {'vaccinated':data}
with open('../media/data/data_erno.json', 'w') as outfile:
  json.dump(data, outfile)

print ('All done!\n')