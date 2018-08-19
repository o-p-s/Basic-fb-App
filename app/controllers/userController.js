const mongoose = require('mongoose');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
const token=require('./../libs/tokenLib')
const redis =require('./../libs/redisLib')
/* Models */
const UserModel = mongoose.model('User')
const AuthModel=mongoose.model('Auth')

let upsertUser=(accessToken,refreshToken,profile,cb)=>{
            UserModel.findOne({'facebookProvider.id': profile.id}).exec((err,retrievedUserDetails)=>{
                if(err){
                    logger.error(err.message, 'userController:userLogin:createUser:findOne', 1)
                    return cb(err, null);
                }else if(check.isEmpty(retrievedUserDetails)){
                    let newUser= new UserModel({
                        fullName: profile.displayName,
                        email: profile.emails[0].value,
                        facebookProvider: {
                          id: profile.id,
                          token: accessToken
                        },
                        createdOn:Date.now()
                    })
                    newUser.save((err,newUser)=>{
                        if(err){
                            logger.error(err.message,'userController:userLogin:createUser:save', 1)
                            return cb(err,null)
                        }else{
                            let newUserObj=newUser.toObject();
                            logger.info('New User Model saved Successfully','userController:userLogin:createUser:save',1)
                            return cb(null,newUserObj)
                        }
                    })
                    redis.setInHash('AllUsers',profile.id,accessToken,(err,hash)=>{
                        if(err)
                        logger.info('User hash Unsuccessful!','userController:userLogin:createUser:save',4)
                        else 
                        logger.info('User Successfully hashed!','userController:userLogin:createUser:save',4)
                    })
                }else{
                    logger.error('User Already Exists','userController:userLogin:createUser',1)
                    return(null,retrievedUserDetails)
                }
            })

}

let generateAndSendToken=(req,res)=>{
    if (!req.user) {
        return res.send(401, 'User Not Authenticated');
    }else{
        let generateToken=()=>{
            return new Promise((resolve,reject)=>{
                token.generateToken({id:req.user.facebookProvider.id}, (err, tokenDetails) => {
                    if (err) {
                        logger.error(err.message,'userController:userLogin:generateToken',3)
                        reject(response.generate(true, 'Failed to generate Token', 500, null))
                    } else {
                        logger.info('User Token Generated Successfully','userController:userLogin:generateToken',3)
                        resolve(tokenDetails)
                    }
                })
            })
        }
        let saveToken=(tokenDetails)=>{
            return new Promise((resolve,reject)=>{
                AuthModel.findOne({userId:req.user.id},(err,retrievedAuthModel)=>{
                    if(err){
                        logger.error(err.message,'userController:userLogin:saveToken()', 1)
                        reject(response.generate(true, 'Internal Server Error', 500, null))
                    } else if(check.isEmpty(retrievedAuthModel)){
                        let authModel = new AuthModel({
                            userId: req.user.id,
                            authToken: tokenDetails.token,
                            tokenSecret: tokenDetails.tokenSecret,
                            tokenValidationTime: Date.now()+ 86400000
                        })
                        authModel.save((err, newAuthModel) => {
                            if (err) {
                                logger.error(err.message,'userController:userLogin:saveToken()',1)
                                reject(response.generate(true, 'Internal Server Error', 500, null))
                            } else {
                                logger.info('User Token Model saved Successfully','userController:userLogin:saveToken()',1)
                                resolve({token: newAuthModel.authToken})
                            }
                        })
                    }else{
                        retrievedAuthModel.authToken=tokenDetails.token
                        retrievedAuthModel.tokenSecret=tokenDetails.tokenSecret
                        retrievedAuthModel.tokenValidationTime = Date.now()+ 86400000
                        retrievedAuthModel.save((err, newAuthModel) => {
                            if (err) {  
                                logger.error(err.message,'userController:userLogin:saveToken()', 1)
                                reject(response.generate(true,'Internal Server Error', 500, null))
                            }else if(check.isEmpty(newAuthModel)){
                                logger.error(err.message,'userController:loginUser:saveToken()',1)
                                reject(response.generate(true,'Failed to save new Token Details',404,null))
                            }else {
                                logger.info('New User Token Saved Successfully','userController:userLogin:saveToken()',1)
                                resolve({token: newAuthModel.authToken})
                            }
                        })
                    }
                })
            })
        }

    generateToken(req,res)
        .then(saveToken)
        .then((resolve)=>{
            res.status(200).send(response.generate(false,'User is Authorized',200,{
                id:req.user.facebookProvider.id,
                authToken:resolve.token
            }));   
        },(reject)=>{
            res.status(reject.status).send(reject);
        })
    }

}

module.exports={
upsertUser:upsertUser,
generateAndSendToken:generateAndSendToken
}