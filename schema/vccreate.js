const { Schema, model } = require("mongoose");

let vccreate = new Schema({
  Guild: String,
  Channel: String,
  Name: String,
  Limit: String,
  Category: String,
});

module.exports = model("vccreate", vccreate);
