// require is to import a node package
// when we use the require function, NodeJS will look for the folder in the node_modules folder
const express = require('express');

// create a new express application
const app = express();

// route
// a route is an endpoint, is a URL associated with a function
// when the express application receives a request for a URL, the function associated with the URL
// will be called
app.get('/live', function(req,res){
    // req is request (i.e data sent by the client to the server)
    // res is response (i.e what the server will send back to the client)
    res.send("hello world");
});

// example of dynamic example (or dynamic HTML) 
app.get('/luckyNumber', function(req,res){
    const luckyNumber = Math.floor(Math.random() * 10 + 1);
    res.send(`<h1>Your lucky number is ${luckyNumber}</h1>` )
    
})

// start the server
app.listen(3000, function(){
    console.log("Server has started")
})
