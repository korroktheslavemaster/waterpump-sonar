var express = require('express')
var app = express()
var mongoose = require('mongoose');
var bodyParser   = require('body-parser');

var url =  process.env.MONGODB_URI || 'mongodb://localhost/local' // looks like mongodb://<user>:<pass>@mongo.onmodulus.net:27017/Mikha4ot
var connection = mongoose.connect(url); // connect to our database
mongoose.Promise = global.Promise

var Point = require('./point.js')

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.get('/data', function(req, res) {
  new Point({
    timestamp: new Date(),
    distance: parseFloat(req.query.distance)
  }).save()
  .then(() => {
    res.send('OK')
  }).catch(() => {
    res.send('NOT OK')
  })
})

app.get('/plot', (req, res) => {
  res.send("in progress")
})

port = process.env.PORT || 3000
app.listen(port, function () {
  console.log('Example app listening on port ' + port)
})