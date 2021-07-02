import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://underscorejs.org/
import _ from 'underscore';

// https://github.com/topojson/topojson
import * as topojson from 'topojson-client';

// https://www.npmjs.com/package/rc-slider
import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';
import './../styles/rc-slider-override.css';

// https://d3js.org/
import * as d3 from 'd3';

import constants from './Constants.jsx';

let interval, g, path;

function getHashValue(key) {
  let matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  return matches ? matches[1] : null;
}

const l = getHashValue('l') ? getHashValue('l') : 'en';
const area = getHashValue('area') ? getHashValue('area') : '';
const type = 'vaccinated';

const projection = (area === 'erno') ? d3.geoAzimuthalEquidistant().center([25,46]).scale(3000) : d3.geoAzimuthalEquidistant().center([33,57]).scale(800);
const data_file_name = (area === 'erno') ? 'data_erno.json' : 'data.json';
const multiplier = (area === 'erno') ? 6 : 2;

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data:{},
      dates:[],
      total:0,
      year_month_idx:0
    }
  }
  componentDidMount() {
    d3.json('./data/' + data_file_name).then((data) => {
      this.setState((state, props) => ({
        data:data[type],
        dates:_.keys(data[type]['Albania']).filter((value, index, arr) => {
          return !(value === 'Province_State');
        })
      }), this.drawMap);
    })
    .catch(function (error) {
    })
    .then(function () {
    });
  }
  drawMap() {
    let width = 720;
    let height = 720;
    
    let svg = d3.select('.' + style.map_container).append('svg').attr('width', width).attr('height', height);
    path = d3.geoPath().projection(projection);
    g = svg.append('g');

    let tooltip = d3.select('.' + style.map_container)
      .append('div')
      .attr('class', style.hidden + ' ' + style.tooltip);
    d3.json('./data/europe.topojson').then((topology) => {
      g.selectAll('path').data(topojson.feature(topology, topology.objects.europe).features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', style.path)
        .style('stroke', (d, i) => {
          return '#999';
        })
        .attr('fill', (d, i) => {
          return this.getAreaColor(d.properties.NAME);
        });

      g.append('path').datum({type:'Polygon',properties:{'NAME':'Kosovo'},coordinates:constants.kosovo})
        .attr('d', path)
        .attr('fill', '#f5f5f5')
        .attr('class', style.kosovo)
        
      let data = Object.keys(this.state.data).map(i => this.state.data[i]);

      g.selectAll('circle').data(data)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => {
          return projection([constants.areaInfo[d.Province_State].Long, constants.areaInfo[d.Province_State].Lat])[0];
        })
        .attr('cy', (d, i) => {
          return projection([constants.areaInfo[d.Province_State].Long, constants.areaInfo[d.Province_State].Lat])[1];
        })
        .attr('r', (d, i) => {
          return 0;
        })
        .attr('class', style.circle)
        .style('fill', 'rgba(255, 82, 51, 0.75)');

      g.selectAll('text').data(data)
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('class', style.number)
        .attr('x', (d, i) => {
          return projection([constants.areaInfo[d.Province_State].Long, constants.areaInfo[d.Province_State].Lat])[0] + 0.3;
        })
        .attr('y', (d, i) => {
          return projection([constants.areaInfo[d.Province_State].Long, constants.areaInfo[d.Province_State].Lat])[1] + 1;
        })
        .html('')
      this.text = svg.append('text')
        .attr('alignment-baseline', 'top')
        .attr('class', style.text)
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('y', '7%');
        let date = this.state.dates[this.state.year_month_idx].split('-');
        this.text.html('' + date[2] + '.' + date[1] + '.' + date[0]);
    });
    setTimeout(() => {
      this.createInterval();
    }, 1000);
  }
  changeAreaAttributes() {
    // Change fill color.
    g.selectAll('path')
      .attr('fill', (d, i) => {
        return this.getAreaColor(d.properties.NAME);
      });
    g.selectAll('circle')
      .attr('r', (d, i) => {
        this.setState((state, props) => ({
          total:d[this.state.dates[this.state.year_month_idx]]
        }));
        return Math.sqrt(d[this.state.dates[this.state.year_month_idx]]) * multiplier;
      });
    g.selectAll('text')
      .style('font-size', (d, i) => {
        return (Math.sqrt(d[this.state.dates[this.state.year_month_idx]]) * (multiplier)) + 'px';
      })
      .html((d, i) => {
        if (this.state.year_month_idx >= (this.state.dates.length - 1)) {
          return parseInt(d[this.state.dates[this.state.year_month_idx]]);
        }
        else if (d[this.state.dates[this.state.year_month_idx]] > 0) {
          return constants.areaInfo[d.Province_State].abbr;
        }
        else {
          return '';
        }
      });
  }
  getAreaColor(area) {
    if (this.state.data[area] !== undefined) {
      if (this.state.data[area][this.state.dates[this.state.year_month_idx]] > 0) {
        return '#d5d5d5';
      }
      else {
        return '#f5f5f5';
      }
    }
    else {
      return '#ffffff'
    }
  }
  onBeforeSliderChange(value) {
    if (interval) {
      clearInterval(interval)
    }
  }
  onSliderChange(value) {
    this.setState((state, props) => ({
      total:0,
      year_month_idx:value
    }), this.changeAreaAttributes);
  }
  onAfterSliderChange(value) {
  }
  componentWillUnMount() {
    clearInterval(interval);
  }
  createInterval() {
    this.changeAreaAttributes();
    interval = setInterval(() => {
      this.setState((state, props) => ({
        total:0,
        year_month_idx:this.state.year_month_idx + 1
      }), this.changeAreaAttributes);
      if (this.state.year_month_idx >= (this.state.dates.length - 1)) {
        clearInterval(interval);
        g.selectAll('text')
          .html((d, i) => {
            return parseInt(d[this.state.dates[this.state.year_month_idx]]);
          });
        setTimeout(() => {
          this.setState((state, props) => ({
            total_cases:0,
            year_month_idx:0
          }), this.createInterval);
        }, 4000);
      }
    }, 500);
  }
  render() {
    if (this.text) {
      if (this.state.dates[this.state.year_month_idx]) {
        let date = this.state.dates[this.state.year_month_idx].split('-');
        this.text.html('' + date[2] + '.' + date[1] + '.' + date[0]);
      }
    }
    return (
      <div className={style.plus}>
        <div>
          <h3>First dose, total population</h3>
          <Slider
            className={style.slider_container}
            dots={false}
            max={this.state.dates.length - 1}
            onAfterChange={this.onAfterSliderChange.bind(this)}
            onBeforeChange={this.onBeforeSliderChange}
            onChange={this.onSliderChange.bind(this)}
            value={this.state.year_month_idx}
          />
          <div className={style.map_container}></div>
        </div>
      </div>
    );
  }
}
export default App;