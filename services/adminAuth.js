const jwt = require('jsonwebtoken');
const secret = process.env.TOKEN;
const  queries = require("../model/admin/index");
const adminAuth = async (req, res, next) => {
    console.log("token");
    try {
        const { token } = req.cookies;
        if (!token) {
          return res.status(404).redirect("/");
        }
        const decodedData = jwt.verify(token, process.env.TOKEN);
        req.user = await queries.getAdmin({ _id: decodedData._id });
        
        if (!req.user) {
          return res.redirect("/mgp-rummy/api/admin");
        }
        next();
      } catch (e) {
        console.log(e);
    }
}
module.exports = adminAuth;