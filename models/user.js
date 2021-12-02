const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});
// Adds user name and password
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);

// Go to Mongo Monitor
// show dbs
// use authDemo
// show collections
// db.user.find()