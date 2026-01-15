// REQUIRES
const express = require('express');
const { connect } = require('./db');
const { ObjectId } = require('mongodb');

// read the values from .env
require('dotenv').config();

// SETUP
const app = express();
app.use(express.json()); // tell Express json body in POST, PATCH and PUT requests

// ROUTES
async function main() {

    const db = await connect(process.env.MONGO_URI, process.env.MONGO_DB);

    // GET /health 
    // req -> request is what is sent by the client
    // res -> response is what the server is going to send back
    app.get('/health', function (req, res) {
        res.json({
            'message': 'Hello world'
        })
    });

    app.get('/recipes', async function (req, res) {
        // In mongoshell, to show recipes with just the name, tags and cuisine: 
        // db.recipes.find({},{
        //    name: 1, cuisine: 1, tags: 1
        // })
        const recipes = await db.collection('recipes').find()
            .project({
                name: 1, cuisine: 1, tags: 1
            })
            .toArray();

        res.json({
            recipes
        })
    })

    // a : in the URL means it is a URL parameter
    // it is a like placeholder
    // so the following URL actually can match /recipes/xyzabc or /recipes/112233
    app.get('/recipes/:recipeId', async function (req, res) {
        // extract out the matched recipeId
        const recipeId = req.params.recipeId;

        // get a recipe by its id
        // mongosh: db.recipes.find({
        //    _id:ObjectId("6966364e9bd4716014eee7d7")
        //    })

        const recipe = await db.collection('recipes').findOne({
            _id: new ObjectId(recipeId)
        });

        res.json({
            recipe
        })
    });

    // POST /recipes
    // For post requests, we can access the body with req.body
    // (the body of the post request is what data the client is sending over)
    app.post('/recipes', async function (req, res) {
        // object destructuring - extract a key from an object as a variable
        const { name, cuisine, prepTime, cookTime, servings, ingredients, instructions, tags } = req.body;
        if (!name || !cuisine || !prepTime || !cookTime || !servings || !ingredients || !instructions || !tags) {
            return res.status(401).json({
                'error': 'Some recipe fields are missing'
            })
        }

        // check if the cuisine actually exists
        // by finding it in the cuisine collection
        const cuisineDoc = await db.collection('cuisines').findOne({
            name: cuisine
        });

        // if the cuisine is not found
        if (!cuisineDoc) {
            return res.status(401).json({
                'error': "Invalid cuisine"
            })
        }

        // we need check if all the tags are valid
        const tagDocuments = await db.collection('tags').find({
            name: {
                $in: tags
            }
        }).toArray();

        if (tagDocuments.length !== tags.length) {
            return res.status(401).json({
                'error': "One or more tags is invalid"
            })
        }

        const newRecipe = {
            name,
            cuisine: cuisineDoc,
            prepTime,
            cookTime,
            servings,
            ingredients,
            instructions,
            tags: tagDocuments
        }


        const result = await db.collection('recipes').insertOne(newRecipe);

        res.json({
            'new_recipe_id': result.insertedId
        })
    })

    app.put('/recipes/:recipeId', async function (req, res) {

        const recipeId = req.params.recipeId;

        // object destructuring - extract a key from an object as a variable
        const { name, cuisine, prepTime, cookTime, servings, ingredients, instructions, tags } = req.body;
        if (!name || !cuisine || !prepTime || !cookTime || !servings || !ingredients || !instructions || !tags) {
            return res.status(401).json({
                'error': 'Some recipe fields are missing'
            })
        }

        // check if the cuisine actually exists
        // by finding it in the cuisine collection
        const cuisineDoc = await db.collection('cuisines').findOne({
            name: cuisine
        });

        // if the cuisine is not found
        if (!cuisineDoc) {
            return res.status(401).json({
                'error': "Invalid cuisine"
            })
        }

        // we need check if all the tags are valid
        const tagDocuments = await db.collection('tags').find({
            name: {
                $in: tags
            }
        }).toArray();

        if (tagDocuments.length !== tags.length) {
            return res.status(401).json({
                'error': "One or more tags is invalid"
            })
        }

        const newRecipe = {
            name,
            cuisine: cuisineDoc,
            prepTime,
            cookTime,
            servings,
            ingredients,
            instructions,
            tags: tagDocuments
        }

        // for updating, we use updateOne, it has two parameters
        // - 1st parameter: critera for updating, or which document do we want to update
        // - 2nd parameter: the new document we want to overwrite the old one
        const result = await db.collection('recipes').updateOne({
            _id: new ObjectId(recipeId)
        }, {
            "$set": newRecipe
        });

        if (result.matchedCount === 0) {
            return res.status(401).json({
                'error': "Recipe not found"
            })
        }

        res.json({
            'message':'Recipe has been updated successfully'
        })
    })

    app.delete('/recipes/:recipeId', async function (req,res){
        const recipeId = req.params.recipeId;

        const result = await db.collection('recipes').deleteOne({
            _id: new ObjectId(recipeId)
        })

        if (result.deletedCount === 0) {
            return res.status(401).json({
                'error':'Unable to find recipe'
            })
        }

        res.json({
            'message':'Recipe has been deleted'
        })
    })
}
main();

// START SERVER
app.listen(3000, function () {
    console.log("server has started");
})