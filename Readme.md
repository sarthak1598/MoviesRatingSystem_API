An API for managing and maintaining the movies in the database with correspoding Ratings/Reviews updated by the different system users using Nodejs , Mysql . 
And Redis server rate limiting implementation . 

Run terminal 1 : nodemon apiserver.js  # to start node server 
Run terminal 2(seperate) :  redis-server  # to start redis 

API endpoints :  #Tested with postman

POST : localhost/api/register : user registration 

POST : localhost/api/login : user authentication 

POST : localhost/api/addmovie : add new movie to database

GET : localhost/api/showmovies : fetches list of movies available in database 

GET : localhost/api/avgratings : fetches the average ratings of all movies 

POST : localhost/api/ratemoviebyid : to post comments/ratingstars by registered users after authentication 

GET : localhost/api/comments?page = {page number/ip} : fetches the list of posted comments by users via pagination 


