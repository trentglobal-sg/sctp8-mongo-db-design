// REQUIRES
const express = require('express');
const { connect } = require('./db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const { verifyToken } = require('./middlewares');
const { generateSearchParams, generateRecipe } = require('./gemini');

// read the values from .env
require('dotenv').config();

// SETUP
const app = express();
app.use(express.json()); // tell Express json body in POST, PATCH and PUT requests

function generateAccessToken(id, email) {
    const accessToken = jwt.sign({
        user_id: id,
        email: email
    }, process.env.TOKEN_SECRET, {
        // h = hour, m = minutes, d = days, w = weeks, or just put in an integer and it will be the number
        // seconds
        expiresIn: "1h"
    });
    return accessToken;
}

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

    // Possible search keys in the query string
    // - name: string
    // - minPrepTime: int
    // - maxPrepTime: int
    // - cuisine: string
    // - tags: string (delimited by comma) -- spicy,curry 
    // - ingredients: string (delimited by comma) -- rice,egg
    app.get('/recipes', async function (req, res) {

        const query = req.query;

        const criteria = {};

        // We check if the user has provided any search terms in the query string
        // If there is any, we add them to the criteria
        if (query.minPrepTime) {
            criteria.prepTime = {
                '$gte': parseInt(query.minPrepTime)
            }
        }

        if (query.maxPrepTime) {
            // check if prepTime key exists -- because there's the chance the
            // query string only has maxPrepTime but no minPrepTime
            if (!criteria.prepTime) {
                criteria.prepTime = {};
            }
            criteria.prepTime.$lte = parseInt(query.maxPrepTime);
        }

        if (query.name) {
            criteria.name = {
                $regex: query.name,
                $options: 'i'
            }
        }

        if (query.cuisine) {
            criteria['cuisine.name'] = query.cuisine;
        }

        if (query.tags) {
            criteria['tags.name'] = {
                $in: query.tags.split(',')
            }
        }

        if (query.ingredients) {
            const ingredientArray = query.ingredients.split(',');
            const regularExpressionArray = ingredientArray.map(i => {
                return new RegExp(i, 'i');
            })
            criteria['ingredients.name'] = {
                $all: regularExpressionArray
            }
        }

        console.log(criteria);

        // In mongoshell, to show recipes with just the name, tags and cuisine: 
        // db.recipes.find({},{
        //    name: 1, cuisine: 1, tags: 1
        // })
        const recipes = await db.collection('recipes').find(criteria)
            .project({
                name: 1, cuisine: 1, tags: 1, prepTime: 1
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
    });

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
            'message': 'Recipe has been updated successfully'
        })
    });

    app.delete('/recipes/:recipeId', async function (req, res) {
        const recipeId = req.params.recipeId;

        const result = await db.collection('recipes').deleteOne({
            _id: new ObjectId(recipeId)
        })

        if (result.deletedCount === 0) {
            return res.status(401).json({
                'error': 'Unable to find recipe'
            })
        }

        res.json({
            'message': 'Recipe has been deleted'
        })
    });

    // the body of the POST request
    // - email: the email address of the user
    // - password: the password of the user
    app.post('/users', async function (req, res) {
        const email = req.body.email;
        const password = req.body.password;

        // enforce that all users have an unique email address
        const user = await db.collection('users').findOne({
            email: email
        });
        if (user) {
            return res.status(400).json({
                'error': "The email already exists"
            })
        }

        const result = db.collection('users').insertOne({
            "email": email,
            "password": await bcrypt.hash(password, 12)
        });

        res.json({
            'message': 'New account has been created',
            'newUserId': result.insertedId
        })
    });

    // login route
    // the content of req.body should have
    // - password: the password of the user to login
    // - email: the email of the user to login
    app.post('/login', async function (req, res) {
        const email = req.body.email;
        const password = req.body.password;
        const user = await db.collection('users').findOne({
            email: email
        });
        if (user) {
            // check if the password is valid
            // compare() takes in two argument
            // 1st parameter - the plain password (i.e before hasing)
            // 2nd parameter - the hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
                res.json({
                    'jwt': generateAccessToken(user._id, user.email)
                })
            } else {
                res.status(401).json({
                    'error': 'Invalid login'
                })
            }
        } else {
            res.status(401).json({
                'error': 'Invalid Login'
            })
        }
    })

    // app.post('/v2/login', async function (req, res) {
    //     const email = req.body.email;
    //     const password = req.body.password;
    //     const user = await db.collection('users').findOne({
    //         email: email
    //     });

    //     // check if the password is valid
    //     // compare() takes in two argument
    //     // 1st parameter - the plain password (i.e before hasing)
    //     // 2nd parameter - the hashed password
    //     const isPasswordValid = await bcrypt.compare(password, user != null ? user.password : "rotiprata12345");
    //     if (isPasswordValid) {
    //         // generate JWT
    //         res.json({
    //             'jwt': "JWT goes here"
    //         })
    //     } else {
    //         // generate dummy jwt
    //         res.status(401).json({
    //             'error': 'Invalid login'
    //         })
    //     }

    // })

    app.get('/protected', verifyToken, function (req, res) {

        // write the code to check if the JWT is in the headers

        res.json({
            'message': "this route is protected"
        })
    })

    app.get('/ai/recipes', async function (req, res) {
        const query = req.query.q;
        const allCuisines = await db.collection('cuisines').distinct('name');
        const allTags = await db.collection('tags').distinct('name');
        const allIngredients = await db.collection('ingredients').distinct('name');

        const searchParams = await generateSearchParams(query, allTags, allCuisines, allIngredients);
        const criteria = {};

        // if (query.name) {
        //     criteria.name = {
        //         $regex: query.name,
        //         $options: 'i'
        //     }
        // }

        if (searchParams.cuisines && searchParams.cuisines.length > 0) {
            criteria["cuisines.name"] = {
                $in: searchParams.cuisines
            }
        }

        if (searchParams.ingredients && searchParams.ingredients.length > 0) {
            criteria["ingredients.name"] = {
                "$in": searchParams.ingredients
            }
        }

        if (searchParams.tags && searchParams.tags.length > 0) {
            criteria["tags.name"] = {
                $all: searchParams.tags
            }
        }

        const recipes = await db.collection('recipes').find(criteria).toArray();

        res.json(recipes);
    })

    app.post('/ai/recipes', async function (req, res) {
        const query = req.body.query;
        const allCuisines = await db.collection('cuisines').distinct('name');
        const allTags = await db.collection('tags').distinct('name');

        const newRecipe = await generateRecipe(query, allCuisines, allTags);

        const cuisineDoc = await db.collection('cuisines').findOne({
            'name': newRecipe.cuisine
        })

        if (cuisineDoc) {
            newRecipe.cuisine = cuisineDoc
        } else {
            return res.status(401).json({
                'error': "AI used a cuisine that does not exist"
            })
        }

        const tagDocs = await db.collection('tags').find({
            'name': {
                "$in": newRecipe.tags
            }
        }).toArray();

        if (tagDocs.length == newRecipe.tags.length) {
            newRecipe.tags = tagDocs;
        } else {
            return res.status(401).json({
                'error': "AI used a tag that does not exist",
                'tried_tags': newRecipe.tags
            })
        }

        const result = await db.collection("recipes").insertOne(newRecipe);
        res.json({
            recipeId: result.insertedId
        })

    })

}
main();

// START SERVER
app.listen(3000, function () {
    console.log("server has started");
})