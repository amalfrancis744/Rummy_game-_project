const express = require("express");

const asyncHandler = require("../util/async-handler");
const router = express.Router();

const rummyRoomCacheService = require("../services/rummy-room-cache-service");
const adminController = require('../controller/admin/admin');
const authorize = require('../services/authorization');
const roles = require('../services/roles');
// const AdminPagesController = require("../admin/controller/adminPagesController");
const Service = require("../admin/api/service");

// router.use(Service.authenticateAdmin);

// router.get(
//   "/debug",
//   asyncHandler(async () => {
//     return rummyRoomCacheService.debugGameData();
//   })
// );
// router.get(
//   "/user/view/:id",
//   Service.authenticateAdmin,
//   AdminPagesController.userDetail
// );

// router.use(Service.authenticateAdmin);

// // BASIC ROUTES
// router.get(
//   "/dashboard",
//   asyncHandler(async () => {
//     return AdminPagesController.dashboard;
//   })
// );



// router.get("/admin", AdminPagesController.dashboard);
// router.get("/admin/login", AdminPagesController.login);
// router.get("/profile", AdminPagesController.profile);


//*********************Updated on 19th july by Ayush********************* */


module.exports = router;
