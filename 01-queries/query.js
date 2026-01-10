// how to show all the databases in the cluster
show databases;

// use database: set a database to be the active one
use sample_airbnb;

// the `db` variable in the shell will refer to the current active database
db

// db.<collection>.find()

// PROJECTION
// - only showing certain keys from the results

// the first parameter: a critera object (filtering critera)
// the second parameter: projection, determines which keys in the documents are fetched
db.listingsAndReviews.find({}, {
    name: 1,  // 1 representing boolean true
    price: 1
});

// projection by specifying what you don't want to show
// show the user documents without the password
// use sample_mflix;
db.users.find({}, {
    password: 0
})

// FILTERING
// find documents by a certain set of critera

// find by a value in a specific key

// find all listings that have exactly 2 beds
db.listingsAndReviews.find({
    beds: 2
}, {
    name: 1,
    beds: 1
})

// find all listings which property type is apartments
// note: the search is case sensitive
db.listingsAndReviews.find({
    property_type: "Apartment"
}, {
    name: 1,
    property_type: 1
})

// Find all properties with 2 beds and are apartments
// if the critera has 2 or more keys, then assume boolean AND
db.listingsAndReviews.find({
    property_type: "Apartment",
    beds: 2
}, {
    name: 1,
    beds: 2,
    property_type: 1
})

db.listingsAndReviews.find({
    minimum_nights: "2",
    room_type: "Private room"
}, {
    name: 1,
    minimum_nights: 1,
    room_type: 1
})

// to find by the key of a nested object, put <object>.<key>
db.listingsAndReviews.find({
    "address.country": "Brazil"
}, {
    name: 1,
    "address.country": 1
})

// find all the listings which review_scores_cleanliness is 9
db.listingsAndReviews.find({
    "review_scores.review_scores_cleanliness": 9
}, {
    name: 1,
    review_scores: 1
})

// searching by a range of values
// we use one of the comparison operators
// $gte => greater or equal
// $gt => greater than
// $lt => lesser than
// $lte => lesser than or equal
// $ne => not equal
// $eq => equal
// find all the listings with at least 2 beds
db.listingsAndReviews.find({
    beds: {
        "$gte": 2
    }
}, {
    name: 1,
    beds: 1
})

// find listings with 2 to 4 beds
db.listingsAndReviews.find({
    beds: {
        "$gte": 2,
        "$lte": 4
    }
}, {
    name: 1,
    beds: 1
})

// find all listings which price is between 100 to 200
db.listingsAndReviews.find({
    price: {
        "$lte": 200,
        "$gte": 100
    }
}, {
    name: 1,
    price: 1
})

// find all listings that has a carbon monooxide detector
// (find by an element in an array)
db.listingsAndReviews.find({
    amenities: "Carbon monoxide detector"
}, {
    name: 1,
    amenities: 1
})

// find by more than one value using boolean OR
// find all listings with mircowave OR oven
db.listingsAndReviews.find({
    amenities: {
        $in: ["Oven", "Microwave"]
    }
}, {
    name: 1,
    amenities: 1
})

// find by more than one value using boolean AND
// find all listings that has both Oven and Mircowave
db.listingsAndReviews.find({
    amenities: {
        $all: ["Oven", "Microwave"]
    }
}, {
    name: 1,
    amenities: 1
})

// 1. using sample_mflix, find all movies directed by Peter Jackson
db.movies.find({
    directors: "Peter Jackson"
}, {
    "title": 1,
    "directors": 1
})
// 2. find all movies which cast either Keanu Reeves or Hugo Weaving
db.movies.find({
    cast: {
        "$in": ["Keanu Reeves", "Hugo Weaving"]
    }
}, {
    title: 1,
    cast: 1
})
// 3. find all movies which cast BOTH Keanu Reeves and Hugo Weaving
db.movies.find({
    cast: {
        "$all": ["Keanu Reeves", "Hugo Weaving"]
    }
}, {
    title: 1,
    cast: 1
})

// Find by a key in an array of object
// find all listings that have been reviewed by Bart
db.listingsAndReviews.find({
    'reviews': {
        '$elemMatch': {
            'reviewer_name': 'Bart'
        }
    }
}, {
    "name": 1,
    "reviews.$": 1  // the $ refers to the first element in the array that matches the critera
})

// Find by an ObjectId
// Find the movie with this _id: 573a1391f29313caabcd6d40
db.movies.find({
    _id: ObjectId("573a1391f29313caabcd6d40")
})

// Find by dates
// When we refer to dates in Mongo (and most databases), we use the ISO date standard
// YYYY-MM-DD
// If we want time: YYYY-MM-DDTHH:MM:SS:mm
// 2025-01-10
// Find all listings that that is first reviewed in 2015 and later
db.listingsAndReviews.find({
    "first_review": {
        "$gte": ISODate("2015-01-01")  // new Date("2015-01-01");
    }
}, {
    name: 1,
    first_review: 1
})

// Match by string patterns with regular expressions
// regular expressions is a set to rule match a string pattern
db.listingsAndReviews.find({
    name: {
        $regex: "loft",  // the string pattern to match
        $options: "i"  // case insensitive
    }
}, {
    name: 1
})

// Boolean OR 
// Find all listings in Brazil or Canada
db.listingsAndReviews.find({
    "$or": [
        {
            "address.country": "Brazil"
        },
        {
            "address.country": "Canada"
        }
    ]
}, {
    name: 1,
    "address.country": 1
})

// AND multiple criteria
db.listingsAndReviews.find({
    "$and": [
        {
            "name": {
                $regex: "loft",  // the string pattern to match
                $options: "i"  // case insensitive
            }

        },
        {
            "address.country": "Brazil"
        }
    ]
})

// Find all listings with the string pattern 'loft' in the name key
// and from either Canada or Brazil
db.listingsAndReviews.find({
    "$and": [
        {
            "name": {
                $regex: "loft",  // the string pattern to match
                $options: "i"  // case insensitive
            }
        },
        {
            "$or":[
                {
                    "address.country":"Brazil"
                },
                {
                    "address.country":"Canada"
                }
            ]
        }
        
    ]
}, {
    name: 1,
    'address.country': 1
})