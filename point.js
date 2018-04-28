// point.js
var mongoose = require("mongoose");

var schema = mongoose.Schema(
  {
    timestamp: { type: Date, required: true },
    distance: { type: Number, required: true },
    motor: Number
  },
  {
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
  }
);

schema.virtual("percentage").get(function() {
  const TANK_DEPTH_CM = 109.982; // 43.3 inches
  const TANK_FULL_DISTANCE_CM = 14.83;

  if (this.distance < TANK_FULL_DISTANCE_CM) return 1;
  else
    return (
      (TANK_DEPTH_CM - (this.distance - TANK_FULL_DISTANCE_CM)) / TANK_DEPTH_CM
    );
});

module.exports = mongoose.model("Point", schema);
