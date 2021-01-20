// api server entry file  
const express = require('express') ; 
const app = express() ;
const helmet = require('helmet') ; 

const sanitize = require('express-validator') ; 
const bodyparser = require("body-parser") ;
const jwt = require("jsonwebtoken") ;
//const user_routes
const morgan = require("morgan") ; // request logging middleware  
const router = require('./routes/users_handle');

process.env.AUTH_KEY = "jwtauthtokenpassword"; 
// redis client /server set up 

// const reddis-ratelimiter = require('./middlewares/ratelimiter')
// middlewares registration including security 




app.use(helmet()) ; 
app.use(bodyparser.urlencoded({extended:true})) ; 
app.use(bodyparser.json()) ; 


// logging
app.use(morgan('dev'));

const port = process.env.PORT || 4000  ; 

app.listen(port , () => {
    console.log("Server started on port "+port) ; 

});

//app.use(chechstatus)
app.use('/api' , router) 
