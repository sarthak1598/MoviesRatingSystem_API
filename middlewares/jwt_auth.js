// tokenisation code 
const jwt = require("jsonwebtoken") 
 const priv_key = "jwtauthtokenpasswihihhlkhnlkhlkd" ; 
const middleware = function checktoken(req , res ,next){
    // let info = req.body.token  ; 
   if(req.query.token){
       jwt.verify(req.query.token , "privateauthkey",  (err) => {
            if(err){
                return res.status(500).send("Token is not valid !! auth failed") ;
            }     
            else{
              //   return res.json({status:"Auth Token verified" , message:"user authenticated successsfully"}) ; 
              next() ;
           }
       })
   }

   else{ 
       res.send("Please provide the auth token !");
   }
}

module.exports = middleware ;
//module.exports = priv_key ; 