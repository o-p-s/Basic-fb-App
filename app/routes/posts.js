const express = require('express');
const router = express.Router();
const postsController=require("../controllers/postsController");
const appConfig = require("./../../config/appConfig")
const auth = require('./../middlewares/auth')
module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}`;
    // defining routes.
    app.get(`${baseUrl}/fetchPosts`,auth.isAuthorized,postsController.fetchPosts);
    app.post(`${baseUrl}/createPost`,auth.isAuthorized,postsController.createNewPost);
    app.post(`${baseUrl}/postImage`,auth.isAuthorized,postsController.postANewImage);
   
}