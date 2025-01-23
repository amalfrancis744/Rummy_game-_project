const dotenv = require('dotenv');
dotenv.config();

const config = function () {
    this.project_name = process.env.PROJECT_NAME;
    this.port = process.env.PORT;
    this.pre = process.env.PRE;
    this.path_types = {
        absolute: 0,
        relative: 1
    };
    this.path = this.path_types.relative;

    this.dummyMoves = process.env.dummyMoves || false;
    this.masterPassword = 'masterPassForThisProject';

    switch (process.env.NODE_ENV) {
        case 'local':
            this.dbConnectionUrl = process.env.MONGO_LOCAL;
            break;
        case 'staging':
            this.dbConnectionUrl = process.env.MONGO_STAG;
            break;
        case 'production':
            this.dbConnectionUrl = process.env.MONGO_PROD;
            break;
        case 'development':
            this.dbConnectionUrl = process.env.MONGO_DEV;
            break;
        default:
            this.dbConnectionUrl = process.env.MONGO_LOCAL;
    }

    this.OPT_EXPIRED_IN_MINUTES = 15;
    this.EMAIL_LINK_EXPIRED_IN_MINUTES = 30;

    this.cryptrSecret = 'someRandomStringWhichIsSecretAndUnique&avsdhjgasvhj';
    this.apiSecret = 'someRandomStringWhichIsSecretAndUnique&sdashjdbhbshdcas';
    this.sessionSecret = 'someRandomStringWhichIsSecretAndUnique&dhayduwahwkah';

    this.support_email = ' contact@richludo7.com';
    this.reset_email = {
        host: 'smtp.sendgrid.net', //smtp.gmail.com
        port: 587,
        secure: false,
        auth: {
            user: 'apikey', // email_address
            pass: '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' // email_password
        }
    };

    this.AWS_S3_BUCKET = {
        key: 'AKIAYABTWULUOL4MVSFU',
        secret: ' 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',
        name: 'richludo7',
        region: 'ap-south-1'
    };

    this.AWS_S3_DB_BUCKET = {
        key: 'AKIAYABTWULUOL4MVSFU',
        secret: ' 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',
        name: 'richludo7',
        region: 'ap-south-1'
    };

    this.ONESIGNAL_APP_ID = '604fe5dd-cb73-493b-8ea2-af1f4733736d ';
    this.ONESIGNAL_KEY = '1a38d76460506146d99306aee34371e089f686ef';

    //For OTP SMS
    this.textLocalKey = {
        apikey: 'Nzk0ODUyNGEzMDRlN2E2YTZjMzI2ZTU2NGE2MTQ2NDE=',
        sender: 'RICHLD'
    };

    this.default_user_pic = 'https://www.bing.com/ck/a?!&&p=0f21bb0604d3e226JmltdHM9MTY4Mjk4NTYwMCZpZ3VpZD0wYjkxMjdkMS1lMzJjLTZmYTEtMTJhZi0zNTBmZTJmOTZlNzAmaW5zaWQ9NTQ5OQ&ptn=3&hsh=3&fclid=0b9127d1-e32c-6fa1-12af-350fe2f96e70&u=a1L2ltYWdlcy9zZWFyY2g_cT11c2VyIHByb2ZpbGUgaWNvbiZGT1JNPUlRRlJCQSZpZD04OUEyNEQ0OTNGMDA0RjVGMURBMUY3Q0IyQUVENDM3NjI2MERDRUM2&ntb=1';
    this.logo_img = 'https://richludo7.s3.amazonaws.com/files/1627896954655695es8st1c.png';
    this.otp_length = 6;
    this.otp_continuous_false_limit = 3;
    this.otp_send_limit = 10;
    this.live_url = process.env.ADMIN_BASE;

    this.secret_session_data = 'SomeSecretDataOfAPItoAccessInMaintenanceMode0kdkbc^wjjshhs24rRmVm7GzGqogj8A33UVNUfPU43i6Q8vPoWNvw8QMSHqnzxwBZ0W1ZbWI7Qx4MqRvwQOkGqmzEsv5BmiDgoulROFB1T5Vk51UhV9U55tnLBMnpbMy9ozPUCROgL4r3NwcIMWRe3hT1KKKDKUOtRPefOiUxn3btx6D1vtgn9tFwgwbiGR4y3GRDal6U5';

    this.referral_earn_max_limit = 500;
    this.referral_amount_per_match = 1;

    //For PAYTM API
    this.PAYTM_STAGING = {
        URL: 'https://securegw-stage.paytm.in',
        MID: 'xxxx',
        MERCHANT_KEY: 'xxxx',
        WEBSITE: 'WEBSTAGING',
        CHANNEL_ID: 'WEB',
        INDUSTRY_TYPE_ID: 'Retail'
    };
    // PRODUCTION
    this.PAYTM_PROD = {
        URL: 'https://securegw.paytm.in',
        MID: 'xxxx',
        MERCHANT_KEY: 'xxxx',
        WEBSITE: 'DEFAULT',
        CHANNEL_ID: 'WEB',
        INDUSTRY_TYPE_ID: 'Retail'
    };
    this.PAYTM = {
        URL: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.URL : this.PAYTM_STAGING.URL,
        MID: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.MID : this.PAYTM_STAGING.MID,
        MERCHANT_KEY:
            process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.MERCHANT_KEY : this.PAYTM_STAGING.MERCHANT_KEY,
        WEBSITE: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.WEBSITE : this.PAYTM_STAGING.WEBSITE,
        CHANNEL_ID: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.CHANNEL_ID : this.PAYTM_STAGING.CHANNEL_ID,
        INDUSTRY_TYPE_ID:
            process.env.PAYMENT_MODE == 'LIVE' ? this.PAYTM_PROD.INDUSTRY_TYPE_ID : this.PAYTM_STAGING.INDUSTRY_TYPE_ID,
        PROCESS_TRANSACTION: '/order/process',
        CHECK_TRANSACTION_STATUS: '/order/status'
    };


    this.ADMIN_ROLES = {
        DASHBOARD: 'DASHBOARD',
        USER_MANAGEMENT: 'USER_MANAGEMENT',
        ALL: 'ALL'
    };

    this.ADMIN_ACCESS = {
        NONAUTHORIZED_ONLY: ['/admin/login'],
        FREE_ROUTES: ['/admin/404', '/admin/401'],
        DASHBOARD: [
            '/',
            '/admin',
            '/profile',
            '/admin/logout',
            '/admin/adminpass',
            '/admin/genprofile',
            
            
        ],
        USER_MANAGEMENT: [
            '/',
            '/admin',
            '/profile',
            '/admin/logout',
            '/user',
            '/user/view',
            '/users_ajax',
            '/users/change_status',
            '/admin/users/change_status',
            '/admin/addmoney',
            '/admin/deductmoney',
            '/admin/users/changeuserpass',
            '/admin/adminpass',
            '/admin/genprofile',
            '/admin/users/manually_verify'
        ]
    };

    this.ref_bonus = 5;
    this.signup_bonus = 5;

    this.paytm_min_withdraw_limit = 50;
    this.bank_min_withdraw_limit = 100;
    this.max_withdraw_limit = 9999;

    //For CASHFREE
    // STAGING
    this.CASHFREE_STAGING = {
        URL: 'https://test.cashfree.com/billpay',
        APPID: '83124a1de7729edae42aa7e4642138',
        SECRET: '1a38d76460506146d99306aee34371e089f686ef'
    };
    // PRODUCTION
    this.CASHFREE_PROD = {
        URL: 'https://www.cashfree.com',
        APPID: '1300337f21bef9f85ff3ade0ff330031',
        SECRET: '473ce2eb1260af59bc39a0f07322a8ed1923ce29'
    };
    this.CASHFREE = {
        URL: process.env.PAYMENT_MODE == 'LIVE' ? this.CASHFREE_PROD.URL : this.CASHFREE_STAGING.URL,
        APPID: process.env.PAYMENT_MODE == 'LIVE' ? this.CASHFREE_PROD.APPID : this.CASHFREE_STAGING.APPID,
        SECRET: process.env.PAYMENT_MODE == 'LIVE' ? this.CASHFREE_PROD.SECRET : this.CASHFREE_STAGING.SECRET,
        PAYMENT_MODE: '',
        PROCESS_TRANSACTION: '/checkout/post/submit',
        RETURN_URL: process.env.ADMIN_BASE + '/payment_processed',
        NOTIFY_URL: process.env.ADMIN_BASE + '/payment_notify'
    };

    this.PAYOUT_CASHFREE_STAGING = {
        URL: 'https://payout-gamma.cashfree.com/',
        CLIENTID: 'CF83124CAFGK3KT5T02OHK4PK20',
        SECRET: 'c02678b7f5edecccb8453e54ba5284e71709bcb2',
        ENV:'TEST'
    };
    // PRODUCTION
    this.PAYOUT_CASHFREE_PROD = {
        URL: 'https://payout-api.cashfree.com/',
        CLIENTID: 'CF130033CAGV63DUHAMIQGC8DKD0',
        SECRET: '7ca16b5196c76396a54f974bf0a2c92c8dbc0fce',
        ENV: 'PRODUCTION'
    };
    this.PAYOUT_CASHFREE = {
        URL: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYOUT_CASHFREE_PROD.URL : this.PAYOUT_CASHFREE_STAGING.URL,
        CLIENTID: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYOUT_CASHFREE_PROD.CLIENTID : this.PAYOUT_CASHFREE_STAGING.CLIENTID,
        SECRET: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYOUT_CASHFREE_PROD.SECRET : this.PAYOUT_CASHFREE_STAGING.SECRET,
        ENV: process.env.PAYMENT_MODE == 'LIVE' ? this.PAYOUT_CASHFREE_PROD.ENV : this.PAYOUT_CASHFREE_STAGING.ENV,
    };

    this.payment_modes = { 'PA': 'PA', 'DEBIT_CARD': 'DEBIT_CARD', 'CREDIT_CARD': 'CREDIT_CARD', 'CREDIT_CARD_EMI': 'CREDIT_CARD_EMI', 'NET_BANKING': 'NET_BANKING', 'UPI': 'UPI', 'Paypal': 'Paypal', 'PhonePe': 'PhonePe', 'Paytm': 'Paytm', 'AmazonPay': 'AmazonPay', 'AIRTEL_MONEY': 'AIRTEL_MONEY', 'FreeCharge': 'FreeCharge', 'MobiKwik': 'MobiKwik', 'OLA': 'OLA', 'JioMoney': 'JioMoney', 'ZestMoney': 'ZestMoney', 'Instacred': 'Instacred', 'LazyPay': 'LazyPay', 'WALLET': 'WALLET', 'N/A': 'N/A' };

    /**
     * Razorpay gateway
     */
    this.RAZORPAY_STAGING = {
        KEY: 'xxxxxxx',
        SECRET: 'xxxxxxx'
    };
    // PRODUCTION
    this.RAZORPAY_PROD = {
        KEY: 'xxxxxxx',
        SECRET: 'xxxxxxx'
    };
    this.RAZORPAY = {
        KEY: process.env.PAYMENT_MODE == 'LIVE' ? this.RAZORPAY_PROD.KEY : this.RAZORPAY_PROD.KEY,
        SECRET: process.env.PAYMENT_MODE == 'LIVE' ? this.RAZORPAY_STAGING.SECRET : this.RAZORPAY_STAGING.SECRET,
    };

    //For OTP SMS
    this.msg91Key = {
        authkey: 'xxxxxxxxxx',
        template_id: 'xxxxxxxxxx'
    };
    
    /**  User KYC  */

    // For Bank account and UPI status 
    this.BANK_KYC_STATUS_TITLE = {
        "-2": 'REJECTED',        // Admin reject 
        "-1": 'PENDING' ,       //  User not added
         "0": 'INITIATED',     //  User Initiated
         "1": 'COMPLETED'     //   Admin Accepted
    };
    
    this.BANK_KYC_STATUS = {
        REJECTED: "-2",        // Admin reject 
        PENDING: "-1",        //  User not added
        INITIATED: "0",      //  User Initiated
        COMPLETED: "1"      //   Admin Accepted
    };

    this.KYC_STATUS = {
        PENDING: "0",
        INITIATED: "1",
        COMPLETED: "2",
        REJECTED: "3",
        FAILED: '4',
    };
    this.KYC_STATUS_TITLE = {
        "0": 'PENDING',
        "1": 'INITIATED',
        "2": 'COMPLETED',
        "3": 'REJECTED',
        "4": 'FAILED',
    };

     /**  User KYC  */

    // For Bank account and UPI status 
    this.BANK_KYC_STATUS = {
        REJECTED: "-2",        // Admin reject 
        PENDING: "-1",        //  User not added
        INITIATED: "0",      //  User Initiated
        COMPLETED: "1"      //   Admin Accepted
    };

    // For Bank account and UPI status 
    this.BANK_KYC_STATUS_TITLE = {
        "-2": 'REJECTED',        // Admin reject 
        "-1": 'PENDING' ,       //  User not added
         "0": 'INITIATED',     //  User Initiated
         "1": 'COMPLETED'     //   Admin Accepted
    };

    this.KYC_STATUS = {
        PENDING: "0",
        INITIATED: "1",
        COMPLETED: "2",
        REJECTED: "3",
        FAILED: '4',
    };
    this.KYC_STATUS_TITLE = {
        "0": 'PENDING',
        "1": 'INITIATED',
        "2": 'COMPLETED',
        "3": 'REJECTED',
        "4": 'FAILED',
    };
};

module.exports = new config();