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
// const RASPI_URL = "http://172.18.224.182";
const RASPI_URL = "http://waterpumpserverarpit.serveo.net";

class App extends Component {
  state = {
    latestPoint: null,
    motor: "-",
    loading: false
  };
  componentDidMount() {
    fetch(`/api/point/latest`)
      .then(res => res.json())
      .then(latestPoint => this.setState({ latestPoint }));
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
    const { latestPoint, motor, loading } = this.state;
    return (
      <div className="container">
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
        <div className="row">
          <div className="sixteen columns" style={baseStyles}>
            <h2>Motor is {motor}</h2>
          </div>
        </div>
        <div className="row">
          <div className="sixteen columns" style={baseStyles}>
            <button
              disabled={(motor == "-" ? true : false) || loading}
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

export default App;
