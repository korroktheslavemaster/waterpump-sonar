if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
var moment = require("moment");
var express = require("express");
var app = express();

const http = require("http");
const url = require("url");
const WebSocket = require("ws");

var mongoose = require("mongoose");
var bodyParser = require("body-parser");
const path = require("path");

var mongoUrl = process.env.MONGODB_URI; // looks like mongodb://<user>:<pass>@mongo.onmodulus.net:27017/Mikha4ot
var connection = mongoose.connect(mongoUrl); // connect to our database
mongoose.Promise = global.Promise;
var Point = require("./point.js");

var mqtt = require("mqtt");
var mqtt_client = mqtt.connect(process.env.MQTT_URL);

mqtt_client.on("connect", function() {
  mqtt_client.subscribe(process.env.STATUS_TOPIC);
  console.log("connected");
});

var numMessages = 0;

mqtt_client.on("message", function(topic, message) {
  // message is Buffer
  // console.log(message.toString());
  if (topic == process.env.STATUS_TOPIC) {
    numMessages += 1;
    // store every 6th message ~ every 30 seconds
    if (numMessages % 6 == 0) {
      var point = JSON.parse(message.toString());
      point.timestamp = new Date(point.timestamp * 1000);
      new Point(point).save().then(point => console.log(point));
    }
  }
});

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.set("view engine", "ejs");

// app.get("/", function(req, res) {
//   res.send("Hello World!");
// });

// API

// DEPRECATED
// app.get("/api/data", function(req, res) {
//   new Point({
//     timestamp: new Date(),
//     distance: parseFloat(req.query.distance)
//   })
//     .save()
//     .then(() => {
//       res.send("OK");
//     })
//     .catch(() => {
//       res.send("NOT OK");
//     });
// });

var moment = require("moment-timezone");
app.get("/api/plot", (req, res) => {
  const TANK_DEPTH_CM = 109.982; // copying value from sonar.py on raspi
  // last 24 hours only
  Point.find({
    timestamp: {
      $lte: moment().toDate(),
      $gte: moment()
        .subtract(1, "days")
        .toDate()
    }
  })
    .sort({ timestamp: -1 })
    // .limit(300)
    .then(points => {
      x = points.map(({ timestamp }) =>
        // timezones not supported by plotly, change it manually here
        moment.tz(timestamp, "Asia/Kolkata").format()
      );
      y_percentage = points.map(({ percentage }) => percentage);
      y_distance = points.map(({ distance }) => distance);
      res.render("plot", {
        x: JSON.stringify(x),
        y_percentage: JSON.stringify(y_percentage),
        y_distance: JSON.stringify(y_distance)
      });
    });
});

app.get("/api/test", (req, res) => {
  res.json("working");
});

app.get("/api/point/latest", (req, res) => {
  Point.findOne()
    .sort({ timestamp: -1 })
    .exec()
    .then(point => {
      res.json(point);
    })
    .catch(err => {
      console.log(err);
      res.json({});
    });
});

// react
if (process.env.NODE_ENV == "production") {
  console.log("prod env");
  app.use(express.static(path.join(__dirname, "./client/build")));

  app.get("/*", function(req, res) {
    res.sendFile(path.join(__dirname, "./client/build", "index.html"));
  });
}

port = process.env.PORT;

// websocket

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", function connection(ws, req) {
  const location = url.parse(req.url, true);
  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
  });

  ws.send("something");

  var id = setInterval(function() {
    ws.send(JSON.stringify(new Date()), function() {});
  }, 1000);

  console.log("websocket connection open");

  ws.on("close", function() {
    console.log("websocket connection close");
    clearInterval(id);
  });
});

server.listen(port, function() {
  console.log("Example app listening on port " + port);
});
