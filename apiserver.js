// api server entry file  
const express = require('express') ; 
const app = express() ;
const helmet = require('helmet') ; 

const sanitize = require('express-validator') ; 
const bodyparser = require("body-parser") ;
const jwt = require("jsonwebtoken") ;

// request logging middleware  
const morgan = require("morgan") ; 
const router = require('./routes/users_handle');

process.env.AUTH_KEY = "jwtauthtokenpassword"; 
// middlewares registration including security 

app.use(helmet()) ; 
app.use(bodyparser.urlencoded({extended:true})) ; 
app.use(bodyparser.json()) ; 


// logging
app.use(morgan('dev'));

// port 
const port = process.env.PORT || 4000  ; 

// server 
app.listen(port , (error) => {
    if(error){
        console.log("server error...")
    }
    console.log("Server started on port "+port) ; 

});

//routing 
app.use('/api' , router) 
