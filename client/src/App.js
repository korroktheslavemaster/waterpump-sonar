import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import Gauge from "./Gauge";
import moment from "moment";
import { ScaleLoader } from "react-spinners";
import { cert, priv, rt } from "./certs.json";
import AWS from "aws-sdk";
import AWSIoTData from "aws-iot-device-sdk";
import AWSConfiguration from "./aws-configuration";

AWS.config.region = AWSConfiguration.region;

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: AWSConfiguration.poolId
});

//
// Create a client id to use when connecting to AWS IoT.
//
var clientId = "mqtt-explorer-" + Math.floor(Math.random() * 100000 + 1);

const baseUrl = AWSConfiguration.lambda;
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
    client.publish("motor", motor ? "0" : "1");
    this.setState({ loading: true });
  };

  componentDidMount() {
    // fetch first point from server only
    fetch(`${baseUrl}/getlatestdatapoint`)
      .then(res => res.json())
      .then(latestPoint => ({
        ...latestPoint
      }))
      .then(latestPoint => this.setState({ latestPoint }));

    var client = AWSIoTData.device({
      //
      // Set the AWS region we will operate in.
      //
      region: AWS.config.region,
      //
      ////Set the AWS IoT Host Endpoint
      host: AWSConfiguration.host,
      //
      // Use the clientId created earlier.
      //
      clientId: clientId,
      //
      // Connect via secure WebSocket
      //
      protocol: "wss",
      //
      // Set the maximum reconnect time to 8 seconds; this is a browser application
      // so we don't want to leave the user waiting too long for reconnection after
      // re-connecting to the network/re-opening their laptop/etc...
      //
      maximumReconnectTimeMs: 8000,
      //
      // Enable console debugging information (optional)
      //
      debug: true,
      //
      // IMPORTANT: the AWS access key ID, secret key, and sesion token must be
      // initialized with empty strings.
      //
      accessKeyId: "",
      secretKey: "",
      sessionToken: ""
    });

    //
    // Attempt to authenticate to the Cognito Identity Pool.  Note that this
    // example only supports use of a pool which allows unauthenticated
    // identities.
    //
    var cognitoIdentity = new AWS.CognitoIdentity();
    AWS.config.credentials.get(function(err, data) {
      if (!err) {
        console.log("retrieved identity: " + AWS.config.credentials.identityId);
        var params = {
          IdentityId: AWS.config.credentials.identityId
        };
        cognitoIdentity.getCredentialsForIdentity(params, function(err, data) {
          if (!err) {
            //
            // Update our latest AWS credentials; the MQTT client will use these
            // during its next reconnect attempt.
            //
            client.updateWebSocketCredentials(
              data.Credentials.AccessKeyId,
              data.Credentials.SecretKey,
              data.Credentials.SessionToken
            );
          } else {
            console.log("error retrieving credentials: " + err);
            alert("error retrieving credentials: " + err);
          }
        });
      } else {
        console.log("error retrieving identity:" + err);
        alert("error retrieving identity: " + err);
      }
    });

    client.on("connect", function() {
      console.log("connected");
      client.subscribe("status");
    });

    client.on("message", (topic, message) => {
      // message is Buffer
      if (topic == "status") {
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
