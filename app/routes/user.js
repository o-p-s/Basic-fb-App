const express = require('express');
const router = express.Router();
const userController = require("./../controllers/userController");
const appConfig = require("./../../config/appConfig")
const auth = require('./../middlewares/auth')
const passport =require('passport');
module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}`;
    // defining routes.
    app.post(`${baseUrl}/auth/facebook`,passport.authenticate('facebook-token',{
        scope: ['publish_actions', 'manage_pages','user_posts'],session:false}),userController.generateAndSendToken);
   
}