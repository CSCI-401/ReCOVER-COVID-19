import React, { Component } from "react";
import Covid19Predict from "./covid19predict";
import AboutUS from "./aboutus";
import {BrowserRouter as Router, Route, Redirect, Switch} from 'react-router-dom'; 
import Navbar from "./navbar/navbar";
import 'semantic-ui-css/semantic.min.css';
import "./covid19app.css";

class Covid19App extends Component {
  constructor(props){
    super(props);
    this.state = {
      redirectForecast: false,
      redirectAbout: false
    }
  }

  redirectForecast = ()=>{
    this.setState({
      redirectForecast:true,
      redirectAbout: false
    });
  }

  redirectAbout = ()=>{
    this.setState({
      redirectForecast: false,
      redirectAbout:true
    });
  }

  redirectReset = ()=>{
    this.setState({
      redirectForecast: false,
      redirectAbout: false
    })
  }

  render() {
    const {redirectForecast, redirectAbout} = this.state;
    return (
      <Router>
        {redirectForecast?<Redirect to="/ReCOVER-COVID-19"/>:null}
        {redirectAbout?<Redirect to="/ReCOVER-COVID-19/about"/>:null}
        <Navbar redirectForecast = {this.redirectForecast}
                redirectAbout = {this.redirectAbout}
                redirectReset = {this.redirectReset}
        />
        <Switch>
          <Route exact path='/ReCOVER-COVID-19' 
            render={(props) => <Covid19Predict {...props} />}/>
          <Route exact path='/ReCOVER-COVID-19/about'
            render={(props) => <AboutUS {...props} />} />
          {/* need a page for instruction */}
        </Switch>
      </Router>
    );
  }
}

export default Covid19App;
