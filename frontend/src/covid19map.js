import React, { Component } from "react";
import { Circle, Map, Marker, Popup, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import ModelAPI from "./modelapi";
import { areaToStr, strToArea } from "./covid19util";
import "leaflet/dist/leaflet.css";
import data from "./countries";


import globalLL from './frontendData/global_lats_longs.txt'
import global_data from './frontendData/global_data.csv'
import usLL from './frontendData/us_lats_longs.txt'
import us_data from './frontendData/us_data.csv'
import usDeath from './frontendData/us_deaths.csv'
import globalDeath from './frontendData/global_deaths.csv'


import Papa from 'papaparse';

import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4geodata_usaLow from "@amcharts/amcharts4-geodata/usaLow";
import am4geodata_chinaLow from "@amcharts/amcharts4-geodata/chinaLow";
import am4geodata_canadaLow from "@amcharts/amcharts4-geodata/canadaLow";
import am4geodata_australiaLow from "@amcharts/amcharts4-geodata/australiaLow";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";




// const HEAT_MAP_MIN_COLOR = "#fcbba0";
// const HEAT_MAP_MAX_COLOR = "#66000d";
const HEAT_MAP_MIN_COLOR = "#ffffff";
const HEAT_MAP_MAX_COLOR = "#000000";
const MAP_HOVER_COLOR = "#e43027";

// am4core.useTheme(am4themes_animated);


var global_lat_long;
var us_lat_long;

// variable to use
var combined_global_data;
var combined_us_data;
var us_death;
var global_death;

function parse_lat_long_global(data) {
    global_lat_long = data;
}

function readUsDeath(data) {
    us_death = data;
}
function readGlobalDeath(data) {
    global_death = data;
}

function combineGlobal(data) {
    combined_global_data = data;
    for (var i = 0; i < global_lat_long.length; i++) {
        combined_global_data[i+1].push(global_lat_long[i][1]);
        combined_global_data[i+1].push(global_lat_long[i][2]);
    }
    console.log(combined_global_data);
}

function parse_lat_long_us(data) {
    us_lat_long = data;

}

function combineUs(data) {
    combined_us_data = data;
    for (var i = 0; i < us_lat_long.length; i++) {
        combined_us_data[i+1].push(us_lat_long[i][1]);
        combined_us_data[i+1].push(us_lat_long[i][2]);
    }
    console.log(combined_us_data);
}



function parseData(url, callBack) {
    Papa.parse(url, {
        download: true,
        dynamicTyping: true,
        complete: function(results) {
            callBack(results.data);
        }
    });
}

  parseData(globalLL, parse_lat_long_global);
  parseData(global_data, combineGlobal);
  parseData(usLL, parse_lat_long_us);
  parseData(us_data, combineUs);
  parseData(usDeath, readUsDeath);
  parseData(globalDeath, readGlobalDeath);


class Covid19Map extends Component {





  getColor(d) {
   	return d > 100 ? '#800026' :
           d > 50  ? '#BD0026' :
           d > 20  ? '#E31A1C' :
           d > 10  ? '#FC4E2A' :
           d > 5   ? '#FD8D3C' :
           d > 2   ? '#FEB24C' :
           d > 1   ? '#FED976' :
                      '#FFEDA0';
  }



  render() {

    var centerLat = (data.minLat + data.maxLat) / 2;
    var distanceLat = data.maxLat - data.minLat;
    var bufferLat = distanceLat * 0.05;
    var centerLong = (data.minLong + data.maxLong) / 2;
    var distanceLong = data.maxLong - data.minLong;
    var bufferLong = distanceLong * 0.05;

    return (

    	<div>
    		<Map
    			style={{ height: "800px", width: "100%" }}
    			zoom={1}
    			center={[centerLat, centerLong]}
    			bounds={[
    				[data.minLat - bufferLat, data.minLong - bufferLong],
    				[data.maxLat + bufferLat, data.maxLong - bufferLong]
    			]}
    		>
    			<TileLayer url="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

    			{data.country.map((country, k) => {
    				return (
    					<CircleMarker
    						key={k}
    						center={[country["coordinates"][0], country["coordinates"][1]]}
    						radius={10 * Math.log(country["population"] / 1000000)}
    						color={this.getColor(country["population"] / 1000000)}
    						fillOpacity={0.5}
    						stroke={false}
    						onMapClick={this.handleMapClick}
    					>
    						<CircleMarker
    							key={k}
    							center={[country["coordinates"][0], country["coordinates"][1]]}
    							radius={2 * Math.log(country["population"] / 1000000)}
    							color="black"
    							fillOpacity={1}
    							stroke={false}
    						></CircleMarker>
    						<Tooltip direction="right" offset={[-8, -2]} opacity={1}>
    							<span>{country["name"] + ": Population " + country["population"]}</span>
    						</Tooltip>
    					</CircleMarker>
    					)
    			})
    			}
    		</Map>
    	</div>
    );
  }
}

export default Covid19Map;
