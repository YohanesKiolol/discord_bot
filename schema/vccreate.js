const { Schema, model } = require("mongoose");

let vccreate = new Schema({
  Guild: String,
  Channel: String,
  Limit: String,
  Category: String,
  Name: String, // Optional custom name for this trigger channel setup
});

module.exports = model("vccreate", vccreate);
