import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import Gauge from "./Gauge";
import moment from "moment";
import { ScaleLoader } from "react-spinners";
import mqtt from "mqtt";

const baseStyles = {
  padding: "0.5rem",
  textAlign: "center"
};

class App extends Component {
  state = {
    latestPoint: null,
    loading: true
  };

  onMotorClicked = () => {
    const { client, latestPoint: { motor } } = this.state;
    client.publish("arpit/waterpump/motor", motor ? "0" : "1");
    this.setState({ loading: true });
  };

  componentDidMount() {
    // fetch first point from server only
    fetch(`/api/point/latest`)
      .then(res => res.json())
      .then(latestPoint => ({
        ...latestPoint,
        timestamp: moment(latestPoint.timestamp).unix()
      }))
      .then(latestPoint => this.setState({ latestPoint }));
    var client = mqtt.connect(
      "wss://test.mosquitto.org:8081/" /*, {
      username: "qfpvofcn",
      password: "FdC_CFb_idiV"
    }*/
    );
    client.on("connect", function() {
      console.log("connected");
      client.subscribe("arpit/waterpump/status");
    });

    client.on("message", (topic, message) => {
      // message is Buffer
      if (topic == "arpit/waterpump/status") {
        var latestPoint = JSON.parse(message.toString());
        this.setState({ latestPoint, loading: false });
      }
    });
    this.setState({ client });
  }

  componentWillUnmount() {
    console.log("disconnected");
    this.state.client.end();
  }

  latestPointTimeString = latestPoint => {
    return latestPoint ? moment.unix(latestPoint.timestamp).fromNow() : "-";
  };

  render() {
    const { latestPoint, loading } = this.state;
    const motor = latestPoint ? latestPoint.motor : undefined;
    const latestPointTimeString = this.latestPointTimeString(latestPoint);
    var motorString = motor == undefined ? "..." : motor ? "ON" : "OFF";
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
            <i>{latestPointTimeString}</i>
          </small>
        </div>
        <div className="row">
          <div className="sixteen columns" style={baseStyles}>
            <h2>
              Motor is{" "}
              {motor ? (
                <span style={{ color: "#48ce58" }}>{motorString}</span>
              ) : (
                motorString
              )}
            </h2>
          </div>
        </div>
        <div className="row">
          <div className="sixteen columns" style={baseStyles}>
            <button
              disabled={(motor == undefined ? true : false) || loading}
              onClick={this.onMotorClicked}
            >
              Turn {motor ? "OFF" : "ON"}
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
