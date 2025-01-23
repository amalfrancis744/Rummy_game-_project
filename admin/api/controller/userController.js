let { User } = require('./../models/user'),
    Table = require('./../models/table'),
    { Transaction } = require('./../models/transaction'),
    { AccessLog } = require('./../models/accessLog'),
    { Default } = require('./../models/default');
let config = require('./../../config'),
    _ = require('lodash'),
    Service = require('./../service'),
    Mailer = require('./../service/email'),
    Sms = require('./../service/sms'),
    localization = require('./../service/localization');
let bcrypt = require('bcryptjs');
let request = require('request');
let Cryptr = require('cryptr');
let cryptr = new Cryptr(config.cryptrSecret);
let logger = require('./../service/logger');
let utility = require('./utilityController');
// var ObjectId = require('mongoose').Types.ObjectId;

let timeago = require('timeago.js');
let randomString = require('random-string');
// var timeagoInstance = timeago();

module.exports = {
    signup: async function (req, res) {
        let startTime = new Date();
        let params = _.pick(
            req.body,
            'name',
            'username',
            'email',
            'mobile_no',
            'password',
            'referral_code',
            'device_id',
            'app_version',
            'facebook_id',
            'onesignal_id',
            'deviceName',
            'deviceModel',
            'os',
            'processorType',
            'systemMemorySize'
        );

        //logger.info("Signup Request:", params);

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (
            _.isEmpty(params.username) ||
            _.isEmpty(params.email) ||
            _.isEmpty(params.mobile_no) ||
            _.isEmpty(params.onesignal_id) ||
            _.isEmpty(params.device_id)
        ) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        let uniqueUserName = await Service.uniqueUserName(params.username);

        if (uniqueUserName.status === false)
            return res.status(200).json(Service.response(0, localization.uniqueUserNameError, null));

        if (params.username.trim().length < 3 || params.username.trim().length > 12)
            return res.status(200).json(Service.response(0, localization.usernameValidationError, null));

        if (!Service.validateEmail(params.email))
            return res.status(200).json(Service.response(0, localization.emailValidationError, null));

        if (isNaN(params.mobile_no) || params.mobile_no.trim().length != 10)
            return res.status(200).json(Service.response(0, localization.mobileValidationError, null));

        //For FB login
        if (params.facebook_id) {
            let fb_us = await User.findOne({
                facebook_id: params.facebook_id
            });

            if (fb_us) {
                let token = await Service.issueToken(params);
                let us_update = await fb_us.updateOne({
                    user_device: {
                        name: params.deviceName || '',
                        model: params.deviceModel || '',
                        os: params.os || '',
                        processor: params.processorType || '',
                        ram: params.systemMemorySize || ''
                    },
                    tokens: [
                        {
                            token: token,
                            access: 'auth'
                        }
                    ]
                });

                var userdata = _.pick(
                    fb_us,
                    'name',
                    'username',
                    'email',
                    'profilepic',
                    'otp_verified',
                    'numeric_id',
                    'email_verified',
                    'main_wallet',
                    'win_wallet',
                    'facebook_id'
                );
                userdata.token = token;
                userdata.referral_code = fb_us.referral.referral_code;
                userdata.mobileno = fb_us.mobile_no.number;

                if (us_update) return res.status(200).json(Service.response(1, localization.loginSuccess, userdata));
                else return res.status(200).json(Service.response(0, localization.ServerError, null));
            }
        } else {
            if (!params.password)
                return res.status(200).json(Service.response(0, localization.missingParamError, null));

            if (params.password.trim().length < 6 || params.password.trim().length > 12)
                return res.status(200).json(Service.response(0, localization.passwordValidationError, null));

            var hash = bcrypt.hashSync(params.password);
        }

        let us = await User.findOne({
            email: params.email.trim()
        });

        if (us) return res.status(200).json(Service.response(0, localization.emailExistError, null));

        us = await User.findOne({
            'mobile_no.number': params.mobile_no
        });

        if (us) return res.status(200).json(Service.response(0, localization.mobileExistError, null));

        let otpGenerate = await Service.generateOtp(params);

        if (!otpGenerate.status) return res.status(200).json(Service.response(0, localization.otpGenerateError, null));

        // SEND MESSAGE OTP HERE
        Sms.sendOtp(params.mobile_no, otpGenerate.otp)
            .then(d => {
                logger.info('OPT Sent', d);
            })
            .catch(e => {
                logger.info('OTP Send Error::', e);
            });

        let token = await Service.issueToken(params);

        if (!params.device_type) {
            params.device_type = 'android';
        }

        if (!params.country_code) {
            params.country_code = '+91';
        }

        let to = {
            access: params.device_type.toLowerCase(),
            token: token
        };

        if (req.files) {
            if (req.files.profile_pic) {
                var aws_img_url;
                aws_img_url = await Service.uploadFile(req.files.profile_pic, ['jpg', 'png', 'jpeg']);
                //logger.info('S3 URL', aws_img_url);
            }
        }

        let r_code;
        if (params.referral_code) {
            r_code = await User.findOne({
                'referral.referral_code': params.referral_code
            });

            if (!r_code) return res.status(200).json(Service.response(0, localization.invalidReferralCodeError, null));

            var referred_by_id = r_code._id;
        }

        let referral_code = await randomString({
            length: 8,
            numeric: true,
            letters: true,
            special: false
        });
        while (true) {
            let ref_user = await User.findOne({
                'referral.referral_code': referral_code
            });

            if (ref_user)
                referral_code = await randomString({
                    length: 8,
                    numeric: true,
                    letters: true,
                    special: false
                });
            else break;
        }

        let maxNumId = await User.find({}, ['numeric_id'])
            .sort({
                numeric_id: -1
            })
            .limit(1);
        let numeric_id;
        if (maxNumId.length == 0) numeric_id = 11111;
        else {
            if (maxNumId[0].numeric_id) numeric_id = maxNumId[0].numeric_id + 1;
            else numeric_id = 11111;
        }

        let newUser = new User({
            name: params.name || params.username,
            username: params.username,
            numeric_id: numeric_id,
            email: params.email,
            facebook_id: params.facebook_id || '',
            created_at: new Date().getTime(),
            profilepic: aws_img_url || config.default_user_pic,
            bonus_wallet:10,
            mobile_no: {
                country_code: params.country_code,
                number: params.mobile_no
            },
            otp: {
                value: otpGenerate.otp,
                expired_at: new Date().getTime() + config.OPT_EXPIRED_IN_MINUTES * 60 * 1000
            },
            referral: {
                referral_code: referral_code,
                referred_by: referred_by_id || ''
            },
            device_id: params.device_id,
            onesignal_id: params.onesignal_id,
            password: hash || '',
            user_device: {
                name: params.deviceName || '',
                model: params.deviceModel || '',
                os: params.os || '',
                processor: params.processorType || '',
                ram: params.systemMemorySize || ''
            },
            tokens: [to]
        });

        if (params.app_version) {
            newUser.app_version = params.app_version;
        }

        let email_token = cryptr.encrypt(newUser.email);

        newUser.email_token.value = email_token;
        newUser.email_token.expired_at = new Date().getTime() + config.EMAIL_LINK_EXPIRED_IN_MINUTES * 60 * 1000;
        console.log("New User Data >>>......",newUser)
        let newUserSave = await newUser.save();
        logger.info('USER SAVED', newUserSave);
        var userdata = _.pick(
            newUserSave,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet',
            'facebook_id',
            'bonus_wallet'
        );
        userdata.token = token;
        userdata.referral_code = newUserSave.referral.referral_code;
        userdata.mobileno = newUserSave.mobile_no.number;

        if (!newUserSave) {
            logger.info('HERE');
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        } else {
            logger.info('THERE');
            let order_id = utility.objectId();
            let newTxn = new Transaction({
                user_id: newUserSave._id,
                txn_amount: 30,
                txn_win_amount: 0,
                txn_main_amount: 30,
                order_id: order_id,
                created_at: new Date().getTime(),
                transaction_type: 'C',
                resp_msg: 'Joining bonus',
                is_status: 'S',
                txn_mode: 'B'
            });

            await newTxn
                .save()
                .then(c => {
                    logger.info('TXN SAVED', c);
                })
                .catch(err => {
                    logger.info('ERROR', err);
                });
        }

        // SEND EMAIL OTP HERE
        let sendMailRes = await Mailer.sendWelcomeEmail(newUserSave);
        logger.info('SEND MAIL RES', sendMailRes);
        // if (sendMailRes) {
        // 	logger.info("Welcome Email Sent");
        // } else {
        // 	logger.info("Welcome Email Error");
        // }

        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'signup');

        return res.status(200).json(Service.response(1, localization.registerSuccess, userdata));
    },

    fblogin: async function (req, res) {
        let startTime = new Date();
        let params = _.pick(
            req.body,
            'facebook_id',
            'device_id',
            'platform',
            'app_version',
            'deviceName',
            'deviceModel',
            'os',
            'processorType',
            'systemMemorySize'
        );

        //logger.info("FB Login Request:", params);

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (
            _.isEmpty(params.facebook_id) ||
            _.isEmpty(params.device_id) ||
            _.isEmpty(params.platform) ||
            _.isEmpty(params.app_version)
        ) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        let flag = false;

        let fb_us = await User.findOne({
            facebook_id: params.facebook_id
        });

        if (fb_us) {
            let token = await Service.issueToken(params);
            let us_update = await fb_us.updateOne({
                user_device: {
                    name: params.deviceName || '',
                    model: params.deviceModel || '',
                    os: params.os || '',
                    processor: params.processorType || '',
                    ram: params.systemMemorySize || ''
                },
                tokens: [
                    {
                        token: token,
                        access: 'auth'
                    }
                ]
            });

            let fblogin_totalWin = await Table.find({
                'players.id': fb_us._id,
                'players.pl': {
                    $gt: 0
                }
            }).countDocuments();

            let fblogin_totalMatch = await Table.find({
                'players.id': fb_us._id
            });

            let userdata = _.pick(
                fb_us,
                'name',
                'username',
                'email',
                'profilepic',
                'otp_verified',
                'numeric_id',
                'email_verified',
                'main_wallet',
                'win_wallet',
                'facebook_id'
            );
            userdata.token = token;
            userdata.referral_code = fb_us.referral.referral_code;
            userdata.mobileno = fb_us.mobile_no.number;
            userdata.total_match = fblogin_totalMatch.length || 0;
            userdata.total_win = fblogin_totalWin || 0;

            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'fblogin');

            if (us_update) return res.status(200).json(Service.response(1, localization.loginSuccess, userdata));
            else return res.status(200).json(Service.response(0, localization.ServerError, null));
        } else {
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'fblogin');

            flag = true;
            //logger.info("User not found");
            return res.status(200).json(Service.response(2, localization.newFbAccountError, null));
        }
    },

    login: async function (req, res) {
        let startTime = new Date();

        let params = _.pick(
            req.body,
            'mobile_no',
            'password',
            'device_id',
            'onesignal_id',
            'deviceName',
            'deviceModel',
            'os',
            'processorType',
            'systemMemorySize'
        );

        //logger.info("Normal Login Request:", params);

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.mobile_no) || _.isEmpty(params.device_id) || _.isEmpty(params.password)) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (isNaN(params.mobile_no) || params.mobile_no.trim().length != 10)
            return res.status(200).json(Service.response(0, localization.mobileValidationError, null));

        let user = await User.findOne({
            'mobile_no.number': params.mobile_no
        });

        if (!user) return res.status(200).json(Service.response(0, localization.invalidCredentials, null));

        let rez1 = await bcrypt.compare(params.password, user.password);

        if (!rez1) return res.status(200).json(Service.response(0, localization.invalidCredentials, null));

        if (!user.is_active) return res.status(200).json(Service.response(0, localization.accountDeactivated, null));

        if (user.is_deleted) return res.status(200).json(Service.response(0, localization.accountDeleted, null));

        // Check if user is already playing
        let alreadyPlaying = await Table.findOne({
            'players.id': user._id,
            game_completed_at: -1,
            $or: [
                {
                    game_started_at: {
                        $exists: false
                    }
                },
                {
                    $and: [
                        {
                            game_started_at: {
                                $exists: true
                            }
                        },
                        {
                            game_started_at: { $ne: -1 }
                        }
                    ]
                }
            ]
        });

        //logger.info("ALREADYPLAING", alreadyPlaying);

        if (alreadyPlaying) return res.status(200).json(Service.response(0, localization.alreadyPlaying, null));

        let token = await Service.issueToken(params);
        let us_update = await user.updateOne({
            onesignal_id: params.onesignal_id || '',
            user_device: {
                name: params.deviceName || '',
                model: params.deviceModel || '',
                os: params.os || '',
                processor: params.processorType || '',
                ram: params.systemMemorySize || ''
            },
            tokens: [
                {
                    token: token,
                    access: 'auth'
                }
            ]
        });

        let totalWin = await Table.find({
            'players.id': user._id,
            'players.pl': {
                $gt: 0
            }
        }).countDocuments();

        let totalMatch = await Table.find({
            'players.id': user._id
        });

        let userdata = _.pick(
            user,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet',
            'facebook_id'
        );
        userdata.token = token;
        userdata.referral_code = user.referral.referral_code;
        userdata.mobileno = user.mobile_no.number;
        userdata.total_match = totalMatch.length || 0;
        userdata.total_win = totalWin || 0;

        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'login');

        if (us_update) {
            //logger.info("Login True");
            return res.status(200).json(Service.response(1, localization.loginSuccess, userdata));
        } else {
            //logger.info("Login False");
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }
    },

    verify_otp: async function (req, res) {
        let startTime = new Date();

        let params = _.pick(req.body, 'otp', 'token', 'numeric_id');

        logger.info('VERIFY OTP REQUEST >> ', params);

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.otp)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        let user = false;

        if (!_.isEmpty(params.token)) {
            user = await User.findOne({
                'tokens.token': params.token
            });
        }

        if (!user) {
            if (!_.isEmpty(params.numeric_id)) {
                user = await User.findOne({ numeric_id: params.numeric_id });
            }
        }

        if (!user) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        // if (user)
        // 	logger.info("User Found with is token");

        if (user.otp.value != params.otp)
            return res.status(200).json(Service.response(0, localization.otpValidationError, null));

        if (user.otp.expired_at < new Date().getTime())
            return res.status(200).json(Service.response(0, localization.otpExpired, null));

        user.otp_verified = true;
        user.otp.value = '';
        user.otp.expired_at = 0;

        let us_update = await user.updateOne({
            otp: {
                value: '',
                expired_at: 0
            },
            otp_verified: true
        });

        // THIS USER EMAIL & OTP BOTH VERIFIED
        // REFERAL BONUS NOT PASSED ALREADY
        // GET REFERRAL USER
        // ADD BONUS IN REFERRAL USER MAIN WALLET
        // MARK AS REFERAL BONUS PASSED

        logger.info('USER', user);

        if (user.email_verified === true && user.otp_verified === true) {
            logger.info('VERIFIED');
            if (!user.ref_bonus_passed) {
                logger.info('NOT PASSED YET');
                // find user >> req.ref_user
                // add bonus in that user

                // let ref_user = await User.findOne({
                //     'ref_user': req.ref_user
                // });

                // if (Service.validateObjectId(user.referral.referred_by)) {
                //     let ref_user = await User.findOne({
                //         _id: user.referral.referred_by
                //     });

                //     logger.info('Ref_User', ref_user);

                //     if (ref_user) {
                //         // ref_user.main_wallet = main_wallet + 5;
                //         let update_ = await User.findByIdAndUpdate(
                //             ref_user._id,
                //             {
                //                 $inc: {
                //                     main_wallet: config.ref_bonus
                //                 }
                //             },
                //             {
                //                 new: true
                //             }
                //         );
                //         logger.info('Referral User', update_.main_wallet);

                //         await User.findByIdAndUpdate(user._id, {
                //             $set: {
                //                 ref_bonus_passed: true,
                //                 'referral.amount': config.ref_bonus
                //             }
                //         });

                //         var order_id = utility.objectId();
                //         var newTxn = new Transaction({
                //             user_id: ref_user._id,
                //             txn_amount: config.ref_bonus,
                //             txn_win_amount: 0,
                //             txn_main_amount: config.ref_bonus,
                //             order_id: order_id,
                //             created_at: new Date().getTime(),
                //             transaction_type: 'C',
                //             resp_msg: 'Referral bonus for ' + user.username,
                //             is_status: 'S',
                //             txn_mode: 'REF'
                //         });

                //         await newTxn
                //             .save()
                //             .then(c => {
                //                 logger.info('TXN SAVED', c);
                //             })
                //             .catch(err => {
                //                 logger.info('ERROR', err);
                //             });
                //     }
                // }
            }
        }

        let userdata = _.pick(
            user,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet'
        );
        userdata.token = params.token;
        userdata.referral_code = user.referral.referral_code;
        userdata.mobileno = user.mobile_no.number;

        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'verify_otp');

        if (!us_update) return res.status(200).json(Service.response(0, localization.ServerError, null));

        //respond with token
        return res.status(200).json(Service.response(1, localization.loginSuccess, userdata));
    },

    sendOtp: async function (req, res) {
        let startTime = new Date();

        //logger.info("Send OTP REQUEST >> ", req.body);

        let otpGenerate = await Service.generateOtp(req.user);

        if (!otpGenerate.status) return res.status(200).json(Service.response(0, localization.otpGenerateError, null));

        //SEND MESSAGE OTP HERE
        Sms.sendOtp(req.user.mobile_no.number, otpGenerate.otp)
            .then(d => {
                logger.info('OPT Sent', d);
            })
            .catch(e => {
                logger.info('OTP Send Error::', e);
            });

        req.user.otp.value = otpGenerate.otp;
        req.user.otp.expired_at = new Date().getTime() + config.OPT_EXPIRED_IN_MINUTES * 60 * 1000;

        try {
            var usSave = await req.user.save();
        } catch (err) {
            //logger.info("Error while user save", err);
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }

        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'sendotp');

        if (!usSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        return res.status(200).json(Service.response(1, localization.OtpSent, null));
    },

    profileUpdate: async function (req, res) {
        //logger.info("Profile Update Request >> ", req.body);

        let params = _.pick(req.body, 'name', 'email', 'push_status');

        if (params.name) {
            req.user.name = params.name;
        }

        if (params.email) {
            if (!Service.validateEmail(params.email))
                return res.status(200).json(Service.response(0, localization.emailValidationError, null));

            let us = await User.findOne({
                email: params.email.trim()
            });

            if (us) return res.status(200).json(Service.response(0, localization.emailExistError, null));

            req.user.email = params.email;
        }

        if (params.push_status) {
            if (params.push_status === 'true') {
                //logger.info("Push Status:", params.push_status);
                req.user.push_enable = true;
            }

            if (params.push_status === 'false') {
                //logger.info("Push Status:", params.push_status);
                req.user.push_enable = false;
            }
        }

        if (req.files) {
            if (req.files.profile_pic) {
                let aws_img_url;
                aws_img_url = await Service.uploadFile(req.files.profile_pic, ['jpg', 'png', 'jpeg']);
                req.user.profilepic = aws_img_url;
                //logger.info('S3 URL', aws_img_url);
            }
        }

        try {
            var usSave = await req.user.save();
        } catch (err) {
            //logger.info("Error while user save", err);
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }

        if (!usSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        let userdata = _.pick(
            req.user,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet'
        );
        userdata.token = req.body.token;
        userdata.referral_code = req.user.referral.referral_code;
        userdata.mobileno = req.user.mobile_no.number;
        return res.status(200).json(Service.response(1, localization.profileUpdateError, userdata));
    },

    updatePassword: async function (req, res) {
        //logger.info("Password Update Request >> ", req.body);

        let params = _.pick(req.body, 'old_password', 'new_password');

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.old_password) || _.isEmpty(params.new_password)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        let rez1 = await bcrypt.compare(params.old_password, req.user.password);

        if (!rez1) return res.status(200).json(Service.response(0, localization.incorrectPassword, null));

        if (params.new_password.trim().length < 6 || params.new_password.trim().length > 12)
            return res.status(200).json(Service.response(0, localization.passwordValidationError, null));

        let hash = bcrypt.hashSync(params.new_password);

        req.user.password = hash;

        let userSave = await req.user.save();

        if (!userSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        return res.status(200).json(Service.response(1, localization.changePasswordSuccess, null));
    },

    passwordReset: async function (req, res) {
        logger.info('Password Reset Request >> ', req.body);

        let params = _.pick(req.body, 'email');

        if (!Service.validateEmail(params.email))
            return res.status(200).json(Service.response(0, localization.emailValidationError, null));

        let us = await User.findOne({
            email: {
                $regex: '^' + params.email + '$',
                $options: 'i'
            }
        });

        if (!us) {
            return res.status(200).json(Service.response(0, localization.emailAccountDoesNotExistError, null));
        }

        if (us.reset_token) {
            if (us.reset_token.expired_at > new Date().getTime()) {
                // Send success, no email
                return res.status(200).json(Service.response(1, localization.resetEmailAlreadySent, null));
            }
        }

        let token = cryptr.encrypt(us._id);

        us.reset_token.value = token;
        us.reset_token.expired_at = new Date().getTime() + config.RESET_EMAIL_EXPIRED_IN_MINUTES * 60 * 1000;

        let usSave = await us.save();

        if (!usSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        let sendMailRes = await Mailer.sendResetEmail(usSave);
        logger.info('SEND MAIL RES', sendMailRes);
        if (sendMailRes) {
            return res.status(200).json(Service.response(1, localization.resetPasswordEmailSent, null));
        } else {
            return res.status(200).json(Service.response(0, localization.resetPasswordEmailError, null));
        }
    },

    pushTest: async function (req, res) {
        let startTime = new Date();

        //logger.info("Test Push Request >> ", req.body);

        let params = _.pick(req.body, 'onesignal_id', 'msg');

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.onesignal_id) || _.isEmpty(params.msg)) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        let message = {
            app_id: config.ONESIGNAL_APP_ID,
            contents: {
                en: params.msg
            },
            data: {
                method: 'message'
            },
            include_player_ids: [params.onesignal_id]
        };

        Service.sendNotification(message)
            .then(data => {
                //logger.info("Push Sent");

                let endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'pushTest');

                return res.status(200).json(Service.response(1, localization.pushSuccess, data));
            })
            .catch(err => {
                //logger.info("Push Error", err);

                let endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'pushTest');

                return res.status(200).json(Service.response(0, localization.pushError, null));
            });
    },

    referralRecords: async function (req, res) {
        let startTime = new Date();

        //logger.info("Referral Records Request >> ", req.body);
        let referrals = [];
        User.find({
            is_deleted: false,
            'referral.referred_by': req.user._id
        })
            .then(data => {
                for (let i = 0; i < data.length; i++) {
                    referrals.push({
                        name: data[i].username,
                        numeric_id: data[i].numeric_id,
                        matches: data[i].referral.matches,
                        amount: data[i].referral.amount
                    });
                }

                let endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'referralRecords');

                //logger.info("REFERRALS", referrals);
                return res.status(200).json(Service.response(1, localization.referralSuccess, referrals));
            })
            .catch(e => {
                let endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'referralRecords');

                return res.status(200).json(Service.response(0, localization.serverError, null));
            });
    },

    //for caching functionality
    autoLogin: async function (req, res) {
        let startTime = new Date();

        //logger.info("Auto Login Request >> ", req.body);

        autologin_totalWin = await Table.find({
            players: {
                $elemMatch: {
                    id: req.user._id,
                    pl: {
                        $gt: 0
                    }
                }
            }
        }).countDocuments();

        autologin_totalMatch = await Table.find({
            'players.id': req.user._id
        });

        let userdata = _.pick(
            req.user,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'bonus_wallet',
            'win_wallet',
            'facebook_id'
        );
        userdata.token = req.body.token;
        userdata.referral_code = req.user.referral.referral_code;
        userdata.mobileno = req.user.mobile_no.number;
        userdata.total_match = autologin_totalMatch.length || 0;
        userdata.total_win = autologin_totalWin || 0;

        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'autoLogin');

        return res.status(200).json(Service.response(1, localization.autologinSuccess, userdata));
    },

    verifyEmail: async function (req, res) {
        //logger.info("Verify Email Request >> ", req.params);

        let params = _.pick(req.params, 'token');

        if (_.isEmpty(params)) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.linkInvalid
            });
        }

        if (_.isEmpty(params.token)) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.linkInvalid
            });
        }

        let user = await User.findOne({
            'email_token.value': params.token
        });

        if (!user) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.linkInvalid
            });
        }

        if (user.email_token.expired_at < new Date().getTime()) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.linkExpired
            });
        }

        user.email_token.value = '';
        user.email_token.expired_at = 0;
        user.email_verified = true;

        // THIS USER EMAIL & OTP BOTH VERIFIED
        // REFERAL BONUS NOT PASSED ALREADY
        // GET REFERRAL USER
        // ADD BONUS IN REFERRAL USER MAIN WALLET
        // MARK AS REFERAL BONUS PASSED

        logger.info('USER', user);

        if (user.email_verified === true && user.otp_verified === true) {
            logger.info('VERIFIED');
            if (!user.ref_bonus_passed) {
                logger.info('NOT PASSED YET');
                // find user >> req.ref_user
                // add bonus in that user

                // let ref_user = await User.findOne({
                //     'ref_user': req.ref_user
                // });

                if (Service.validateObjectId(user.referral.referred_by)) {
                    let ref_user = await User.findOne({
                        _id: user.referral.referred_by
                    });

                    logger.info('Ref_User', ref_user);

                    if (ref_user) {
                        // ref_user.main_wallet = main_wallet + 5;
                        let update_ = await User.findByIdAndUpdate(
                            ref_user._id,
                            {
                                $inc: {
                                    main_wallet: config.ref_bonus
                                }
                            },
                            {
                                new: true
                            }
                        );
                        logger.info('Referral User', update_.main_wallet);

                        await User.findByIdAndUpdate(user._id, {
                            $set: {
                                ref_bonus_passed: true,
                                'referral.amount': config.ref_bonus
                            }
                        });

                        let order_id = utility.objectId();
                        let newTxn = new Transaction({
                            user_id: ref_user._id,
                            txn_amount: config.ref_bonus,
                            txn_win_amount: 0,
                            txn_bonus_amount: 0,
                            txn_main_amount: config.ref_bonus,
                            order_id: order_id,
                            created_at: new Date().getTime(),
                            transaction_type: 'C',
                            resp_msg: 'Referral bonus for ' + user.username,
                            is_status: 'S',
                            txn_mode: 'REF'
                        });

                        await newTxn
                            .save()
                            .then(c => {
                                logger.info('TXN SAVED', c);
                            })
                            .catch(err => {
                                logger.info('ERROR', err);
                            });
                    }
                }
            }
        }

        let saveRez = await user.save();

        if (!saveRez) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.ServerError
            });
        } else {
            return res.render('verify_email.ejs', {
                status: 1,
                title: localization.emailVerificationSuccess,
                msg: localization.emailVerificationSuccessMsg
            });
        }
    },

    resendVerifyEmail: async function (req, res) {
        //logger.info("Resend Email Verification Link Request >> ", req.body);

        let params = _.pick(req.body, 'token', 'email');

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.token) || _.isEmpty(params.email)) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (!Service.validateEmail(params.email))
            return res.status(200).json(Service.response(0, localization.emailValidationError, null));

        let us = await User.findOne({
            email: params.email.trim(),
            _id: {
                $ne: req.user._id
            }
        });

        if (us) return res.status(200).json(Service.response(0, localization.emailExistError, null));

        let email_token = cryptr.encrypt(params.email);
        req.user.email = params.email;
        req.user.email_token.value = email_token;
        req.user.email_token.expired_at = new Date().getTime() + config.EMAIL_LINK_EXPIRED_IN_MINUTES * 60 * 1000;

        let newUserSave = await req.user.save();

        let userdata = _.pick(
            newUserSave,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet'
        );
        userdata.token = req.body.token;
        userdata.referral_code = newUserSave.referral.referral_code;
        userdata.mobileno = newUserSave.mobile_no.number;

        if (!newUserSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        let sendMailRes = await Mailer.sendWelcomeEmail(newUserSave);
        //logger.info("SEND MAIL RES", sendMailRes);
        if (sendMailRes) {
            //logger.info("Welcome Email Sent");
            return res.status(200).json(Service.response(1, localization.emailSentSuccess, null));
        } else {
            //logger.info("Welcome Email Error");
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }
    },

    passwordResetPageRender: async function (req, res) {
        //logger.info("Password Reset Page Render Request >> ", req.params);

        let params = _.pick(req.params, 'token');

        if (_.isEmpty(params)) {
            return res.render('reset_password.ejs', {
                status: 0,
                title: localization.linkInvalid,
                host: config.pre + req.headers.host
            });
        }

        if (_.isEmpty(params.token)) {
            return res.render('reset_password.ejs', {
                status: 0,
                title: localization.linkInvalid,
                host: config.pre + req.headers.host
            });
        }

        let user = await User.findOne({
            'reset_token.value': params.token
        });

        if (!user) {
            return res.render('reset_password.ejs', {
                status: 0,
                title: localization.linkInvalid,
                host: config.pre + req.headers.host
            });
        }

        if (user.reset_token.expired_at < new Date().getTime()) {
            return res.render('reset_password.ejs', {
                status: 0,
                title: localization.linkExpired,
                host: config.pre + req.headers.host
            });
        }
        return res.render('reset_password.ejs', {
            status: 1,
            token: params.token
        });
    },

    passwordResetByWebPage: async function (req, res) {
        //logger.info("Change Password Through Webpage Request >> ", req.body);

        let params = _.pick(req.body, 'pass_confirmation', 'pass', 'token');

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.pass_confirmation) || _.isEmpty(params.pass) || _.isEmpty(params.token)) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (params.pass_confirmation != params.pass) {
            return res.status(200).json(Service.response(0, localization.passwordNotMatchError, null));
        }

        let usr = await User.findOne({
            'reset_token.value': params.token
        });

        if (usr.reset_token.expired_at < new Date().getTime()) {
            return res.status(200).json(Service.response(0, localization.linkExpired, null));
        }

        if (usr) {
            let hash = bcrypt.hashSync(params.pass_confirmation);
            usr.reset_token.value = '';
            usr.reset_token.expired_at = '0';
            usr.password = hash;
            let newUserSave = await usr.save();
            if (newUserSave) return res.status(200).json(Service.response(1, localization.webPassSuccess, null));
            else return res.status(200).json(Service.response(0, localization.ServerError, null));
        } else {
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }
    },

    updateStatus: async function (req, res) {
        let startTime = new Date();

        let params = _.pick(req.body, ['id', 'status']);
        //logger.info("PARAMS", params);
        if (!params) return res.send(Service.response(0, localization.missingParamError, null));

        if (!Service.validateObjectId(params.id)) {
            return res.send(Service.response(0, localization.missingParamError, null));
        }

        let rez = await User.findByIdAndUpdate(params.id, {
            $set: {
                is_active: params.status == 'true'
            }
        });

        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'updateStatus');

        if (rez) {
            let newLog = new AccessLog({
                admin: req.admin._id,
                action: `${params.status == 'true' ? 'Activated' : 'Deacivated'} user's account`,
                user: params.id,
                created_at: new Date().getTime()
            });
            await newLog.save();

            return res.send(Service.response(1, localization.success, null));
        }
        else return res.send(Service.response(0, localization.serverError, null));
    },

    sendSMSTest: function (req, res) {
        logger.info("SMS Test Request >> ", req.body.mobile);
        let otp = 123456;
        let message = `${otp} is your OTP (One Time Password) to verify your user account on Richludo7. Do not share this with anyone.`;
        return new Promise((resolve, reject) => {
            request.post(
                'https://api.textlocal.in/send/',
                {
                    form: {
                        apikey: config.textLocalKey.apikey,
                        numbers: req.body.mobile,
                        message: message,
                        sender: config.textLocalKey.sender
                    }
                },
                function (error, response, body) {
                    if (response.statusCode == 200) {
                        logger.info('Response:', body);
                        let body_obj = JSON.parse(body);
                        if (body_obj.status == 'success') {
                            logger.info('OTP Sent!');
                            return resolve(true);
                        } else {
                            return resolve(false);
                        }
                    } else {
                        logger.info('Server Error', body);
                        return resolve(false);
                    }
                }
            );
        });
    },

    getAppVersion: async function (req, res) {
        let version = await Default.findOne({
            key: 'app_version'
            // whatsapp_no: '',
            // contact_email: ''
        });
        if (version) return res.send(Service.response(1, localization.success, version));
        else return res.send(Service.response(0, localization.ServerError, null));
    },

    getUserListAjax: async (req, res) => {
        let startTime = new Date();

        try {
            const params = req.query;

            //logger.info(params.search.value)

            let obj = {
                is_deleted: false
            };
            if (params.search) {
                if (params.search.value.trim() != '') {
                    obj['$or'] = [
                        {
                            username: {
                                $regex: params.search.value,
                                $options: 'i'
                            }
                        },
                        {
                            'mobile_no.number': {
                                $regex: params.search.value,
                                $options: 'i'
                            }
                        }
                    ];
                }
            }

            let sortObj = {};
            if (params.order) {
                if (params.order[0]) {
                    if (params.order[0].column == '0') {
                        // SORT BY USERNAME
                        sortObj.username = params.order[0].dir == 'asc' ? 1 : -1;
                    } else if (params.order[0].column == '2') {
                        // SORT BY REG DATE
                        sortObj.games_played = params.order[0].dir == 'asc' ? 1 : -1;
                    } else if (params.order[0].column == '3') {
                        // SORT BY REG DATE
                        sortObj.main_wallet = params.order[0].dir == 'asc' ? 1 : -1;
                    } else if (params.order[0].column == '4') {
                        // SORT BY REG DATE
                        sortObj.win_wallet = params.order[0].dir == 'asc' ? 1 : -1;
                    } else if (params.order[0].column == '5') {
                        // SORT BY REG DATE
                        sortObj.created_at = params.order[0].dir == 'asc' ? 1 : -1;
                    } else {
                        sortObj = { created_at: -1 };
                    }
                } else {
                    sortObj = { created_at: -1 };
                }
            } else {
                sortObj = { created_at: -1 };
            }
            //logger.info('Object to Search :: ', obj);

            // let list = await User.find(obj)
            //     .sort(sortObj)
            //     .skip(parseInt(params.start))
            //     .limit(params.length == -1 ? '' : parseInt(params.length));
            let list = await User.aggregate([
                {
                    $match: obj
                }, {
                    $sort: sortObj
                }, {
                    $skip: parseInt(params.start)
                }, {
                    $limit: params.length == -1 ? '' : parseInt(params.length)
                }
            ]).allowDiskUse(true);

            list = await Promise.all(
                list.map(async u => {
                    //logger.info('Found User :: ', u);
                    let gamePlayedCount = await Table.find({
                        'players.id': u._id
                    }).countDocuments();
                    return [
                        u.username,
                        `${u.mobile_no.country_code} ${u.mobile_no.number}`,
                        gamePlayedCount,
                        u.main_wallet,
                        u.win_wallet,
                        u.created_at,
                        `<small class="label bg-${u.email_verified && u.otp_verified ? 'green' : 'red'}">${u.email_verified && u.otp_verified ? 'Verified' : 'Unverified'
                        }</small>`,
                        `<a href="${config.pre + req.headers.host}/user/view/${u._id
                        }" class="on-editing save-row"><i class="fa fa-eye"></i></a>`
                    ];
                })
            );

            let total = await User.find({
                is_deleted: false
            }).countDocuments();
            let total_f = await User.find(obj).countDocuments();

            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'getUserListAjax');
            logger.info('list -- ', list);
            return res.status(200).send({
                data: list,
                draw: new Date().getTime(),
                recordsTotal: total,
                recordsFiltered: total_f
            });
        } catch (err) {
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'getUserListAjax');

            return res.send(Service.response(0, localization.ServerError, err.message));
        }
    },

    findUser: async (req, res) => {
        let startTime = new Date();

        try {
            const params = _.pick(req.query, ['search']);

            let aggregate_obj = [];
            let condition = {
                is_deleted: false
            };
            if (params.search) {
                if (params.search.trim() != '') {
                    condition['username'] = {
                        $regex: '^' + params.search,
                        $options: 'i'
                    };
                }
            }
            aggregate_obj.push({
                $match: condition
            });

            aggregate_obj.push(
                {
                    $sort: {
                        username: 1
                    }
                },
                {
                    $limit: 30
                },
                {
                    $project: {
                        id: '$_id',
                        text: '$username'
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            );

            let users = await User.aggregate(aggregate_obj).allowDiskUse(true);

            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'findUser');

            return res.send({ results: users });
        } catch (err) {
            logger.info('ERR', err);
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'findUser');

            return res.send({ results: [] });
        }
    }
};
