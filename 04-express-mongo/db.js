const { MongoClient, ServerApiVersion} = require("mongodb")

async function connect(uri, dbname) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1
        }
    })
    await client.connect();

    console.log("Connected to the server");

    const db = client.db(dbname);
    return db;
}

// export out the `connect` function so other JavaScript
// files can use
module.exports = {
    connect
}