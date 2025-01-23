const queries = require("../../../model/admin/index");
const response = require("../../../services/response");
const commonService = require("../../../services/common");
const config = require("../../../config/index");
const validator = require("validator");
const bcryptService = require("../../../services/bcrypt");
const jwt = require("jsonwebtoken");
const adminModule = require("../../../model/admin/admin");

module.exports = {
  //***********************Pages*****************************/

  //Login Page
  loginPage: async (req, res) => {
    return res.render("pages/auth/login");
  },

  //Login Page
  dashboardPage: async (req, res) => {
    try {
      // let count = await userQuery.countingDocuments();
      let count = 10;
      let data = {
        count,
        token: req.cookies.token,
        url: process.env.URL,
        adminProfile: "",
      };

      commonService.redirecting(req, res, "pages/dashboard/dashboard", data);
    } catch (error) {
      console.log("Something went wrong" + error);
    }
  },

  //Load View Profile Page
  loadProfile: async (req, res) => {
    try {
      let data = {
        adminProfile: "",
        url: process.env.URL,
        token: req.cookies.token,
      };
      commonService.redirecting(req, res, "pages/profile/adminProfile", data);
    } catch (error) {
      console.log("Something went wrong" + error);
    }
  },

  //Load Change Password Page
  loadPassword: async (req, res) => {
    try {
      let data = {
        url: process.env.URL,
        adminProfile: "",
        token: req.cookies.token,
      };
      commonService.redirecting(req, res, "pages/profile/changePassword", data);
    } catch (error) {
      console.log("Something went wrong" + error);
    }
  },

  //Load Edit Admin Profile Page
  loadEditProfile: async (req, res) => {
    try {
      let data = {
        url: process.env.URL,
        adminProfile: "",
        token: req.cookies.token,
      };
      console.log("---------------",data)
      commonService.redirecting(req, res, "pages/profile/editProfile", data);
    } catch (error) {
      console.log("Something went wrong" + error);
    }
  },
  
  //User-Management Page
  loadUsers : async ( req , res ) => {
    let data ={
      url : process.env.URL,
      adminProfile : '',
      token: req.cookies.token,
    }
    commonService.redirecting(req, res , 'pages/userManagement/userTable' , data )
  },

  //load Table-Management
  loadTable : async ( req , res ) => {
    let data ={
      url : process.env.URL,
      adminProfile : '',

    }
    commonService.redirecting( req, res ,'pages/tableManagement/table' , data)
  },
  //Load Add Table Page
  loadAddTable : async ( req,res) => {
    let data ={
      url : process.env.URL,
      adminProfile : '',
      token: req.cookies.token,

    }
    commonService.redirecting( req, res , 'pages/tableManagement/addTable' , data)
  },
  //Load Notification Page
  loadNotification : async ( req,res) => {
    let data ={
      url : process.env.URL,
      adminProfile : '',
      token: req.cookies.token,

    }
    commonService.redirecting( req, res , 'pages/notificationManagement/notification' , data)
  },
  //Load Create Notification Page
  loadCreateNotification : async ( req,res) => {
    let data ={
      url : process.env.URL,
      adminProfile : '',
      token: req.cookies.token,

    }
    commonService.redirecting( req, res , 'pages/notificationManagement/createNotification' , data)
  },
  //load Tournament-Management 
  loadTournament : async ( req , res ) => {
    let data ={
      url : process.env.URL,
      adminProfile : '',

    }
    commonService.redirecting( req, res ,'pages/tournamentManagement/tournament' , data)
  },
  //Load Add Tournament Page
  loadAddTournament : async ( req,res) => {
    let data ={
      url : process.env.URL,
      adminProfile : '',
      token: req.cookies.token,

    }
    commonService.redirecting( req, res , 'pages/tournamentManagement/addTournament' , data)
  },
  loadKyc : async ( req,res) => {
    let data ={
      url : process.env.URL,
      adminProfile : '',
      token: req.cookies.token,

    }
    commonService.redirecting( req, res , 'pages/kycManagement/kyc' , data)
  },
  loadUserReport : async ( req,res) => {
    let data ={
      url : process.env.URL,
      adminProfile : '',
      token: req.cookies.token,

    }
    commonService.redirecting( req, res , 'pages/userReportManagement/cheatingReport' , data)
  },
  //***********************Admin Authentication Module Functions*****************************/

  //Admin Signup
  register: async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName)
      return await response.errorResponse(res, 401, " Enter your First name.");

    if (!lastName)
      return await response.errorResponse(res, 401, " Enter your Last name.");

    if (!email || !validator.isEmail(email))
      return await response.errorResponse(
        res,
        401,
        " Enter a valid Email address."
      );

    if (!password || password.length < config?.passMinLength)
      return await response.errorResponse(
        res,
        400,
        "Please enter a password with a length of 6."
      );

    try {
      let adminExist = await queries.getAdmin({
        emailAddress: email.toLowerCase(),
      });

      if (adminExist)
        return await response.errorResponse(
          res,
          401,
          "A User already exists with this Email address."
        );

      let encryptPassword = await bcryptService.hashPass(password, 10);
      let data = {
        firstName: firstName,
        password: encryptPassword,
        lastName: lastName,
        emailAddress: email.toLowerCase(),
        profilePic: "default.jpg",
      };
      let creatingUser = await queries.saveAdmin(data);
      return response.successResponse(res, 200, "Successfully Registered.", {
        _id: creatingUser?._id,
        firstName: creatingUser?.firstName,
        lastName: creatingUser?.lastName,
        emailAddress: creatingUser?.emailAddress,
        password: creatingUser?.password,
        profilePic: `${process.env.URL}/assets/uploads/${creatingUser?.profilePic}`,
      });
    } catch (err) {
      console.log("Register Error occured", err?.message);
      return await response.errorResponse(res, 400, err?.message);
    }
  },
  //Login
  login: async (req, res) => {
    const { email, password } = req.body;

    console.log("Request" , req.body)
    if (!email && !password) {
      req.flash("danger", "Please fill the required fields");
      return res.redirect("/mgp-rummy/api/admin");
    }
    // return res.status(200).send({
    //     code : 401 ,
    //     status :'failure' ,
    //     message : "Please fill the Required fields"
    // });

    if (!email || !validator.isEmail(email)) {
      req.flash("danger", "Please Fill the Valid Email.");
      return res.redirect("/mgp-rummy/api/admin");
    }
    // return res.status(200).send({
    //     code : 401 ,
    //     status :'failure' ,
    //     message : "Please fill the Valid Email address"
    //   });

    if (!password) {
      req.flash("danger", "Please Fill the Password");
      return res.redirect("/mgp-rummy/api/admin");
    }
    // return res.status(200).send({
    //     code : 401 ,
    //     status :'failure' ,
    //     message : "Enter your Password first"
    //   });

    try {
      let adminExist = await queries.getAdmin({
        emailAddress: email.toLowerCase(),
      });

      if (!adminExist) {
        req.flash("danger", "Invalid Admin");
        return res.redirect("/mgp-rummy/api/admin");
      }
      // return res.status(200).send({
      //     code : 400 ,
      //     status :'failure' ,
      //     message : "Invalid User"
      //   });

      let comparingPassword = await bcryptService.comparePass(
        password,
        adminExist?.password
      );

      if (comparingPassword !== true) {
        req.flash("danger", "Incorrect Password");
        return res.redirect("/mgp-rummy/api/admin");
      }
      // return res.status(200).send({
      //     code : 400 ,
      //     status :'failure' ,
      //     message : "Password Mismatched"
      //   });

      const token = jwt.sign(
        {
          _id: adminExist._id,
          emailAddress: adminExist?.emailAddress,
          firstName: adminExist?.firstName,
          lastName: adminExist?.lastName,
          roles: "Admin",
        },
        process.env.TOKEN
      );

      let date = new Date();

      await adminModule.findOneAndUpdate(
        { _id: adminExist?._id },
        { $set: { token: token, lastLoginAt: date } }
      );
      return res.status(200).cookie("token", token).redirect("/mgp-rummy/api/admin/dashboard");
      // return await response.successResponse( res , 200 , "Logged-In Successfully" , {
      //     user : {
      //         _id : adminExist?._id,
      //         firstName : adminExist?.firstName,
      //         lastName : adminExist?.lastName,
      //         emailAddress : adminExist?.emailAddress,
      //         profilePic : `${process.env.URL}/assets/uploads/${adminExist?.profilePic}`,
      //         lastLoginAt : date
      //     },
      //     token : token
      // } )
    } catch (err) {
      console.log("Login Error occurred :", err);
      return await response.errorResponse(res, 400, err?.message);
    }
  },
  logOut : async ( req , res ) => {
    try{
        let adminExists = await queries.getAdmin({token : req.cookies.token});
        console.log("adminExists",adminExists)
        let data = {
          token : '',
          lastLoginAt : new Date()
        }
        await queries.updateAdmin(adminExists._id , data);
        // return res.status(200).send({code:200 , status:'success'});
        res.status(200).clearCookie("token","").redirect('/');
      }catch(err){
        console.log("something went wrong", err)
      }
  },
};
