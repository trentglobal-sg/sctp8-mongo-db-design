const express = require('express');
const { connect } = require("./db");
require('dotenv').config();

// create and setup express
const app = express();

async function main() {
    // wait for the db to be connected before creating the routes
    const db = await connect(process.env.MONGO_URI, "sample_mflix");

    app.get('/movies', async function (req, res) {
        const movies = await db.collection('movies')
            .find({
                year: {
                    '$gte': 2000
                }
            })
            .project({
                'movie': 1,
                'year': 1
            })
            .limit(10)
            .toArray();

        // send back a JSON of the movies
        res.json({
            "movies": movies
        })

    })
}
main();

// LISTEN
app.listen(3000, function(){
    console.log("Server has started");
})