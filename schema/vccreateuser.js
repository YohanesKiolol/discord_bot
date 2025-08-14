const { Schema, model } = require("mongoose");

let vccreateuser = new Schema({
  Guild: String,
  Channel: String,
  User: String,
});

module.exports = model("vccreateuser", vccreateuser);
