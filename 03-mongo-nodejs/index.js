const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config(); 
// config() function does one thing:
// put the variables in the .env file into the OS' environment

// two parameters
// - the uri is the mongo connection string
// - the dbname is the name of the database we want to connect to 
async function connect(uri, dbname) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1
        }
    })

    // a client is a program designed to connect to a server
    // so a mongo client is a program designed to connect to a mongo server
    // mongo compass is an example of a mongo client
    // the one we have created with new MongoClient is the NodeJS Mongo Client which allows
    // our NodeJS program to send and recieve data from Mongo
    await client.connect();

    console.log("Connected to the server");

    const db = client.db(dbname);
    return db;
}

async function main() {
    // process is an object created by NodeJS
    // it is a way to refer to the operating system 
    // and the Node program that is currently running
    // process.env will refer to the OS' environment
    const db = await connect(process.env.MONGO_URI, "sample_mflix");
    // the Node client uses slightly syntax from MongoShell (the principles and concepts are the same)
    // the command in Mongoshell: db.movies.find()
    // .limit is to show the first five
    //  const movies = await db.collection("movies").find({}).limit(5).toArray();

    // mongoshell: db.movies.find({"year":{"$gte":2000}}, {"year":1, "title":1})
    const movies = await db.collection("movies").find({
        'year': {
            "$gte": 2000
        }
    }).project({
        'title': 1,
        'year': 1
    }).limit(5).toArray();
    console.log(movies);
}

main();