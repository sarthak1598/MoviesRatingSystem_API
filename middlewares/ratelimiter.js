 // reddis server integration with node server --->>ip based rate limiting 
const redis = require('ioredis')
 const client = redis.createClient({

   port: process.env.REDIS_PORT || 6379,
   host: 'localhost',

 })

 client.on('connect', ()=>{
   console.log('connected to the redis cache server');
 });
 
 client.on('error' , ()=>{
    console.error("reddis connection error")
    return ;
 });

const checkstatus = async function isOverLimit(req , res , next) {
    let counter
       let ip = req.ip ; 

    try {
        counter = await client.incr(ip)
        console.log("incrementing" +counter)

    } catch (err) {
        throw err
    }
    client.expire(ip, 15)

    if (counter > 10) {
      return res.status(429).send('Server overloaded with so many requests , Server alert!!')

    }
    else{

      // calling next statement of route if requests count is under limit in redis
        next();  
    }
  
}

module.exports = checkstatus ; 