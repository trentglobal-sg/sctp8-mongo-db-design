// find all recipes where the prepTime is 15 or greater
db.recipes.find({
    "prepTime": {
        "$gte": 15
    }
})

db.recipes.find({
    'name':'spaghetti'
})

db.recipes.find({
    'cuisine.name': 'Italian'
}, {
    'name': 1,
    'cuisine.name': 1
})