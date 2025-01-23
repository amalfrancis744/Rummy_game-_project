var UserController = require('../api/controller/userController');
var AdminController = require('../api/controller/adminController');
var AdminPagesController = require('../api/controller/adminPagesController');
var paymentController = require('../api/controller/paymentController');

var Service = require('../api/service');
var logger = require('../api/service/logger');
var config = require('../config');
var Table = require('../api/models/table');



module.exports = function(router, io) {
    router.get('/user/view/:id', Service.authenticateAdmin, AdminPagesController.userDetail);

    // router.use(Service.authenticateAdmin);

    // BASIC ROUTES
        // BASIC ROUTES
    router.get('/', Service.authenticateAdmin,AdminPagesController.dashboard);
    router.get('/admin', Service.authenticateAdmin, AdminPagesController.dashboard);
    router.get('/admin/login', AdminPagesController.login);
    router.get('/profile', AdminPagesController.profile);
    router.post('/admin/login', AdminController.login);
    router.post('/admin/genprofile',Service.authenticateAdmin, AdminController.updateAdminProfile);
    router.post('/admin/adminpass', Service.authenticateAdmin,AdminController.updateAdminProfilePass);
    router.get('/admin/logout', AdminController.logout);

    // USER MANAGEMENT
    router.get('/user',Service.authenticateAdmin, AdminPagesController.users);
    router.post('/admin/addmoney',Service.authenticateAdmin, AdminController.addMoneyByAdmin);
    router.post('/admin/users/change_status',Service.authenticateAdmin, UserController.updateStatus);
    router.post('/admin/users/changeuserpass',Service.authenticateAdmin, AdminController.updateUserPassword);
    router.post('/admin/deductmoney',Service.authenticateAdmin, AdminController.deductMoneyByAdmin);
    router.post('/admin/users/manually_verify', Service.authenticateAdmin,AdminController.manuallyVerify);
    router.get('/users_ajax',Service.authenticateAdmin, UserController.getUserListAjax);

    // REFERRAL
    router.get('/referral_ajax', AdminController.getReferralListAjax);
    router.get('/referral/view/:id', AdminPagesController.referralDetail);

    // MAINTENANCE
    router.get('/maintenance',Service.authenticateAdmin, AdminPagesController.maintenance);
    router.post('/admin/change_game_status', AdminController.updateGameMode);

    // PAYMENT TRANSACTIONS
    router.get('/transaction', AdminPagesController.allTransactions);
    router.get('/ajax_transaction', paymentController.getTxnAjax);

    // Game Records
    router.get('/game',Service.authenticateAdmin, AdminPagesController.gameRecords);
    router.get('/game_record_ajax', paymentController.listAllAjaxGameRecode);
    router.post('/generate_report', AdminController.generateReport);


    // PAYOUT MANAGEMENT
    router.get('/withdrawal',Service.authenticateAdmin, AdminPagesController.withdrawalRequests);
    router.get('/withdrawal_ajax', AdminController.withdrawalAjax);
    router.get('/completed', AdminPagesController.withdrawalCompleted);
    router.get('/completed_ajax', AdminController.withdrawalCompletedAjax);
    router.get('/rejected', AdminPagesController.withdrawalRejected);
    router.get('/rejected_ajax', AdminController.withdrawalRejectedAjax);
    router.post('/admin/withdrawal/request', (req, res) => {
        return AdminController.withdrawalRequestProcess(req, res, io);
    });
    router.post('/admin/withdrawal/request_multiple', (req, res) => {
        return AdminController.withdrawalRequestProcessMultiple(req, res, io);
    });
    router.post('/export_withdrawal_request', AdminController.exportWithdrawal);
    router.post('/export_completed_request', AdminController.exportCompleted);

    // GENERIC
    router.get('/admin/404', AdminPagesController.pageNotFound);
    router.get('/admin/401', AdminPagesController.Unauthorized);

    router.get('/admin/find_user', UserController.findUser);


    router.get('/admin/tournament', AdminPagesController.pageNotFound);


    
};