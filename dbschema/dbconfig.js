// node mysql connection file  
let mysql = require('mysql') ; 
const { execPath } = require("process");

let con = mysql.createConnection({ 
    
    host : 'localhost' , 
    user : 'root' , 
    password : 'password',
    database : 'Ratingdb'

}); 

con.connect(function(error){ 
    if(error){
        console.log("database connection failed !") ; 
    }
   else{ 
       console.log("Database connected to the server") ; 
   }
 
}); 
module.exports = con ;