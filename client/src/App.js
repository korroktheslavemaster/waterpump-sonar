import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import Gauge from "./Gauge";
import moment from "moment";
import { ScaleLoader } from "react-spinners";

const baseStyles = {
  padding: "0.5rem",
  textAlign: "center"
};
// hardcoding raspi url here
// raspi WAN:
// const RASPI_URL = "http://172.18.224.182";
// serveo:
// const RASPI_URL = "http://waterpumpserverarpit.serveo.net";
// localtunnel:
const RASPI_URL = "http://waterpumpserver.localtunnel.me";

class OtherStuff extends Component {
  state = {
    motor: "...",
    loading: false
  };

  componentDidMount() {
    fetch(`${RASPI_URL}/motor`)
      .then(res => res.json())
      .then(({ motor }) => this.setState({ motor: motor ? "ON" : "OFF" }));
  }

  onMotorClicked = () => {
    this.setState({ loading: true });
    fetch(`${RASPI_URL}/motor/switch`)
      .then(res => res.json())
      .then(({ motor }) =>
        this.setState({ motor: motor ? "ON" : "OFF", loading: false })
      );
  };

  render() {
    const { motor, loading } = this.state;
    return (
      <div className="container">
        <div className="row">
          <div className="sixteen columns" style={baseStyles}>
            <h2>Motor is {motor}</h2>
          </div>
        </div>
        <div className="row">
          <div className="sixteen columns" style={baseStyles}>
            <button
              disabled={(motor == "..." ? true : false) || loading}
              onClick={this.onMotorClicked}
            >
              Turn {motor == "ON" ? "OFF" : "ON"}
            </button>
          </div>
        </div>
        <div className="row">
          <div className="sixteen columns" style={baseStyles}>
            {loading ? <ScaleLoader color="#5b5b5b" /> : ""}
          </div>
        </div>
      </div>
    );
  }
}

class App extends Component {
  state = {
    latestPoint: null
  };
  componentDidMount() {
    fetch(`/api/point/latest`)
      .then(res => res.json())
      .then(latestPoint => this.setState({ latestPoint }));
  }
  render() {
    const { latestPoint } = this.state;
    return (
      <div className="container" style={{ paddingTop: "1.5rem" }}>
        <div className="row">
          <h1 style={baseStyles} className="sixteen columns">
            Tank Level
          </h1>
        </div>
        <div className="row">
          {latestPoint ? <Gauge point={latestPoint} /> : "-"}
        </div>
        <div className="row">
          <small className="sixteen columns" style={baseStyles}>
            <i>{latestPoint ? moment(latestPoint.timestamp).fromNow() : "-"}</i>
          </small>
        </div>
        {/*  seperated this because gauge was bugging out if other fetch was included here...*/}
        <OtherStuff />
      </div>
    );
  }
}

export default App;
