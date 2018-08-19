const jwt = require('jsonwebtoken')
const shortid = require('shortid')
const secretKey = 'some!Very=Random@String#That$Nobody%Can^Guess*';


let generateToken = (data, cb) => {
  try {
    let claims = {
      jwtid: shortid.generate(),
      iat: Date.now(),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
      sub: 'authToken',
      iss: 'edChat',
      data: data
    }
    let tokenDetails = {
      token: jwt.sign(claims, secretKey),
      tokenSecret: secretKey
    }
    cb(null, tokenDetails)
  } catch (err) {
    console.log(err)
    cb(err, null)
  }
}// end generate token 

let verifyClaim = (token, cb) => {
  // verify a token symmetric
  jwt.verify(token, secretKey, function (err, decoded) {
    if(err){
      console.log("error while verify token");
      console.log(err);
      cb(err,null)
    }
    else{
      console.log("user verified");
      cb(null,decoded);
    }  
  });

}// end verify claim 


let verifyToken = (token,key,cb) => {
  // verify a token symmetric
  jwt.verify(token,key,function(err, decoded) {
    if(err){
      console.log("error while verify token");
      console.log(err);
      cb(err,null)
    }
    else{
      console.log("user verified");
      cb (null,decoded)
    }   
  });
}// end verify claim 

module.exports = {
  generateToken: generateToken,
  verifyClaim :verifyClaim,
  verifyToken:verifyToken
}
