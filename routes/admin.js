const express = require('express');
const router = express.Router();
const profileController = require('../controller/admin/profile/profile');
const adminController = require('../controller/admin/auth/admin');
const authorize = require('../services/authorization');
const authentication = require('../services/adminAuth');
const roles = require('../services/roles');


//*********Pages Routes *********************/
router.get("/", adminController?.loginPage);
router.get('/dashboard' , adminController?.dashboardPage);
router.get('/change-password' , adminController?.loadPassword);
router.get('/profile' , adminController?.loadProfile);
router.get('/edit-profile' , adminController?.loadEditProfile);
router.get('/user-listing' , adminController?.loadUsers);
router.get('/table-management' , adminController?.loadTable);
router.get('/add-table' , adminController?.loadAddTable);
router.get("/notification-management", authentication, adminController?.loadNotification);
router.get("/create-notification", authentication, adminController?.loadCreateNotification);
router.get('/tournament-management' , adminController?.loadTournament);
router.get('/add-tournament' , adminController?.loadAddTournament);
router.get("/kyc-management", authentication, adminController?.loadKyc);
router.get("/user-report-management", authentication, adminController?.loadUserReport);

//******* Authentication Routes *************/
router.post('/register' , adminController?.register);
router.post('/login' , adminController?.login);
router.post('/logout' ,  adminController?.logOut);

//********* Profile Routes ******************/
router.get('/fetchProfile' , authorize(roles.Admin),profileController?.fetchProfile);
router.put('/editProfile' , authorize(roles.Admin) , profileController?.editProfile);
router.put('/changePassword' , authorize(roles.Admin ) , profileController?.changePassword);

module.exports = router;