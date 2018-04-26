if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
var moment = require("moment");
var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
const path = require("path");

var url = process.env.MONGODB_URI; // looks like mongodb://<user>:<pass>@mongo.onmodulus.net:27017/Mikha4ot
var connection = mongoose.connect(url); // connect to our database
mongoose.Promise = global.Promise;

var Point = require("./point.js");

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.set("view engine", "ejs");

// app.get("/", function(req, res) {
//   res.send("Hello World!");
// });

// API
app.get("/api/data", function(req, res) {
  new Point({
    timestamp: new Date(),
    distance: parseFloat(req.query.distance)
  })
    .save()
    .then(() => {
      res.send("OK");
    })
    .catch(() => {
      res.send("NOT OK");
    });
});

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
app.listen(port, function() {
  console.log("Example app listening on port " + port);
});
