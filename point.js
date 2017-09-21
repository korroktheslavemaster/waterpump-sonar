// point.js
var mongoose = require('mongoose');

var schema = mongoose.Schema({
  timestamp: {type: Date, required: true},
  distance: {type: Number, required: true}
})

module.exports = mongoose.model('Point', schema)