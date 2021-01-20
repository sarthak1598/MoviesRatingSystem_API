const express = require("express") ; 
const router = express.Router() ; 

const con = require("../dbschema/dbconfig") ; 

const {check , validationResult, checkSchema} = require('express-validator'); 

const jwt = require("jsonwebtoken") ;
const morgan = require("morgan") ; // request logging middleware  
const { response } = require("express");
const { query } = require("../dbschema/dbconfig");
const { contentSecurityPolicy } = require("helmet");

const priv_key = "secretauthmessage" ; 


const redis = require('ioredis')

 const client = redis.createClient({
   port: process.env.REDIS_PORT || 6379,
       host: process.env.REDIS_HOST || 'localhost', 

 })

 client.on('connect', function () {
   console.log('connected to the redis server');
 });

 // redis connection error handle
 client.on('error' , (err) => {
     console.log("erro connecting to reddis")
     return 
 })

// reddis
async function checkstatus(req , res ,  next){
    // let res
   let counter
    let ip = req.ip // exported the ip address of current request 
    try {
        counter = await client.incr(ip)

    } 
       catch (err) {
        throw err
    }

    client.expire(ip, 15) 

    if (counter > 10) {
        return res.sendStatus(500).send('Server overloaded with so many requests , Server alert!!')
    }

    else{ 
           // calling the furthere code after middleware in the route 
           next()
    } 
}

// middleware integrated with every application route  
 router.use(checkstatus)

// main home route 
router.get('/' ,(req , res) => { 
    // console.log(req.ip)
    res.send("Welcome to the Movie rating Api") ; 

});

// registration route/ validations logic updated   
router.post('/register', [
    check('user').isLength({ min: 3 }),
        check('pass').isLength({ min : 3})
  ] , 
       (req , res) => { 
        let err = validationResult(req) ; 
          if(!err.isEmpty()){
             return res.status(500).json({erros : err.array()})
          }

       let name = req.query.user ;  
       let password = req.query.pass ; 

       let query ="INSERT INTO users (name,password) VALUES (?,?)"; 
    con.query(query , [name , password] ,(error , results , fields) => {
        if(error){ 
            // insert query   
            res.send("Error proccesing the query");
           
        }
        else{ 
            
             res.status(201).json({status:true , info: results , response : " Registration success"});
        }
    });

}); 

// Login/auth check route  / validated
 router.post("/login" , [
    check('user').isLength({min : 3}).escape().trim() ,
    check('pass').isLength({ min: 3 }).escape().trim()

  ] , (req , res) => { 
     console.log("route working") ; 

     let err = validationResult(req) ; 
     if(!err.isEmpty()){
        return res.status(500).json({erros : err.array()})
     }
// storing req parameters for external use 
    let name = req.body.user ; 
    let pass = req.body.pass ; 

    // query ;
    con.query('select * from users where name = ?' , [name] , (error , results , fields) => {  
         if(!error){

             if(results.length == 0 ){ 
                  res.status(404).send("User not found") ; 
             }

             if(results.length > 0 ){ 
                 // return res.status
               if(pass == results[0].password){    
                      // jwt token generated after success login 
                  var token = jwt.sign(results[0].password , priv_key);
                  console.log(token) ; 
               // send response as token value 
                        res.json({status:"user found" , User_token : token });
        
               } 

               else{ 
                    return res.status(400).json({status : "Incorrect password" , info:"Login failed!!"});
               } 

             }
         }

         else{ 
             res.send("Query ecxecution failed") ;    
         }
    });

}); 

// new route for jwt authentication to be hitted with token passed as json using express middlewares
router.post('/tokenauth' , (req , res) => { 
       let token = req.query.token ; 
            checktoken(res , token) ; 
            
});

// jwt authentication fucntion ; 
function checktoken(res ,info){
    if(info){
        jwt.verify(info , priv_key , (err) => {
             if(err){
                 return res.status(500).send("Token is not valid !! auth failed") ;
             }     
             else{
                return res.json({status:"Auth Token verified" , message:"user authenticated successsfully"}) ; 
            }
        })
    }

    else{ 
        res.send("Please provide the auth token !");
    }
}


