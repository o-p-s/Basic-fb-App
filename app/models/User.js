'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;
  
  var userSchema = new Schema({
    fullName: {type: String},
    email: {
      type: String, required: true,
      trim: true, unique: true,
      match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    },
    facebookProvider: {
        id: {type:String},
        token: {type:String}
    },
    createdOn:{type:Date}
  });
mongoose.model('User', userSchema);