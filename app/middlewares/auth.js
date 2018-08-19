const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const request = require("request")
const Auth = mongoose.model('Auth')

const logger = require('./../libs/loggerLib')
const response = require('./../libs/responseLib')
const token = require('./../libs/tokenLib')
const check = require('./../libs/checkLib')
const redis = require('./../libs/redisLib')
let isAuthorized = (req, res, next) => {

  if (req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken')) {
    let findAuthModel=()=>{
      return new Promise((resolve,reject)=>{
        Auth.findOne({authToken: req.header('authToken') || req.params.authToken || req.body.authToken || req.query.authToken}, (err, authDetails) => {
          if (err) {
            console.log(err)
            logger.error(err.message, 'Authorization Middleware', 10)
            reject(response.generate(true, 'Failed To Authorized', 500, null))
          } else if (check.isEmpty(authDetails)) {
            logger.error('No Authorization Model Is Present', 'Authorization Middleware', 10)
            reject(response.generate(true, 'Invalid Or Expired Authorization Key', 404, null))        
          } else { 
            logger.info('Auth Model Found','Authorization Middleware',10) 
            resolve(authDetails);            
          }
        })
      })
    }
    let authenticate=(authDetails)=>{
      return new Promise((resolve,reject)=>{
        token.verifyToken(authDetails.authToken,authDetails.tokenSecret,(err,userId)=>{
          if(err){
            logger.error(err,'Authorization Middleware',10)
            reject(response.generate(true,'Invalid Token',500,null))
          }
          else if(userId){
            logger.info('Token verified.','Authorization Middleware',3)
            resolve(userId.data.id)
          }
        })
      })
    }
    let retreiveUser=(userId)=>{
      return new Promise((resolve,reject)=>{
         redis.getFromHash('AllUsers',userId,(err,token)=>{
                  if(err){
                      logger.error(err.message, 'Authorization Middleware',3)
                      reject(response.generate(true,`Internal Server Error`,500,null))
                  }else if(check.isEmpty(token)){
                      logger.error('User Not Found.','Authorization Middleware',3)
                      reject(response.generate(true,'User Not found',404,null))
                  }else{
                      req.userId=userId;
                      logger.info('User Found','Authorization Middleware',3)
                      resolve(token)
                  }
              })
          })
      }
      findAuthModel(req,res)
      .then(authenticate)
      .then(retreiveUser)
      .then((resolve)=>{
        req.userToken=resolve;
        next()
      }).catch((err)=>{
        res.status(err.status).send(err);
      })
  } else {
    logger.error('Authorization Token Missing', 'Authorization Middleware', 5)
    res.status(400).send(response.generate(true, 'Authorization Token Is Missing In Request', 400, null))
  }
}
module.exports = {
  isAuthorized: isAuthorized
}
