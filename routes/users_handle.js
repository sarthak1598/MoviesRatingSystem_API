const express = require("express") ; 
const router = express.Router() ; 

const con = require("../dbschema/dbconfig") ; 

const {check , validationResult, checkSchema} = require('express-validator'); 

const jwt = require("jsonwebtoken") ;
const morgan = require("morgan") ; // request logging middleware  
const { response } = require("express");
const { query } = require("../dbschema/dbconfig");
const { contentSecurityPolicy } = require("helmet");

const middleware = require('../middlewares/jwt_auth') 
const checkstatus = require('../middlewares/ratelimiter')

// ratelim middleware integrated with every application route  
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
    check('user').isLength({min : 3}).escape().trim(),
    check('pass').isLength({ min: 3 }).escape().trim()

  ] , (req , res) => { 
     console.log("route working") ; 

     let err = validationResult(req) ; 
     if(!err.isEmpty()){
        return res.status(500).json({erros : err.array()})
     }
// storing req parameters for external use 
    let name  = req.query.user ; 
    let pass = req.query.pass ; 

    // query ;
    let query = "select * from users where name = ?"
    con.query(query , [name] , (error , results , fields) => {  
         if(!error){
              //  console.log(results.length) 
             if(results.length == 0 ){ 
                  return res.status(404).send("User not found") ; 
             }

             if(results.length > 0 ){ 
                 // return res.status
                  req.user = name ; 
               if(pass == results[0].password){    
                      // jwt token generated after success login 
                  var token = jwt.sign(results[0].password , "privateauthkey");
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
             return res.send("Query ecxecution failed") ;    
         }
    });

}); 

// auth middleware to further routing points in application
// router.use(middleware)

// show movies present in the database 
router.get('/showmovies' , middleware , (req , res) =>{ 
    // list all movies 
     console.log(req.user)
    let query = "select movie_id , movie_name , average_rating from movies"  
    con.query(query ,(error , results , fields) => {
        if(error){ 
            // insert query   
            res.send("Error proccesing the query");  
        }
        else{ 
            
             res.status(201).json({status : req.user , info: results});
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
   console.log(req.user)
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
                // always return the response when error to prevent server crash
                return res.send("error processing query")
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
                if(err){return res.sendStatus(400)}
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
                    return res.send(400)
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