// show movies present in the database 
router.get('/showmovies' , (req , res) =>{ 
    // list all movies 

    let query = "select movie_id , movie_name , average_rating from movies"  
    con.query(query ,(error , results , fields) => {
        if(error){ 
            // insert query   
            res.send("Error proccesing the query");  
        }
        else{ 
            
             res.status(201).json({status:true , info: results});
        }
    });

})

 // add movie route 
 router.post('/addmovie' , (req , res) => {
    let name = req.query.name

    let q = "insert into movies (movie_name , raters , ratingstars ,totalraters , average_rating) values (?,?,?,?,?)" 
    con.query(q , [name , 0 , 0 , 0 , 0] , (error , results , fields) => {
          if(error){
                res.send("error") ; 
          }
          else{
              res.json({status:true , info : results , result:"success"}) ; 
          }
    })

 })

 // route for fetching total ratings
router.get('/totalratings' , (req , res) => {
  let q = "select totalraters from movies where movie_id = 1"
  con.query(q , (error , results) => {
      if(error){
          res.send("error")
      }
      else{
          res.json({status:"query execution success" , Totalraterscount : results[0].totalraters})
      }
  })

})

// route for fetching average ratings of all present movies 
router.get('/avgratings' , (req , res) => {
    let query = "select movie_name , average_rating from movies" ; 
    con.query(query , (error , results , fields) =>{
        if(error){
            res.send("error execution")
        }

        else{     
             console.log(results)
             res.json({status : "Query execution success" , averageratings : results})
        }

    })
})

router.post('/ratemoviebyid' , (req , res) => {
      let mid = req.query.id
       let mcomm = req.query.com
       let mrating = req.query.stars 

    let raters = "update movies set totalraters = totalraters + 1 where movie_id = 1"
       con.query(raters , (error) => {
        if(error){
             return res.send("error")
        }
    })

     // update the movie's average rating in movies table 
      let query = "insert into comments (movie_id , comment , rating) values (?,?,?)"  
   //   let q2 = "select rating , ratingstars from movies where movie_id = mid"
     con.query(query , [mid , mcomm , mrating] , (error) => {
            if(error){
                res.send("error processing query")
            }

else { 
let q3 = "update movies set ratingstars = ratingstars + ? , raters = raters + 1 where movie_id = ? "
let q4 = "select ratingstars , raters from movies where movie_id = ? " ; 
  
    // q3 query eexecution 
    con.query(q3 , [mrating , mid] , (err) => {
         if(err){res.sendStatus(400)}
    })       
    
    // q4 query execution 
    con.query(q4 ,[mid],(err , results) => {
         if(err){res.sendStatus(400) } 
         // fetching avg calculation here 
         let avgrvalue = (results[0].ratingstars/results[0].raters).toFixed(3)
          //   avgrvalue = avgrvalue.toFixed(2)  
         // updating the current averagerating to movies database 
         let q5 = "update movies set average_rating = ? where movie_id = ?"

            // q5 query execution 
            con.query(q5 , [avgrvalue , mid],(err) =>{
                if(err){res.sendStatus(400)}
                console.log(avgrvalue)
              
            })

    })
       // console.log(avgrvalue.toFixed(2))
       


     res.status(201).json({status:"Data posted" , response: "updated"});   
 } 

     })

})

// route for comment/rating listings posted by the registered users to API 
// router.get('/comments' , paginatecomments)

// fumction to implement pagination / Limiting the results of get query 
router.get('/comments' , (req , res) =>{
     // sorting and pagination implementation 
     const limit = 10  // 10 records per page 
     const page = req.query.page
     // offset
        const offset = (page - 1) * limit
     // query for fetching data using limit /offset clause 
     const Query = "select users.name AS Ratedby , movies.movie_name AS movie , comments.comment , comments.rating AS ratingstars from movies JOIN comments ON comments.movie_id=movies.movie_id JOIN users ON users.user_id = comments.user_id order by comments.rating DESC limit ? OFFSET ?"
     
       con.query(Query , [limit , offset] , function (error, results, fields) {
 
              if (error) {
                    res.sendStatus(400) 
              } 
         var jsonResult = {
           'page_number': page,
           'comments':results
         } 
 
       var myJsonString = JSON.parse(JSON.stringify(jsonResult));
         res.statusMessage = "comments for page "+page;
            res.json(myJsonString);
          res.end();
 
       })

})
module.exports = router ; 




