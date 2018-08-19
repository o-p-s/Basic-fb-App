const mongoose = require('mongoose');
const request = require('request-promise');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('./../libs/checkLib');
const redis=require('./../libs/redisLib');

/** fetching User feeds using pagination and maintains viewCount
 * Requests for reactions.type(LIKE) with a summary(total_count) for each post
 */
let fetchPosts=(req,res)=>{
    const postsFieldSet = 'feed.order(reverse_chronological).limit(5){id,admin_creator,created_time,updated_time,description,from,full_picture,link,message,name,reactions.type(LIKE).summary(total_count)}';

    const options = {
      method: 'GET',
      uri: `https://graph.facebook.com/v3.1/me`,
      qs: {
        access_token: req.userToken,
        fields: postsFieldSet
      }
    };
    if(!check.isEmpty(req.query.pageToken)){
        options.qs['__paging_token']=req.query.pageToken;
    }
    request(options).then(fbRes => {
        if(fbRes.error){
            logger.error(fbRes.error,'postController:fetchPosts',9)
            res.status(500).send(response.generate(true,'Unable to fetch feeds',500,fbRes.error))
        }else{
            logger.info('User Feed Found','postController:fetchPosts',9)
            let data=JSON.parse(fbRes);

            //storing keyvalue pairs of {[post.id]:viewCount} to maintain ViewCount in redis hash. 
            function findCount(id){
                return new Promise((resolve,reject)=>{
                    redis.getFromHash('Posts',id,(err,resultCount)=>{
                        let count=0;
                        if(err){
                        logger.error(err,'postController:fetchposts:savingHash',3)
                        reject(response.generate(true,err.message,500,null));
                        }
                        else {
                            if(check.isEmpty(resultCount))
                                count=1;
                            else{
                                count=parseInt(resultCount)+1;
                                redis.deleteFromHash('Posts',id);
                            }                            
                            redis.setInHash('Posts',id,count,(err,newPost)=>{
                                if(err){
                                    logger.error(err,'postController:fetchposts:savingHash',3)
                                    reject(response.generate(true,err.message,500,null));
                                }
                                else{
                                    logger.info('Post Count was hashed successfully','postController:fetchposts:savingHash',3);
                                    resolve(count);  
                                }
                            })             
                        }
                    });
                })
            }
            data.feed.data.map(async (post)=>{ await findCount(post.id);})

            data.feed['pagination']={
                'next':data.feed.paging.next.substring(data.feed.paging.next.indexOf('__paging_token=')+15,data.feed.paging.next.length),
                'previous':data.feed.paging.previous.substring(data.feed.paging.previous.indexOf('__paging_token=')+15,data.feed.paging.previous.length)
            }
            delete data.feed.paging;
            res.status(200).send(response.generate(false,'User Feed was fetched!',200,data))                             
        }    
    })
}

let createNewPost=(req,res)=>{
    const postOptions = {
        method: 'POST',
        uri: `https://graph.facebook.com/v3.1/${req.userId}/feed`,
        qs: {
          access_token: req.userToken,
          message:'Hey! A sample Post.'
        }
      };
      /**
       * Several other fields can also be added as a part of 'qs' to create a post.
       * eg.caption,description..
       */
      request(postOptions)
        .then(fbRes => {
          JSON.parse(fbRes);
          if(fbRes.error){
              logger.error(fbRes.error,'postController:createNewPost',9)
              res.status(500).send(response.generate(true,'Unable to create new Post',500,fbRes.error))
          }else{
              logger.info('Post was created','postController:createNewPost',9)
              res.status(200).send(response.generate(false,'Post created successfully!',200,fbRes.data))
          }    
      })
}

let postANewImage=(req,res)=>{
    const postImageOptions = {  
      method: 'POST',
      uri: `https://graph.facebook.com/v3.1/${req.userId}/photos`,
      qs: {
        access_token: req.userToken,
        caption: 'Caption',
        url: 'Image URL',
        no_story:true
      }
    };
      request(postImageOptions)
        .then(fbRes => {
          JSON.parse(fbRes);
          if(fbRes.error){
              logger.error(fbRes.error,'postController:postANewImage',9)
              res.status(500).send(response.generate(true,'Unable to Post a new image',500,fbRes.error))
          }else{
              logger.info('Post was created','postController:postANewImage',9)
              res.status(200).send(response.generate(false,'New image posted successfully!',200,fbRes.data))
          }    
      })
}
module.exports={
    fetchPosts:fetchPosts,
    createNewPost:createNewPost,
    postANewImage:postANewImage
}