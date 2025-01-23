const AdminController = require('./adminController');
const paymentController = require('./paymentController');
const config = require('./../../config');
const Service = require('./../service');

module.exports = {
    dashboard: async(req, res) => {
        let data = {};
        data.user_count = await AdminController.getAllUserCount();
        data.fb_user_count = await AdminController.getAllFBUserCount();
        data.google_user_count = await AdminController.getAllGoogleUserCount();
        data.game_count = await AdminController.getAllGameCount();
        data.most_preferred = await AdminController.mostPreferredAmount();
        data.latest_user = await AdminController.latestUser();
        data.deposit = await AdminController.getDepositCount();
        data.withdrawl = await AdminController.getWithdrawlCount();
        
        res.render('admin/index', {
            title: 'Dashboard',
            type: 'dashboard',
            sub: 'dashboard',
            host: config.pre + req.headers.host,
            admin: req.admin,
            data: data
        });
    },

    users: async(req, res) => {
        const users = await AdminController.getUsersList(10);

        res.render('admin/user', {
            title: 'User List',
            type: 'user',
            sub: 'user',
            host: config.pre + req.headers.host,
            admin: req.admin,
            data: users.list,
            total: users.count
        });
    },

    profile: (req, res) => {
        res.render('admin/profile', {
            title: 'Admin Profile',
            type: 'profile',
            sub: 'profile',
            host: config.pre + req.headers.host,
            admin: req.admin
        });
    },

    login: (req, res) => {
        res.render('admin/login', {
            title: 'Admin Login',
            host: config.pre + req.headers.host,
            year: new Date().getFullYear(),
            project_title: config.project_name
        });
    },

    userDetail: async(req, res) => {
        const user = await AdminController.getUserDetails(req.params.id, req.admin._id);

        res.render('admin/view_user', {
            title: 'User Details',
            type: 'user',
            sub: 'user',
            host: config.pre + req.headers.host,
            admin: req.admin,
            data: user,
            games: []
        });
    },



    maintenance: async(req, res) => {
        let data = {};
        data = await AdminController.getAppVersion();

        res.render('admin/maintenance', {
            title: 'Maintenance',
            type: 'maintenance',
            sub: 'maintenance',
            host: config.pre + req.headers.host,
            admin: req.admin,
            data: data
        });
    },

    referralDetail: async(req, res) => {
        let is_validate = await Service.validateObjectId(req.params.id);

        if (!is_validate) {
            res.redirect('/admin/404');
        } else {
            let data = {};

            data.details = await AdminController.getReferralDetails(req.params.id);
            let name = await AdminController.usernameById(req.params.id);

            res.render('admin/referral_view', {
                title: 'Referral Details:' + ' ' + name,
                type: 'referral',
                sub: 'referral',
                host: config.pre + req.headers.host,
                admin: req.admin,
                data: data
            });
        }
    },

    allTransactions: async(req, res) => {
        const transactions = await paymentController.transactionList(10);
        res.render('admin/transaction', {
            title: 'All transactions',
            type: 'transaction',
            sub: 'all',
            total: transactions.count,
            host: config.pre + req.headers.host,
            admin: req.admin,
            data: transactions.list
        });
    },

    gameRecords: async(req, res) => {
        const allGameRecords = await AdminController.allGameRecords(10);
        console.log("allGameRecords - ",allGameRecords.list)
        res.render('admin/game_records', {
            title: 'Game Records',
            type: 'game',
            sub: 'game',
            host: config.pre + req.headers.host,
            admin: req.admin,
            data: allGameRecords.list,
            total: allGameRecords.total
        });
    },

    withdrawalRequests: async(req, res) => {
        const wr = await AdminController.withdrawalRequest();
        res.render('admin/withdrawal_request', {
            title: 'Withdrawal Request',
            type: 'payout',
            sub: 'withdrawal',
            host: config.pre + req.headers.host,
            admin: req.admin,
            data: wr.list,
            total: wr.total
        });
    },

    withdrawalCompleted: async(req, res) => {
        const completed = await AdminController.withdrawalCompletedRequest();
        res.render('admin/completed_request', {
            title: 'Completed Request',
            type: 'payout',
            sub: 'completed',
            host: config.pre + req.headers.host,
            admin: req.admin,
            data: completed.list,
            total: completed.total
        });
    },

    withdrawalRejected: async(req, res) => {
        const rejected = await AdminController.withdrawalRejectedRequest();
        res.render('admin/rejected_request', {
            title: 'Rejected Request',
            type: 'payout',
            sub: 'rejected',
            host: config.pre + req.headers.host,
            admin: req.admin,
            data: rejected.list,
            total: rejected.total
        });
    },

    pageNotFound: (req, res) => {
        res.render('admin/404', {
            title: '404 Error',
            type: '404',
            sub: '404',
            host: config.pre + req.headers.host,
            admin: req.admin
        });
    },

    Unauthorized: (req, res) => {
        res.render('admin/401', {
            title: '401 Unauthorized!',
            type: '401',
            sub: '401',
            host: config.pre + req.headers.host,
            admin: req.admin
        });
    },

   
};