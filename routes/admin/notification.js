const express = require("express");
const router = express.Router();
const notificationController = require('../../controller/admin/notification/notification');
const authorize = require('../../services/authorization');
const adminAuth = require('../../services/adminAuth');
const roles = require('../../services/roles');

// ********************Admin-side table management routes *******************************/
router.post('/createNotification' , authorize(roles.Admin) , notificationController?.createNotification);
router.get('/fetch-notification' , adminAuth,  notificationController?.fetchNotification);
router.get('/edit-notification/:id', adminAuth, notificationController?.loadEditNotification);
router.put('/updateNotification' , authorize(roles.Admin) , notificationController?.updateNotification);

//***************User-side Table management functions *******************************/
router.get('/fetch-notification-list', authorize(roles.User), notificationController?.fetchNotificationList);
module.exports = router;