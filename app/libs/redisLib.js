//redis lib
const redis = require('redis');
let client = redis.createClient();

client.on('connect', () => {

    console.log("Redis connection successfully opened.......");

});

/**
 *  HASH FUNCTIONS
 */

// function to set new online user.
let setInHash = (hashName, key, value, callback) => {
    client.HMSET(hashName, [ key, value ], (err, result) => {
        if (err) {
            callback(err, null)
        } else {
            callback(null, result)
        }
    });
}// end set a new online user in hash

//function to delete user from hash.
let deleteFromHash = (hashName,key)=>{
    client.HDEL(hashName,key,(err,res)=>{
        if(!err)
        return true;
    });
}// end delete user from hash

let getFromHash=(hashName,key,callback)=>{
    client.HGET(hashName,key,(err,res)=>{
        if(res!=null) callback(null,res)
        else callback(err,null)
    })
}

module.exports = {
    setInHash:setInHash,
    deleteFromHash:deleteFromHash,
    getFromHash:getFromHash
}

