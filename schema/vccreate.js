const { Schema, model } = require("mongoose");

let vccreate = new Schema({
  Guild: String,
  Channel: String,
  Limit: String,
  Category: String,
});

module.exports = model("vccreate", vccreate);
