const jwt = require('jsonwebtoken');
// req - the request
// res - the response
// next - a function, when called, it will automatically
// pass req and res to the next middleware (if any)
// if there is no middleware, next() will pass the req,res to 
// the actual route function
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.sendStatus(401);
    }

    const token  = authHeader.split(" ")[1];
    jwt.verify(token, process.env.TOKEN_SECRET, function(err, data){
        if (err) {
            return res.sendStatus(401);
        }
        // add a new key to req to store the token's data
        req.user = data;
         next();
    })
   
}

module.exports = {
    verifyToken
}