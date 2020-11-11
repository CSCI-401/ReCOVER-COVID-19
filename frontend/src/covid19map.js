import React, { Component, Fragment } from "react";
import { Map, TileLayer, CircleMarker, Tooltip, LayersControl,LayerGroup } from "react-leaflet";
import ModelAPI from "./modelapi";
import "leaflet/dist/leaflet.css";

import globalLL from "./frontendData/global_lats_longs.txt"
import population from './frontendData/global_population_data.txt'


import Papa from "papaparse";


var global_lat_long;
var populationVect;

function parse_lat_long_global(data) {
    global_lat_long = data;
}
function parse_population(data) {
    populationVect = data;
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

function perMillionMath(numCases) {
  numCases /= 1000000;
  return numCases;
}

function casesPerPersonCalculation(populationNum, numCases) {
  numCases = populationNum/numCases;
  return Math.round(numCases);
}

parseData(globalLL, parse_lat_long_global);
parseData(population, parse_population);




const Covid19Marker = ({ caseKey, deathKey, data, center, caseRadius, deathRadius, caseValue, deathValue, popNum, color, caseOpacity, deathOpacity, stroke, onClick }) => (
  <CircleMarker
    key={deathKey}
    data={data}
    center={center}
    radius={deathRadius}
    color="black"
    fillOpacity={deathOpacity}
    stroke={false}
    onClick={onClick}
  >
    <CircleMarker
      key={caseKey}
      data={data}
      center={center}
      radius={caseRadius}
      color={color}
      fillOpacity={caseOpacity}
      stroke={false}
      onClick={onClick}
    >
    // const numCases = perMillionMath(caseValue);
    //
    // var numCases = ;
    // console.log(numCases);
      <Tooltip direction="right" opacity={1} sticky={true}>

        <span>{data}</span><br></br>
        <span>{"Cases: " + caseValue}</span><br></br>
        <span>{"1 case : " + casesPerPersonCalculation(popNum, caseValue) + " people"}</span><br></br>
        <span>{"Deaths: " + deathValue}</span>
      </Tooltip>
    </CircleMarker>
    <Tooltip direction="right" opacity={1} sticky={true}>
      <span>{data}</span><br></br>
      <span>{"Cases: " + caseValue}</span><br></br>
      <span>{"Deaths: " + deathValue}</span><br></br>
      <span>{"1 death : " + casesPerPersonCalculation(popNum, deathValue) + " people"}</span>

    </Tooltip>
  </CircleMarker>
);



const Covid19MarkerList = ({ markers }) => {
  const items = markers.map(({ ...props }) => (
    <Covid19Marker {...props} />
  ));
  return <Fragment>{items}</Fragment>;
}

class Covid19Map extends Component {

  constructor() {
    super();
    this.modelAPI = new ModelAPI();

    this.state = {
      areasList : [],
      showState: false,
      worldCases: [],
      worldDeaths: [],
      markers: [],
      stateMarkers: [],
      us:[]
    };

    this.modelAPI.areas(allAreas =>
      this.setState({
        areasList: allAreas
      })
    );
  }



  componentDidMount() {
    this.props.triggerRef(this);
    this.fetchData(this.props.dynamicMapOn);
  }



  fetchData(dynamicMapOn) {
    if (!dynamicMapOn || (this.props.confirmed_model === "" && this.props.death_model === "")) {
      // without dynamic map, show cumulative cases to date
      this.modelAPI.cumulative_infections(cumulativeInfections => {
        let caseData = cumulativeInfections.map(d => {
          return {
            id: d.area.iso_2,
            name: d.area.country,
            state: d.area.state,
            area: d.area,
            value: Math.log(d.max_percentage),
            valueTrue: d.value
          };
        });
        this.setState({ caseData }, this.initCases);
      });
      this.modelAPI.cumulative_death({
        days: 0
      }, cumulativeDeath => {
        let deathData = cumulativeDeath.map(d => {
          return {
            id: d.area.iso_2,
            name: d.area.country,
            state: d.area.state,
            area: d.area,
            value: Math.log(d.max_percentage),
            valueTrue: d.value
          };
        });
        this.setState({ deathData }, this.initDeaths);
      });
    } else {
      // with dynamic map
      if (this.props.statistic === "cumulative") {
        if (this.props.days > 0) {
          this.modelAPI.predict_all({
            days: this.props.days,
            model: this.props.confirmed_model
          }, cumulativeInfections => {
            let caseData = cumulativeInfections.map(d => {
              return {
                id: d.area.iso_2,
                name: d.area.country,
                state: d.area.state,
                area: d.area,
                value: Math.log(d.max_val_percentage),
                valueTrue: d.value
              };
            });
            this.setState({ caseData }, this.setCases);
          });
          this.modelAPI.predict_all({
            days: this.props.days,
            model: this.props.death_model
          }, cumulativeInfections => {
            let deathData = cumulativeInfections.map(d => {
              return {
                id: d.area.iso_2,
                name: d.area.country,
                state: d.area.state,
                area: d.area,
                value: Math.log(d.max_death_percentage),
                valueTrue: d.value
              };
            });
            this.setState({ deathData }, this.setDeaths);
          });
        } else {
          // show history cumulative
          this.modelAPI.history_cumulative({
            days: this.props.days
          }, historyCumulative => {
            let caseData = historyCumulative.map(d => {
              return {
                id: d.area.iso_2,
                name: d.area.country,
                state: d.area.state,
                area: d.area,
                value: Math.log(d.max_val_percentage),
                valueTrue: d.value
              };
            });
            this.setState({ caseData }, this.setCases);
          });
          this.modelAPI.history_cumulative({
            days: this.props.days,
          }, historyCumulative => {
            let deathData = historyCumulative.map(d => {
              return {
                id: d.area.iso_2,
                name: d.area.country,
                state: d.area.state,
                area: d.area,
                value: Math.log(d.max_death_percentage),
                valueTrue: d.deathValue
              };
            });
            this.setState({ deathData }, this.setDeaths);
          });
        }
      } else {
        // new cases
      }
    }
  }



  initCases() {
    //this.setState({ worldCases: this.state.caseData });
    if (this.state.markers.length > 0) {
      this.setCases();
    } else {
      for (var i = 0; i < global_lat_long.length; i++) {
        let area = this.state.caseData[i];

        if (typeof(area.deathRadius) === "undefined") {
          area.deathRadius = 0;
        }
        if (typeof(area.deathValue) === "undefined") {
          area.deathValue = 0;
        }
        if (typeof(area.deathOpacity) === "undefined") {
          area.deathOpacity = 0;
        }
        let opacity = 0.5;
        if (area.valueTrue === 0) {
          opacity = 0;
        }
        if (i <183) {
            var compare = this.state.areasList[i].country+" ";
             if ("US " === compare){
                  this.state.us.push({
                  key: area.name,
                  caseKey: area.name + "-cases",
                  deathKey: area.name + "-deaths",
                  data: area.name,
                  center: [global_lat_long[i][1], global_lat_long[i][2]],
                  caseRadius: 5 * this.getRadius(area.valueTrue),
                  deathRadius: area.deathRadius,
                  caseValue: area.valueTrue,
                  deathValue: area.deathValue,
                  population: populationVect[i],
                  color: this.getColor(area.valueTrue),
                  caseOpacity: opacity,
                  deathOpacity: area.deathOpacity,
                  stroke: false,
                  onClick: (e) => this.handleMapClick(e)
                });
            } else {
                this.state.markers.push({
                  key: area.name,
                  caseKey: area.name + "-cases",
                  deathKey: area.name + "-deaths",
                  data: area.name,
                  center: [global_lat_long[i][1], global_lat_long[i][2]],
                  caseRadius: 5 * this.getRadius(area.valueTrue),
                  deathRadius: area.deathRadius,
                  caseValue: area.valueTrue,
                  deathValue: area.deathValue,
                  population: populationVect[i],
                  color: this.getColor(area.valueTrue),
                  caseOpacity: opacity,
                  deathOpacity: area.deathOpacity,
                  stroke: false,
                  onClick: (e) => this.handleMapClick(e)
                });
            }

        } else {
            this.state.stateMarkers.push({

                  key: area.name,
                  caseKey: area.state + "-cases",
                  deathKey: area.state + "-deaths",
                  data: area.name + " / " + area.state,
                  center: [global_lat_long[i][1], global_lat_long[i][2]],
                  caseRadius: 5 * this.getRadius(area.valueTrue),
                  deathRadius: area.deathRadius,
                  caseValue: area.valueTrue,
                  population: " ",
                  deathValue: area.deathValue,
                  color: this.getColor(area.valueTrue),
                  display: "none",
                  caseOpacity: opacity,
                  deathOpacity: area.deathOpacity,
                  stroke: false,
                  onClick: (e) => this.handleMapClick(e)
                });

        }

      }

    }
  }

  initDeaths() {
    //this.setState({ worldDeaths: this.state.deathData });
    if (this.state.markers.length > 0) {
      this.setDeaths();
    } else {
      for (var i = 0; i < global_lat_long.length; i++) {
        let area = this.state.deathData[i];
        if (typeof(area.caseRadius) === "undefined") {
          area.caseRadius = 0;
        }
        if (typeof(area.caseValue) === "undefined") {
          area.caseValue = 0;
        }
        if (typeof(area.caseOpacity) === "undefined") {
          area.caseOpacity = 0;
        }
        let opacity = 1;
        if (area.valueTrue === 0) {
          opacity = 0;
        }

        if (i<183) {
            var compare = this.state.areasList[i].country+" ";
            if ("US " === compare){
                 this.state.us.push({
                  key: area.name,
                  caseKey: area.name + "-cases",
                  deathKey: area.name + "-deaths",
                  data: area.name,
                  center: [global_lat_long[i][1], global_lat_long[i][2]],
                  caseRadius: area.caseRadius,
                  deathRadius: this.getRadius(area.valueTrue),
                  caseValue: area.caseValue,
                  deathValue: area.valueTrue,
                  popNum: populationVect[i],
                  color: "black",
                  caseOpacity: area.caseOpacity,
                  deathOpacity: opacity,
                  stroke: false,
                  onClick: (e) => this.handleMapClick(e)
                });
            } else {
                 this.state.markers.push({
                  key: area.name,
                  caseKey: area.name + "-cases",
                  deathKey: area.name + "-deaths",
                  data: area.name,
                  center: [global_lat_long[i][1], global_lat_long[i][2]],
                  caseRadius: area.caseRadius,
                  deathRadius: this.getRadius(area.valueTrue),
                  caseValue: area.caseValue,
                  deathValue: area.valueTrue,
                  popNum: populationVect[i],
                  color: "black",
                  caseOpacity: area.caseOpacity,
                  deathOpacity: opacity,
                  stroke: false,
                  onClick: (e) => this.handleMapClick(e)
                });
            }

        } else {
            this.state.stateMarkers.push({
              key: area.name,
              caseKey: area.state + "-cases",
              deathKey: area.state + "-deaths",
              data: area.name + " / " + area.state,
              center: [global_lat_long[i][1], global_lat_long[i][2]],
              caseRadius: area.caseRadius,
              deathRadius: this.getRadius(area.valueTrue),
              caseValue: area.caseValue,
              deathValue: area.valueTrue,
              popNum: " ",
              color: "black",
              display: "none",
              caseOpacity: area.caseOpacity,
              deathOpacity: opacity,
              stroke: false,
              onClick: (e) => this.handleMapClick(e)
            });
        }

      }


      // this.setState({ markers: this.state.markers });
    }
  }

  setCases() {
    //this.setState({ worldCases: this.state.caseData });
    for (var i = 0; i < this.state.markers.length; i++) {

      let caseValue = this.state.caseData[i].valueTrue;
      let opacity = 0.5;
      if (caseValue === 0) {
        opacity = 0;
      }
      this.state.markers[i].caseRadius = 5 * this.getRadius(caseValue);
      this.state.markers[i].caseValue = caseValue;
      this.state.markers[i].color = this.getColor(caseValue);
      this.state.markers[i].caseOpacity = opacity;
    }

     for (var i = 0; i < this.state.stateMarkers.length; i++) {

      let caseValue = this.state.caseData[i].valueTrue;
      let opacity = 0.5;
      if (caseValue === 0) {
        opacity = 0;
      }
      this.state.stateMarkers[i].caseRadius = 5 * this.getRadius(caseValue);
      this.state.stateMarkers[i].caseValue = caseValue;
      this.state.stateMarkers[i].color = this.getColor(caseValue);
      this.state.stateMarkers[i].caseOpacity = opacity;
    }

    for (var i = 0; i < this.state.us.length; i++) {

      let caseValue = this.state.caseData[i].valueTrue;
      let opacity = 0.5;
      if (caseValue === 0) {
        opacity = 0;
      }
      this.state.us[i].caseRadius = 5 * this.getRadius(caseValue);
      this.state.us[i].caseValue = caseValue;
      this.state.us[i].color = this.getColor(caseValue);
      this.state.us[i].caseOpacity = opacity;
    }
    //this.setState({ markers: this.state.markers });
  }

  setDeaths() {
    //this.setState({ worldDeaths: this.state.deathData });
    for (var i = 0; i < this.state.markers.length; i++) {
      let deathValue = this.state.deathData[i].valueTrue;
      let opacity = 1;
      if (deathValue === 0) {
        opacity = 0;
      }
      this.state.markers[i].deathRadius = this.getRadius(deathValue);
      this.state.markers[i].deathValue = deathValue;
      this.state.markers[i].deathOpacity = opacity;
    }
     for (var i = 0; i < this.state.stateMarkers.length; i++) {
      let deathValue = this.state.deathData[i].valueTrue;
      let opacity = 1;
      if (deathValue === 0) {
        opacity = 0;
      }
      this.state.stateMarkers[i].deathRadius = this.getRadius(deathValue);
      this.state.stateMarkers[i].deathValue = deathValue;
      this.state.stateMarkers[i].deathOpacity = opacity;
    }

    for (var i = 0; i < this.state.us.length; i++) {
      let deathValue = this.state.deathData[i].valueTrue;
      let opacity = 1;
      if (deathValue === 0) {
        opacity = 0;
      }
      this.state.us[i].deathRadius = this.getRadius(deathValue);
      this.state.us[i].deathValue = deathValue;
      this.state.us[i].deathOpacity = opacity;
    }

    //this.setState({ markers: this.setState.markers });
  }

  handleMapClick(e) {


    const { onMapClick, onNoData } = this.props;
    console.log(e.target);

    var area = e.target.options.data;
    if (area) {
      console.log("Clicked on " + area);
      onMapClick(area);
    } else {
      onNoData(area);
    }

  }



  getRadius(value) {
    if (value === 0)
      return value;
  	var radius = Math.log(value / 100);

  	if (radius < .5)
  		radius = .5;

  	return radius;
  }

  getColor(d) {
    d /= 10000;
   	return d > 100 ? '#800026' :
           d > 50  ? '#BD0026' :
           d > 20  ? '#E31A1C' :
           d > 10  ? '#FC4E2A' :
           d > 5   ? '#FD8D3C' :
           d > 2   ? '#FEB24C' :
           d > 1   ? '#FED976' :
                      '#FFEDA0';
  }

  renderFirst() {
    return <Covid19MarkerList markers={this.state.us} />;
  }

  renderSecond() {
   return <Covid19MarkerList markers={this.state.stateMarkers} />;
  }

  render() {


    return (
      <div>
        <Map
          style={{ height: "880px", width: "100%" }}
          zoom={4}
          minZoom={3}
          center={[37.8, -96]}
          ref={(ref) => { this.map = ref; }}
          maxBounds={[
            [90, -Infinity],
            [-90, Infinity]
          ]}
          worldCopyJump={true}
        >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <Covid19MarkerList markers={this.state.markers} />

        <LayersControl position='topright'>
           <LayersControl.BaseLayer checked name="Show US general">
                <LayerGroup>
                  {this.renderFirst()}
                </LayerGroup>
           </LayersControl.BaseLayer>
              <LayersControl.BaseLayer checked name="Show US state">
                 <LayerGroup>
                  {this.renderSecond()}
                </LayerGroup>
              </LayersControl.BaseLayer>
        </LayersControl>
        </Map>
      </div>
    )
  }


}

export default Covid19Map;
