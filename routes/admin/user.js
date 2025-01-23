const express = require('express');
const router = express.Router();
const userController = require('../../controller/user/user');
const upload = require('../../services/multer');
const authorize = require('../../services/authorization');
const adminAuth = require('../../services/adminAuth');
const roles = require('../../services/roles');

//*********Pages Routes *********************/
router.get('/view-user/:id' , userController?.loadUserProfile);

//*************Authentication related end-points **********************/

router.post('/login' , userController.login);
router.post('/verify-otp' ,userController?.verifyOTP);
router.post('/complete-profile' ,upload.single('image'), userController?.completeProfile);
router.post('/auto-login' , authorize(roles.User) , userController?.autoLogin );
router.post('/resend-otp' , userController?.resendOTP);
router.post('/edit-profile' , upload.single('image'), authorize(roles.User)  ,  userController?.editProfile);
router.delete('/delete-account' , authorize(roles.User) , userController?.deleteAccount);
router.post('/send-verification-email' , authorize(roles.User) , userController?.sendVerifyEmail);
router.get('/verify-email/:id' , userController?.verifyEmail );

router.post('/create-room' , authorize(roles.User) , userController.createPrivateRoom)
router.get('/fetch-room-details/:roomCode' , authorize(roles.User) , userController.fetchRoomCode);

//*********** Profile Related End-points  ****************************/

router.get('/fetch-profile' , authorize(roles.User) , userController?.fetchProfile);
router.post('/user-logout' , authorize(roles.User) , userController?.logOut);

//********* Admin-side User Management Routes ***********/
router.get('/fetch-users' , adminAuth, userController?.userListing);   //Datatable listing
router.get('/view-details/:id' , authorize(roles.Admin) ,  userController?.viewUser);
router.put('/change-status/:id' , authorize(roles.Admin) , userController?.changeStatus);
router.get('/user-login-history/:id' , userController?.userLoginHistoryTable);   //Datatable listing
router.get('/getUsers' , adminAuth, userController?.getUsers);   //Notification Custom Users




module.exports = router;


