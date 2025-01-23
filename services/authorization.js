const {expressjwt: jwt } = require('express-jwt');  
const jwt2 = require('jsonwebtoken');
const secret = process.env.TOKEN;
const  userQuery = require("../model/users/index");
const adminQuery = require('../model/admin/index');

const roles = require("./roles");

module.exports = authorize
function authorize(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        // authenticate JWT token and attach user to request object (req.auth)
        jwt({ secret: secret, algorithms: ['HS256'], requestProperty: 'auth' }),

        // authorize based on user role
        async (req, res, next) => {
            if (roles.length && !roles.includes(req.auth.roles)) {
                // user's role is not authorized
                return res.status(401).json({ code: 401, status: 'failure', message: 'Unauthorized User' });
            }
            switch (req.auth.roles) {
                case 'User':
                    const userToken = req.header('Authorization').replace('Bearer ', '');
                    const decodedToken = jwt2.verify(userToken, process.env.TOKEN);
                    await userQuery.getUser({
                        _id: decodedToken._id,
                    });
                    break;
                // Add other roles and their respective logic here
            }
            next();
        }
    ];
}