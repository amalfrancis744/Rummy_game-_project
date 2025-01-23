let SuperAdmin = require('./../models/superAdmin'),
    Service = require('./../service'),
    config = require('./../../config'),
    { User } = require('./../models/user'),
    { AccessLog } = require('./../models/accessLog'),
    Table = require('./../models/table'),
    Admin = require('./../models/superAdmin'),
    _ = require('lodash'),
    localization = require('./../service/localization');

let ObjectId = require('mongoose').Types.ObjectId;
let Mailer = require('./../service/email');
let moment = require('moment-timezone');
let logger = require('./../service/logger');
let bcrypt = require('bcryptjs');
let { WithdrawalRequest } = require('./../models/WithdrawalRequest');
let randomString = require('random-string');
let { Transaction } = require('./../models/transaction');

let { Default } = require('./../models/default');
const { Parser } = require('json2csv');
const payOut = require('./payOut');
let utility = require('./utilityController');
const uniqid = require('uniqid');

const PAYTM = require('./../service/paytm/index');

module.exports = {
    login: async function (req, res) {
        let params = _.pick(req.body, 'email', 'password');

        //logger.info('ADMIN LOGIN REQUEST >> ', params);

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamErrorAdmin, null));
        }

        if (_.isEmpty(params.email) || _.isEmpty(params.password)) {
            return res.status(200).json(Service.response(0, localization.missingParamErrorAdmin, null));
        }

        let user = await SuperAdmin.findOne({
            email: params.email,
        });

        if (!user) return res.status(200).json(Service.response(0, localization.invalidCredentials, null));

        let rez1 = await bcrypt.compare(params.password, user.password);

        if (!rez1) return res.status(200).json(Service.response(0, localization.invalidCredentials, null));

        if (!user.is_active) return res.status(200).json(Service.response(0, localization.accountDeactivated, null));

        if (user.is_deleted) return res.status(200).json(Service.response(0, localization.accountDeleted, null));

        let token = await Service.issueToken(params);

        req.session.auth = token;
        req.session.auth.max;
        Age = 36000000;

        user.tokens = [];
        user.tokens.push({
            access: 'auth',
            token: token,
        });

        let rez = await user.save();

        if (!rez) return res.status(200).json(Service.response(0, localization.ServerError, null));

        // ADD ACCESS LOG
        let newLog = new AccessLog({
            admin: user._id,
            action: 'Logged into Admin panel',
            created_at: new Date().getTime(),
        });
        await newLog.save();

        return res.status(200).json(Service.response(1, localization.loginSuccess, token));
    },

    logout: async (req, res) => {
        try {
            if (req.admin) {
                if (Service.validateObjectId(req.admin._id)) {
                    let newLog = new AccessLog({
                        admin: req.admin._id,
                        action: 'Logged out from Admin panel',
                        created_at: new Date().getTime(),
                    });
                    await newLog.save();
                }
            }

            req.session = null;
            return res.send(Service.response(1, localization.success, null));
        } catch (err) {
            console.log('ERR', err);
            return res.send(Service.response(0, localization.serverError, err));
        }
    },

    withdrawalRequest: async () => {
        const wr = await WithdrawalRequest.find({
            is_status: 'P',
        })
            .populate('user_id')
            .sort({
                created_at: -1,
            })
            .limit(10);

        const list = await Promise.all(
            wr.map(async (w) => {
                return {
                    id: w._id,
                    username: w.user_id.username,
                    user_id: w.user_id._id,
                    amount: w.amount,
                    created_at: w.created_at, //await Service.formateDate(parseInt(w.created_at)),
                    completed_at: w.completed_at, //await Service.formateDate(parseInt(w.completed_at)),
                    payment_method: _.capitalize(w.payment_type),
                    acc_no: w.account_no || '',
                    bank_name: w.bank_name || '',
                    ifsc: w.ifsc_code || '',
                    acc_name: w.account_name || '',
                    mobile: w.mobile_no || '',
                    upi_id: w.upi_id || '',
                };
            })
        );

        let total = await WithdrawalRequest.find({
            is_status: 'P',
        }).countDocuments();

        return {
            list,
            total,
        };
    },

    //Get User List
    getUsersList: async (limit) => {
        //logger.info('ADMIN USER LIST REQUEST >> ');
        const users = await User.find({
            is_deleted: false,
        })
            .sort({
                created_at: -1,
            })
            .limit(limit);
        const list = await Promise.all(
            users.map(async (u) => {
                let gamePlayedCount = await Table.countDocuments({
                    'players.id': u._id,
                });
                return {
                    id: u._id,
                    username: u.username,
                    mobile: `${u.mobile_no.country_code} ${u.mobile_no.number}`,
                    game_played: gamePlayedCount,
                    wallet: u.main_wallet,
                    win: u.win_wallet,
                    is_active: u.is_active,
                    email_verified: u.email_verified,
                    otp_verified: u.otp_verified,
                    created_at: u.created_at,
                };
            })
        );

        let count = await User.find({
            is_deleted: false,
        }).countDocuments();

        return {
            list,
            count,
        };
    },

    getUserListAjax: async () => { },

    //Get User Details
    getUserDetails: async (id, admin_id) => {
        //logger.info('Admin Request for USER DETAILS ::', id)
        let u = await User.findById(id);
        let gameData = await Table.find(
            {
                'players.id': id,
                'game_completed_at': { $ne: '-1' } //Added changes for 
            },
            {
                room: 1,
                room_fee: 1,
                no_of_players: 1,
                created_at: 1,
                'players.$': 1,
            }
        ).sort({
            created_at: -1,
        });
        //logger.info("Game Records::", gameData);

        let gameDataModify = await Promise.all(
            gameData.map(async (k) => {
                return {
                    no_of_players: k.no_of_players,
                    room_fee: k.room_fee,
                    room: k.room,
                    created_at: k.created_at, //await Service.formateDateandTime(parseInt(k.created_at)),
                    players: k.players,
                };
            })
        );

        let userReferredCount = await User.countDocuments({
            'referral.referred_by': u._id,
            is_deleted: false,
        });

        let completedRequest = await WithdrawalRequest.find({
            user_id: id,
            is_status: 'A',
        }).sort({
            created_at: -1,
        });

        let completedDeposite = await Transaction.find({
            user_id: id,
            transaction_type: 'C',
            is_status: 'S',
        }).sort({
            created_at: -1,
        });

        let completedRequestModify = await Promise.all(
            completedRequest.map(async (k) => {
                return {
                    amount: k.amount,
                    mode: k.payment_type,
                    date: k.created_at,
                };
            })
        );

        // let total_withdraw = await WithdrawalRequest.aggregate([
        //     {
        //         $match: {
        //             user_id: ObjectId(id),
        //             is_status: 'A'
        //         }
        //     },
        //     {
        //         $group:{
        //             _id:null,
        //             count:{$sum:'$amount'}
        //         }
        //     }
        // ]);

        // logger.info('total_with', total_withdraw);

        let completedDepositeModify = await Promise.all(
            completedDeposite.map(async (z) => {
                return {
                    amount: z.txn_amount,
                    mode: z.txn_mode,
                    date: z.created_at,
                };
            })
        );

        let newLog = new AccessLog({
            admin: admin_id,
            action: 'Viewed user profile in panel',
            user: u._id,
            created_at: new Date().getTime(),
        });
        await newLog.save();

        let list = {
            id: u._id,
            username: u.username,
            profilepic: u.profilepic,
            name: _.capitalize(u.name),
            numeric_id: u.numeric_id,
            email: u.email,
            wallet: u.main_wallet,
            win: u.win_wallet,
            bonus: u.bonus_wallet,
            mobile: u.mobile_no.country_code + u.mobile_no.number,
            is_active: u.is_active,
            referred_users: userReferredCount,
            email_verified: u.email_verified,
            otp_verified: u.otp_verified,
            game_data: gameDataModify,
            device_name: u.user_device.name,
            device_id: u.device_id,
            device_model: u.user_device.model,
            device_os: u.user_device.os,
            device_ram: u.user_device.ram,
            device_processor: u.user_device.processor,
            withdrawlCompleted: completedRequestModify,
            completedDeposite: completedDepositeModify,
        };

        return list;
    },

    //Get Count Of All User
    getAllUserCount: async () => {
        //logger.info('ADMIN USER Count REQUEST >> ');
        let c = await User.countDocuments({
            is_deleted: false,
        });
        return c;
    },

    //Get Count Of FB User
    getAllFBUserCount: async () => {
        //logger.info('ADMIN FB USER Count REQUEST >> ');
        let c = await User.countDocuments({
            is_deleted: false,
            facebook_id: {
                $ne: '',
            },
        });
        return c;
    },

    getAllGoogleUserCount: async () => {

        let c = await User.countDocuments({
            is_deleted: false,
            google_id: {
                $ne: '',
            },
        });
        return c;
    },

    //Get Count Of Total Game
    getAllGameCount: async () => {
        //logger.info('ADMIN Total Game Count REQUEST >> ');
        let c = await Table.countDocuments({
            $expr: {
                $eq: ['$no_of_players', { $size: '$players' }],
            },
        });
        return c;
    },
    getAllGameCount: async () => {
        //logger.info('ADMIN Total Game Count REQUEST >> ');
        let c = await Table.countDocuments({
            $expr: {
                $eq: ['$no_of_players', { $size: '$players' }],
            },
        });
        return c;
    },

    //MOST PREFERRED AMOUNT
    mostPreferredAmount: async () => {
        //logger.info('MOST PREFERRED AMOUNT REQUEST >> ');

        let data = await Table.aggregate([
            {
                $group: {
                    _id: '$room_fee',
                    count: {
                        $sum: 1,
                    },
                },
            },
        ])
            .sort({
                count: -1,
            })
            .allowDiskUse(true);

        console.log('preferred amount', data)
        return data.length > 0 ? data[0]._id : 0;
    },

    //Latest User 8
    latestUser: async () => {
        //logger.info('Latest Users REQUEST >> ');

        let d = await User.find({
            is_deleted: false,
        })
            .sort({
                _id: -1,
            })
            .limit(8);

        let userdata = await Promise.all(
            d.map(async (k) => {
                return {
                    username: k.username,
                    id: k._id,
                    profilepic: k.profilepic,
                    created_at: k.created_at, //await Service.formateDateandTime(parseInt(k.created_at))
                };
            })
        );

        return userdata;
    },


    //Get Count Of Total Deposit
    getDepositCount: async () => {
        let depo = await Transaction.aggregate([
            {
                $match: {
                    txn_mode: 'P',
                    is_status: 'S',
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$txn_amount' },
                },
            },
        ]);
        return depo.length > 0 ? depo[0].total || 0 : 0;

        // var data = await Transaction.aggregate([
        //     {
        //         $match: {
        //             transaction_type: 'C',
        //             is_status: 'S'
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: null,
        //             sum: {
        //                 $sum: '$txn_amount'
        //             }
        //         }
        //     }
        // ]).allowDiskUse(true);

        // if (data.length > 0) return data[0].sum;
        // else return 0;
    },

    //Get Count Of Total WITHDRAWAL
    getWithdrawlCount: async () => {
        let data = await WithdrawalRequest.aggregate([
            {
                $match: {
                    is_status: 'A',
                },
            },
            {
                $group: {
                    _id: null,
                    sum: {
                        $sum: '$amount',
                    },
                },
            },
        ]).allowDiskUse(true);

        if (data.length > 0) return data[0].sum;
        else return 0;
    },


    getReferralListAjax: async (req, res) => {
        let startTime = new Date();

        try {
            const params = req.query;
            console.log('AJAX REFERRAL', params);

            let matchObj = {
                _id: {
                    $ne: '',
                },
            };
            if (params.search) {
                if (params.search.value.trim() != '') {
                    matchObj['referrar.username'] = {
                        $regex: params.search.value,
                        $options: 'i',
                    };
                }
            }

            let sortObj = {};
            if (params.order) {
                if (params.order[0]) {
                    if (params.order[0].column == '0') {
                        // SORT BY USERNAME
                        sortObj['referrar.username'] = params.order[0].dir == 'asc' ? 1 : -1;
                    } else if (params.order[0].column == '1') {
                        // SORT BY REG DATE
                        sortObj.ref = params.order[0].dir == 'asc' ? 1 : -1;
                    } else if (params.order[0].column == '2') {
                        // SORT BY REG DATE
                        sortObj.amount = params.order[0].dir == 'asc' ? 1 : -1;
                    } else {
                        sortObj = { ref: -1 };
                    }
                } else {
                    sortObj = { ref: -1 };
                }
            } else {
                sortObj = { ref: -1 };
            }

            let aggregate_obj = [
                {
                    $match: {
                        is_deleted: false,
                    },
                },
                {
                    $group: {
                        _id: '$referral.referred_by',
                        ref: {
                            $sum: 1,
                        },
                        amount: {
                            $sum: '$referral.amount',
                        },
                    },
                },
                {
                    $match: {
                        _id: { $ne: '' },
                    },
                },
                {
                    $addFields: {
                        _id: {
                            $toObjectId: '$_id',
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'referrar',
                    },
                },
                {
                    $unwind: '$referrar',
                },
                {
                    $match: matchObj,
                },
                {
                    $sort: sortObj,
                },
                {
                    $skip: parseInt(params.start),
                },
                {
                    $limit: params.length != -1 ? parseInt(params.length) : 10,
                },
                {
                    $project: {
                        _id: 0,
                        id: '$_id',
                        username: '$referrar.username',
                        ref: '$ref',
                        amount: '$amount',
                    },
                },
            ];

            let users = await User.aggregate(aggregate_obj).allowDiskUse(true);
            console.log('USERS', users);
            users = await Promise.all(
                users.map(async (user) => {
                    // user.username = '';
                    // if (Service.validateObjectId(user.id)) {
                    //     let us = await User.findById(user.id, ['username']);
                    //     if (us) user.username = us.username || '';
                    // }

                    return [
                        `<a href="${config.pre + req.headers.host}/user/view/${user.id}">${user.username
                        }</a>`,
                        user.ref,
                        `<small class="label bg-green">${user.amount}</small>`,
                        `<ul class="list-inline">
                            <li>
                                <a href="${config.pre + req.headers.host}/referral/view/${user.id
                        }"><i class="fa fa-eye" aria-hidden="true"></i></a>
                            </li>
                        </ul>`,
                    ];
                })
            );

            let users_tot = await User.aggregate([
                {
                    $match: {
                        is_deleted: false,
                    },
                },
                {
                    $group: {
                        _id: '$referral.referred_by',
                        ref: {
                            $sum: 1,
                        },
                        amount: {
                            $sum: '$referral.amount',
                        },
                    },
                },
                {
                    $match: {
                        _id: { $ne: '' },
                    },
                },
                {
                    $addFields: {
                        _id: {
                            $toObjectId: '$_id',
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'referrar',
                    },
                },
                {
                    $unwind: '$referrar',
                },
                {
                    $match: matchObj,
                },
                {
                    $group: {
                        _id: null,
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]).allowDiskUse(true);

            let total = users_tot.length > 0 ? users_tot[0].count : 0;
            let total_f = total;

            let endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'getReferralListAjax');

            return res.status(200).send({
                data: users,
                draw: new Date().getTime(),
                recordsTotal: total,
                recordsFiltered: total_f,
            });
        } catch (err) {
            console.log('ERRR', err);
            let endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'getUserListAjax');

            return res.send(Service.response(0, localization.ServerError, err.message));
        }
    },

    getReferralDetails: async (id) => {
        logger.info('Admin Request for REFERRALS DETAILS ::', id);
        let referrals = await User.aggregate([
            {
                $match: {
                    is_deleted: false,
                    'referral.referred_by': id,
                },
            },
            {
                $project: {
                    name: '$username',
                    id: '$_id',
                    numeric_id: '$numeric_id',
                    matches: '$referral.matches',
                    amount: '$referral.amount',
                },
            },
        ]).allowDiskUse(true);

        return referrals;
    },

    usernameById: async (id) => {
        //logger.info('Admin Request for username ::', id);

        if (Service.validateObjectId(id)) {
            let d = await User.findById({
                _id: id,
            });
            if (d) return d.username;
        }
        return 0;
    },

    withdrawalRequestProcess: async (req, res, io) => {
        let params = _.pick(req.body, 'request_id', 'status');

        //logger.info('ADMIN Withdrawl Accept REQUEST >> ', req.body);

        if (!params) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (!params.status) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }
        let acceptRequest = null;
        let checkId = await Service.validateObjectId(params.request_id);
        if (checkId) {
            if (params.status == 'A') {
                const wr = await WithdrawalRequest.find({
                    _id: params.request_id,
                })
                console.log('wr >>>>>>',wr)
                let user = await User.findById({
                    _id: wr[0].user_id,
                });
                
                let transferId = await randomString({length: 10,numeric: true,letters: true});
                wr[0].transferId = transferId;
                const resp = await payOut.initTransfer(user,wr[0]);
                if(resp && resp.status) {
                    acceptRequest = await WithdrawalRequest.findByIdAndUpdate(params.request_id, {
                        $set: {
                            is_status: params.status,
                            completed_at: new Date().getTime(),
                            transferId:transferId
                        },
                    });
                }
            }else{
                acceptRequest = await WithdrawalRequest.findByIdAndUpdate(params.request_id, {
                    $set: {
                        is_status: params.status,
                        completed_at: new Date().getTime(),
                    },
                });
            }
            

            if (acceptRequest) {
                if (params.status == 'R') {
                    //logger.info("Refund Amount to user::", acceptRequest.user_id);

                    let checkuserid = await Service.validateObjectId(acceptRequest.user_id);

                    if (checkuserid) {
                        User.findByIdAndUpdate(acceptRequest.user_id, {
                            $inc: {
                                win_wallet: acceptRequest.amount,
                            },
                        })
                            .then((d) => {
                                //logger.info("Refund Amount Completed");
                                let message = {
                                    app_id: config.ONESIGNAL_APP_ID,
                                    contents: {
                                        en: localization.withdrawlPushReject,
                                    },
                                    data: {
                                        method: 'message',
                                    },
                                    include_player_ids: [d.onesignal_id],
                                };

                                Service.sendNotification(message)
                                    .then((data) => {
                                        logger.info('Push Sent');
                                    })
                                    .catch((err) => {
                                        logger.info('Push Error ', err);
                                    });

                                let emailObjR = {
                                    name: d.name,
                                    email: d.email,
                                    amount: acceptRequest.amount,
                                };

                                if (d.email_verified) Mailer.sendWithdrawlRejected(emailObjR);
                                else console.log('CAN\'t send email cause unverified, sendWithdrawlRejected');
                            })
                            .catch((e) => {
                                logger.info('Error While Refund Amount ', e);
                            });
                    } else {
                        logger.info('Invalid User ID');
                    }
                } else {
                    console.log('HERE HERE');
                    io.to('panel').emit('withdrawal_updated', {
                        amount: acceptRequest.amount,
                    });

                    let getOnsignalId = await User.findById(acceptRequest.user_id);

                    let message = {
                        app_id: config.ONESIGNAL_APP_ID,
                        contents: {
                            en: localization.withdrawlPushSuccess,
                        },
                        data: {
                            method: 'message',
                        },
                        include_player_ids: [getOnsignalId.onesignal_id],
                    };

                    Service.sendNotification(message)
                        .then((data) => {
                            logger.info('Push Sent');
                        })
                        .catch((err) => {
                            logger.info('Push Error ', err);
                        });

                    let emailObj = {
                        name: getOnsignalId.name,
                        email: getOnsignalId.email,
                        amount: acceptRequest.amount,
                    };

                    Mailer.sendWithdrawlSuccess(emailObj);
                }
                return res.send({
                    status: 1,
                    Msg: localization.withdrawalRequestProcessed,
                });
            } else {
                return res.send({
                    status: 0,
                    Msg: localization.serverError,
                });
            }
        } else {
            return res.send({
                status: 0,
                Msg: localization.invalidRquest,
            });
        }
    },

    withdrawalRequestProcessMultiple: async (req, res, io) => {
        let params = _.pick(req.body, 'data', 'status');
        logger.info('ADMIN Withdrawl Accept REQUEST >> ', req.body);

        if (!params) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (!params.status) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        let _ids = _.isArray(params.data) ? params.data : JSON.parse(params.data);

        for (const request_id of _ids) {
            let checkId = await Service.validateObjectId(request_id);

            if (checkId) {
                let acceptRequest = null;
                if (params.status == 'A') {
                    const wr = await WithdrawalRequest.find({
                        _id: request_id,
                    })
                    console.log('wr >>>>>>',wr)
                    let user = await User.findById({
                        _id: wr[0].user_id,
                    });
                    let transferId = await randomString({length: 10,numeric: true,letters: true});
                    wr[0].transferId = transferId
                    const resp = await payOut.initTransfer(user,wr[0]);
                    if(resp && resp.status) {
                        acceptRequest = await WithdrawalRequest.findByIdAndUpdate(request_id, {
                            $set: {
                                is_status: params.status,
                                completed_at: new Date().getTime(),
                                transferId:transferId
                            },
                        });
                    }
                }else{
                    acceptRequest = await WithdrawalRequest.findByIdAndUpdate(request_id, {
                        $set: {
                            is_status: params.status,
                            completed_at: new Date().getTime(),
                        },
                    });
                }

                if (acceptRequest) {
                    if (params.status == 'R') {
                        //logger.info("Refund Amount to user::", acceptRequest.user_id);

                        let checkuserid = await Service.validateObjectId(acceptRequest.user_id);

                        if (checkuserid) {
                            User.findByIdAndUpdate(acceptRequest.user_id, {
                                $inc: {
                                    win_wallet: acceptRequest.amount,
                                },
                            })
                                .then((d) => {
                                    //logger.info("Refund Amount Completed");

                                    let message = {
                                        app_id: config.ONESIGNAL_APP_ID,
                                        contents: {
                                            en: localization.withdrawlPushReject,
                                        },
                                        data: {
                                            method: 'message',
                                        },
                                        include_player_ids: [d.onesignal_id],
                                    };

                                    Service.sendNotification(message)
                                        .then((data) => {
                                            logger.info('Push Sent');
                                        })
                                        .catch((err) => {
                                            logger.info('Push Error ', err);
                                        });

                                    let emailObjR = {
                                        name: d.name,
                                        email: d.email,
                                        amount: acceptRequest.amount,
                                    };

                                    Mailer.sendWithdrawlRejected(emailObjR);
                                })
                                .catch((e) => {
                                    logger.info('Error While Refund Amount ', e);
                                });
                        } else {
                            logger.info('Invalid User ID');
                        }
                    } else {
                        console.log('HERE HERE', acceptRequest.amount);
                        io.emit('withdrawal_updated', {
                            amount: acceptRequest.amount,
                        });

                        let getOnsignalId = await User.findById(acceptRequest.user_id);

                        let message = {
                            app_id: config.ONESIGNAL_APP_ID,
                            contents: {
                                en: localization.withdrawlPushSuccess,
                            },
                            data: {
                                method: 'message',
                            },
                            include_player_ids: [getOnsignalId.onesignal_id],
                        };

                        Service.sendNotification(message)
                            .then((data) => {
                                logger.info('Push Sent');
                            })
                            .catch((err) => {
                                logger.info('Push Error ', err);
                            });

                        let emailObj = {
                            name: getOnsignalId.name,
                            email: getOnsignalId.email,
                            amount: acceptRequest.amount,
                        };

                        Mailer.sendWithdrawlSuccess(emailObj);
                    }
                } else {
                    return res.send({
                        status: 0,
                        Msg: localization.serverError,
                    });
                }
            } else {
                return res.send({
                    status: 0,
                    Msg: localization.invalidRquest,
                });
            }
        }

        return res.send({
            status: 1,
            Msg: localization.withdrawalRequestProcessed,
        });
    },

    withdrawalCompletedRequest: async () => {
        const wr = await WithdrawalRequest.find({
            is_status: 'A',
        })
            .populate('user_id')
            .sort({
                completed_at: -1,
            })
            .limit(10);

        const list = await Promise.all(
            wr.map(async (w) => {
                return {
                    id: w._id,
                    username: w.user_id.username,
                    user_id: w.user_id._id,
                    amount: w.amount,
                    created_at: w.created_at, //await Service.formateDate(parseInt(w.created_at)),
                    completed_at: w.completed_at, //await Service.formateDate(parseInt(w.completed_at)),
                    payment_method: _.capitalize(w.payment_type),
                    acc_no: w.account_no || '',
                    bank_name: w.bank_name || '',
                    ifsc: w.ifsc_code || '',
                    acc_name: w.account_name || '',
                    mobile: w.mobile_no || '',
                    upi_id: w.upi_id || '',
                };
            })
        );
        //logger.info('Withdrawal List :: ', list);

        let total = await WithdrawalRequest.find({
            is_status: 'A',
        }).countDocuments();

        return {
            list,
            total,
        };
    },

    withdrawalCompletedAjax: async (req, res) => {
        // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
        let i = 0;

        const params = req.query;
        console.log('COMPLETED AJAX PARAMS', params);
        let status = '';

        let matchObj = {
            is_status: 'A',
        };

        const user_id = params.id || '';

        if (Service.validateObjectId(user_id)) {
            matchObj.user_id = ObjectId(user_id);
        }

        if (params.filter) {
            if (params.filter == 'P') {
                matchObj.payment_type = 'paytm';
            } else if (params.filter == 'B') {
                matchObj.payment_type = 'bank';
            } else if (params.filter == 'U') {
                matchObj.payment_type = 'upi';
            }
        }

        let aggregation_obj = [];

        // logger.info("OBJMATCH ", matchObj);

        aggregation_obj.push({
            $match: matchObj,
        });

        let offset = params.start == 'All' ? 0 : parseInt(params.start);

        let sortObj = {};
        if (params.order) {
            if (params.order[0]) {
                if (params.order[0].column == '3') {
                    // SORT BY USERNAME
                    sortObj.amount = params.order[0].dir == 'asc' ? 1 : -1;
                } else if (params.order[0].column == '5') {
                    // SORT BY USERNAME
                    sortObj.created_at = params.order[0].dir == 'asc' ? 1 : -1;
                } else if (params.order[0].column == '6') {
                    // SORT BY USERNAME
                    sortObj.completed_at = params.order[0].dir == 'asc' ? 1 : -1;
                } else {
                    sortObj = { created_at: -1 };
                }
            } else {
                sortObj = { created_at: -1 };
            }
        } else {
            sortObj = { created_at: -1 };
        }

        aggregation_obj.push(
            {
                $sort: sortObj,
            },
            {
                $skip: offset,
            }
        );

        if (params.length != -1) {
            aggregation_obj.push({
                $limit: parseInt(params.length),
            });
        }

        aggregation_obj.push(
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'users',
                },
            },
            {
                $unwind: '$users',
            }
        );

        aggregation_obj.push({
            $project: {
                id: '$_id',
                username: '$users.username',
                user_id: '$users._id',
                amount: '$amount',
                created_at: '$created_at', //await Service.formateDate(parseInt("$created_at)),
                completed_at: '$completed_at', //await Service.formateDate(parseInt("$completed_at)),
                payment_method: '$payment_type',
                acc_no: '$account_no',
                bank_name: '$bank_name',
                ifsc: '$ifsc_code',
                acc_name: '$account_name',
                mobile: '$mobile_no',
                upi_id: '$upi_id',
            },
        });

        // logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));

        let list = await WithdrawalRequest.aggregate(aggregation_obj).allowDiskUse(true);

        let aggregate_rf = [];

        if (matchObj) {
            aggregate_rf.push(
                //     {
                //     $lookup: {
                //         from: 'users',
                //         localField: 'user_id',
                //         foreignField: '_id',
                //         as: 'users'
                //     }
                // },
                // {
                //     $unwind: '$users'
                // },
                {
                    $match: matchObj,
                }
            );
        }

        aggregate_rf.push({
            $group: {
                _id: null,
                count: {
                    $sum: 1,
                },
            },
        });

        // logger.info("aggregate_rf", aggregate_rf);
        let rF = await WithdrawalRequest.aggregate(aggregate_rf).allowDiskUse(true);

        // logger.info("RF ", rF);
        let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
        let recordsTotal = await WithdrawalRequest.find({
            is_status: 'A',
        }).countDocuments();

        let rank = offset + 1;

        list = await Promise.all(
            list.map(async (u) => {
                //logger.info("User Transaction",u);

                return [
                    u._id,
                    rank++,
                    `<a href="/user/view/${u.user_id}">${u.username}</a>`,
                    u.amount,
                    _.capitalize(u.payment_method),
                    `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
                    `<span class='time_formateDateandTime2'>${u.completed_at}</span>`,
                    `<ul class="list-inline"><li><a href="#"><small class="label bg-blue" onclick="showData('${_.capitalize(
                        u.payment_method
                    )}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile}','${u.upi_id}', '${u.acc_no
                    }')">View</small></a></li></ul>`,
                ];
            })
        );

        return res.status(200).send({
            data: await list,
            draw: new Date().getTime(),
            recordsTotal: recordsTotal,
            recordsFiltered: recordsFiltered,
        });
    },

    withdrawalRejectedAjax: async (req, res) => {
        // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)

        let i = 0;

        const params = req.query;

        let status = '';

        let matchObj = {
            is_status: 'R',
        };

        const user_id = params.id || '';

        if (Service.validateObjectId(user_id)) {
            matchObj.user_id = ObjectId(user_id);
        }

        if (params.filter) {
            if (params.filter == 'P') {
                matchObj.payment_type = 'paytm';
            } else if (params.filter == 'B') {
                matchObj.payment_type = 'bank';
            } else if (params.filter == 'U') {
                matchObj.payment_type = 'upi';
            }
        }

        let aggregation_obj = [];

        logger.info('OBJMATCH', matchObj);

        aggregation_obj.push({
            $match: matchObj,
        });

        let offset = params.start == 'All' ? 0 : parseInt(params.start);

        let sortObj = {};
        if (params.order) {
            if (params.order[0]) {
                if (params.order[0].column == '2') {
                    // SORT BY USERNAME
                    sortObj.amount = params.order[0].dir == 'asc' ? 1 : -1;
                } else if (params.order[0].column == '4') {
                    // SORT BY USERNAME
                    sortObj.created_at = params.order[0].dir == 'asc' ? 1 : -1;
                } else if (params.order[0].column == '5') {
                    // SORT BY USERNAME
                    sortObj.completed_at = params.order[0].dir == 'asc' ? 1 : -1;
                } else {
                    sortObj = { created_at: -1 };
                }
            } else {
                sortObj = { created_at: -1 };
            }
        } else {
            sortObj = { created_at: -1 };
        }

        aggregation_obj.push(
            {
                $sort: sortObj,
            },
            {
                $skip: offset,
            }
        );

        if (params.length != -1) {
            aggregation_obj.push({
                $limit: parseInt(params.length),
            });
        }

        aggregation_obj.push(
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'users',
                },
            },
            {
                $unwind: '$users',
            }
        );

        aggregation_obj.push({
            $project: {
                id: '$_id',
                username: '$users.username',
                user_id: '$users._id',
                amount: '$amount',
                created_at: '$created_at', //await Service.formateDate(parseInt("$created_at)),
                completed_at: '$completed_at', //await Service.formateDate(parseInt("$completed_at)),
                payment_method: '$payment_type',
                acc_no: '$account_no',
                bank_name: '$bank_name',
                ifsc: '$ifsc_code',
                acc_name: '$account_name',
                mobile: '$mobile_no',
                upi_id: '$upi_id',
            },
        });

        logger.info('AGGRE ', JSON.stringify(aggregation_obj, undefined, 2));

        let list = await WithdrawalRequest.aggregate(aggregation_obj).allowDiskUse(true);

        let aggregate_rf = [];

        if (matchObj) {
            aggregate_rf.push(
                //     {
                //     $lookup: {
                //         from: 'users',
                //         localField: 'user_id',
                //         foreignField: '_id',
                //         as: 'users'
                //     }
                // },
                // {
                //     $unwind: '$users'
                // },
                {
                    $match: matchObj,
                }
            );
        }

        aggregate_rf.push({
            $group: {
                _id: null,
                count: {
                    $sum: 1,
                },
            },
        });

        logger.info('aggregate_rf', aggregate_rf);
        let rF = await WithdrawalRequest.aggregate(aggregate_rf).allowDiskUse(true);

        logger.info('RF ', rF);
        let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
        let recordsTotal = await WithdrawalRequest.find({
            is_status: 'R',
        }).countDocuments();

        let rank = offset + 1;

        list = await Promise.all(
            list.map(async (u) => {
                //logger.info("User Transaction",u);

                return [
                    rank++,
                    `<a href="/user/view/${u.user_id}">${u.username}</a>`,
                    u.amount,
                    _.capitalize(u.payment_method),
                    `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
                    `<span class='time_formateDateandTime2'>${u.completed_at}</span>`,
                    `<ul class="list-inline"><li><a href="#"><small class="label bg-blue" onclick="showData('${_.capitalize(
                        u.payment_method
                    )}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile}','${u.upi_id}','${u.acc_no
                    }')">View</small></a></li></ul>`,
                ];
            })
        );

        return res.status(200).send({
            data: await list,
            draw: new Date().getTime(),
            recordsTotal: recordsTotal,
            recordsFiltered: recordsFiltered,
        });
    },

    withdrawalAjax: async (req, res) => {
        // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)

        let i = 0;

        const params = req.query;

        let status = '';

        let matchObj = {
            is_status: 'P',
        };

        const user_id = params.id || '';

        if (Service.validateObjectId(user_id)) {
            matchObj.user_id = ObjectId(user_id);
        }

        if (params.filter) {
            if (params.filter == 'P') {
                matchObj.payment_type = 'paytm';
            } else if (params.filter == 'B') {
                matchObj.payment_type = 'bank';
            }
            else if (params.filter == 'U') {
                matchObj.payment_type = 'upi';
            }
        }

        let aggregation_obj = [];

        logger.info('OBJMATCH', matchObj);

        aggregation_obj.push({
            $match: matchObj,
        });

        let offset = params.start == 'All' ? 0 : parseInt(params.start);

        let sortObj = {};
        if (params.order) {
            if (params.order[0]) {
                if (params.order[0].column == '3') {
                    // SORT BY USERNAME
                    sortObj.amount = params.order[0].dir == 'asc' ? 1 : -1;
                } else if (params.order[0].column == '5') {
                    // SORT BY USERNAME
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

        aggregation_obj.push(
            {
                $sort: sortObj,
            },
            {
                $skip: offset,
            }
        );

        if (params.length != -1) {
            aggregation_obj.push({
                $limit: parseInt(params.length),
            });
        }

        aggregation_obj.push(
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'users',
                },
            },
            {
                $unwind: '$users',
            }
        );

        aggregation_obj.push({
            $project: {
                id: '$_id',
                username: '$users.username',
                user_id: '$users._id',
                amount: '$amount',
                created_at: '$created_at', //await Service.formateDate(parseInt("$created_at)),
                completed_at: '$completed_at', //await Service.formateDate(parseInt("$completed_at)),
                payment_method: '$payment_type',
                acc_no: '$account_no',
                bank_name: '$bank_name',
                ifsc: '$ifsc_code',
                acc_name: '$account_name',
                mobile: '$mobile_no',
                upi_id: '$upi_id',
            },
        });

        logger.info('AGGRE ', JSON.stringify(aggregation_obj, undefined, 2));

        let list = await WithdrawalRequest.aggregate(aggregation_obj).allowDiskUse(true);

        let aggregate_rf = [];

        if (matchObj) {
            aggregate_rf.push(
                //     {
                //     $lookup: {
                //         from: 'users',
                //         localField: 'user_id',
                //         foreignField: '_id',
                //         as: 'users'
                //     }
                // },
                // {
                //     $unwind: '$users'
                // },
                {
                    $match: matchObj,
                }
            );
        }

        aggregate_rf.push({
            $group: {
                _id: null,
                count: {
                    $sum: 1,
                },
            },
        });

        logger.info('aggregate_rf ' + aggregate_rf);
        let rF = await WithdrawalRequest.aggregate(aggregate_rf).allowDiskUse(true);

        logger.info('RF ', rF);
        let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
        let recordsTotal = await WithdrawalRequest.find({
            is_status: 'P',
        }).countDocuments();

        let rank = offset + 1;

        list = await Promise.all(
            list.map(async (u) => {
                //logger.info("User Transaction",u);

                return [
                    u.id,
                    rank++,
                    `<a  href="/user/view/${u.user_id}">${u.username}</a>`,
                    u.amount,
                    _.capitalize(u.payment_method),
                    `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
                    `<ul class="list-inline">
          <li>
            <a href="#"
              ><small
                class="label bg-blue"
                onclick="showData('${u.payment_method}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile}','${u.upi_id}','${u.acc_no}')"
                >View</small
              ></a
            >
          </li>
          <li>
            <a href="#"
              ><small
                class="label bg-green"
                onclick="acceptRequest('${u.id}', 'A')"
                >Accept</small
              ></a
            >
          </li>
          <li>
            <a href="#" onclick="acceptRequest('${u.id}', 'R')"
              ><small class="label bg-red">Reject</small></a
            >
          </li>
        </ul>`,
                ];
            })
        );

        return res.status(200).send({
            data: await list,
            draw: new Date().getTime(),
            recordsTotal: recordsTotal,
            recordsFiltered: recordsFiltered,
        });
    },

    withdrawalRejectedRequest: async () => {
        const wr = await WithdrawalRequest.find({
            is_status: 'R',
        })
            .populate('user_id')
            .sort({
                completed_at: -1,
            })
            .limit(10);

        const list = await Promise.all(
            wr.map(async (w) => {
                return {
                    id: w._id,
                    username: w.user_id.username,
                    user_id: w.user_id._id,
                    amount: w.amount,
                    created_at: w.created_at, //await Service.formateDate(parseInt(w.created_at)),
                    completed_at: w.completed_at, //await Service.formateDate(parseInt(w.completed_at)),
                    payment_method: _.capitalize(w.payment_type),
                    acc_no: w.account_no || '',
                    bank_name: w.bank_name || '',
                    ifsc: w.ifsc_code || '',
                    acc_name: w.account_name || '',
                    mobile: w.mobile_no || '',
                    upi_id: w.upi_id || '',
                };
            })
        );
        //logger.info('Withdrawal List :: ', list);

        let total = await WithdrawalRequest.find({
            is_status: 'R',
        }).countDocuments();

        return {
            list,
            total,
        };
    },

    updateAdminProfile: async (req, res) => {
        let params = _.pick(req.body, 'name', 'email');

        //logger.info("Admin Profile Update Request", params);

        if (!params) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (!params.name) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (!params.email) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        let updateAdmin = await Admin.findByIdAndUpdate(req.admin._id, {
            $set: {
                name: params.name,
                email: params.email,
            },
        });

        if (updateAdmin) {
            let newLog = new AccessLog({
                admin: req.admin._id,
                action: 'Updated own profile details!',
                created_at: new Date().getTime(),
            });
            await newLog.save();

            return res.send({
                status: 1,
                Msg: localization.loginSuccess,
            });
        } else {
            return res.send({
                status: 0,
                Msg: localization.ServerError,
            });
        }
    },

    updateAdminProfilePass: async (req, res) => {
        let params = _.pick(req.body, 'opass', 'pass_confirmation', 'pass');

        //logger.info("Admin Profile Update Request", params);

        if (!params) {
            return res.send({
                status: 0,
                Msg: localization.allFiledError,
            });
        }

        if (!params.opass) {
            return res.send({
                status: 0,
                Msg: localization.allFiledError,
            });
        }

        if (!params.pass_confirmation) {
            return res.send({
                status: 0,
                Msg: localization.allFiledError,
            });
        }

        if (!params.pass) {
            return res.send({
                status: 0,
                Msg: localization.allFiledError,
            });
        }

        if (params.pass_confirmation != params.pass) {
            return res.send({
                status: 0,
                Msg: localization.passwordNotMatchError,
            });
        }

        if (params.pass_confirmation.trim().length < 6 || params.pass_confirmation.trim().length > 12) {
            return res.send({
                status: 0,
                Msg: localization.passwordValidationError,
            });
        }

        let rez1 = await bcrypt.compare(params.opass, req.admin.password);

        if (!rez1) {
            return res.send({
                status: 0,
                Msg: localization.invalidOldPassError,
            });
        }

        let hash = bcrypt.hashSync(params.pass_confirmation);

        let updateAdmin = await Admin.findByIdAndUpdate(req.admin._id, {
            $set: {
                password: hash,
            },
        });

        if (updateAdmin) {
            let newLog = new AccessLog({
                admin: req.admin._id,
                action: 'Changed own password',
                created_at: new Date().getTime(),
            });
            await newLog.save();

            return res.send({
                status: 1,
                Msg: localization.loginSuccess,
            });
        } else {
            return res.send({
                status: 0,
                Msg: localization.ServerError,
            });
        }
    },

    addMoneyByAdmin: async (req, res) => {
        let params = _.pick(req.body, 'request_id', 'amount', 'type', 'txn_mode', 'remarks');

        //logger.info("Add Money Request", params);

        if (!params) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (!params.request_id) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (!params.amount) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (isNaN(params.amount)) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (params.amount <= 0) {
            return res.send({
                status: 0,
                Msg: localization.invalidAmountError,
            });
        }

        let checkId = await Service.validateObjectId(params.request_id);

        let obj = {};

        if (params.type == 'win') {
            obj.win_wallet = params.amount;
        } else if (params.type == 'main') {
            obj.main_wallet = params.amount;
        } else {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (checkId) {
            let addedAmount = await User.findByIdAndUpdate(params.request_id, {
                $inc: obj,
            });

            if (addedAmount) {
                logger.info('NUmeric ID', addedAmount);
                // var maxNumId = await Transaction.find({}, 'order_id')
                //     .sort({ order_id: -1 })
                //     .limit(1);
                // var order_id = maxNumId.length == 0 ? 10000 : 0;
                // if (order_id == 0) {
                //     order_id = maxNumId[0].order_id + 1;
                //     maxNumId = await Transaction.findOne({ order_id: order_id });
                //     while (maxNumId) {
                //         order_id = maxNumId.order_id + 1;
                //         maxNumId = await Transaction.findOne({ order_id: order_id });
                //     }
                // }

                // var a = uniqid();
                // var b = addedAmount.numeric_id;
                let order_id = utility.objectId();
                //var order_id = `${b}${a}`;
                // var order_id = uniqid();
                logger.info('Order Id while money deduct:: ', order_id);

                let newTxn = new Transaction({
                    user_id: params.request_id,
                    txn_amount: params.amount,
                    order_id: order_id,
                    created_at: new Date().getTime(),
                    transaction_type: 'C',
                    resp_msg: params.remarks || 'Deposit by Admin',
                    is_status: 'S',
                    txn_mode: params.txn_mode,
                });

                if (params.type == 'main') {
                    newTxn.txn_win_amount = 0;
                    newTxn.txn_main_amount = params.amount;
                } else {
                    newTxn.txn_win_amount = params.amount;
                    newTxn.txn_main_amount = 0;
                }

                let txnres = await newTxn.save();

                if (txnres) {
                    //logger.info("record::", addedAmount);

                    let message = {
                        app_id: config.ONESIGNAL_APP_ID,
                        contents: {
                            en: localization.adminAmountPushSuccess + ' ' + params.amount + ' Rs',
                        },
                        data: {
                            method: 'message',
                        },
                        include_player_ids: [addedAmount.onesignal_id],
                    };

                    Service.sendNotification(message)
                        .then((data) => {
                            logger.info('Push Sent');
                        })
                        .catch((err) => {
                            logger.info('Push Error ', err);
                        });

                    let newLog = new AccessLog({
                        admin: req.admin._id,
                        action: `Added ${params.amount} in user's ${params.type} wallet`,
                        user: params.request_id,
                        created_at: new Date().getTime(),
                    });
                    await newLog.save();

                    return res.send({
                        status: 1,
                        Msg: localization.addmoneyRequestProcessed,
                    });
                } else {
                    return res.send({
                        status: 0,
                        Msg: localization.ServerError,
                    });
                }
            } else {
                return res.send({
                    status: 0,
                    Msg: localization.ServerError,
                });
            }
        } else {
            return res.send({
                status: 0,
                Msg: localization.invalidRquest,
            });
        }
    },

    deductMoneyByAdmin: async (req, res) => {
        let params = _.pick(req.body, 'request_id', 'amount', 'type', 'remarks');

        //logger.info("Add Money Request", params);

        if (!params) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (!params.request_id) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (!params.amount) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (isNaN(params.amount)) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (params.amount <= 0) {
            return res.send({
                status: 0,
                Msg: localization.invalidAmountError,
            });
        }

        let checkId = await Service.validateObjectId(params.request_id);
        let obj = {};
        let user = await User.findById(params.request_id);
        if (!user)
            return res.send({
                status: 0,
                Msg: localization.ServerError,
            });

        if (params.type == 'win') {
            obj.win_wallet = 0 - params.amount;
            if (params.amount > user.win_wallet) {
                return res.send({
                    status: 0,
                    Msg: localization.notEnoughAmount,
                });
            }
        } else if (params.type == 'main') {
            obj.main_wallet = 0 - params.amount;
            if (params.amount > user.main_wallet) {
                return res.send({
                    status: 0,
                    Msg: localization.notEnoughAmount,
                });
            }
        } else {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (checkId) {
            let addedAmount = await User.findByIdAndUpdate(params.request_id, {
                $inc: obj,
            });

            if (addedAmount) {
                // var maxNumId = await Transaction.find({}, 'order_id')
                //     .sort({ order_id: -1 })
                //     .limit(1);
                // var order_id = maxNumId.length == 0 ? 10000 : 0;
                // if (order_id == 0) {
                //     order_id = maxNumId[0].order_id + 1;
                //     maxNumId = await Transaction.findOne({ order_id: order_id });
                //     while (maxNumId) {
                //         order_id = maxNumId.order_id + 1;
                //         maxNumId = await Transaction.findOne({ order_id: order_id });
                //     }
                // }

                // var a = uniqid();
                // var b = addedAmount.numeric_id;
                let order_id = utility.objectId();
                // var order_id = `${b}${a}`;
                logger.info('Order Id while money deduct:: ', order_id);

                let newTxn = new Transaction({
                    user_id: params.request_id,
                    txn_amount: 0 - params.amount,
                    order_id: order_id,
                    created_at: new Date().getTime(),
                    transaction_type: 'D',
                    resp_msg: params.remarks || 'Deduct by admin',
                    is_status: 'S',
                    txn_mode: 'A',
                });

                if (params.type == 'main') {
                    newTxn.txn_win_amount = 0;
                    newTxn.txn_main_amount = 0 - params.amount;
                } else {
                    newTxn.txn_win_amount = 0 - params.amount;
                    newTxn.txn_main_amount = 0;
                }

                let txnres = await newTxn.save();

                if (txnres) {
                    let newLog = new AccessLog({
                        admin: req.admin._id,
                        action: `Deducted ${params.amount} from user's ${params.type} wallet`,
                        user: params.request_id,
                        created_at: new Date().getTime(),
                    });
                    await newLog.save();

                    return res.send({
                        status: 1,
                        Msg: localization.addmoneyRequestProcessed,
                    });
                } else {
                    return res.send({
                        status: 0,
                        Msg: localization.ServerError,
                    });
                }
            } else {
                return res.send({
                    status: 0,
                    Msg: localization.ServerError,
                });
            }
        } else {
            return res.send({
                status: 0,
                Msg: localization.invalidRquest,
            });
        }
    },

    getAppVersion: async (req, res) => {
        let version = await Default.findOne({
            key: 'app_version',
        });
        if (version) return version;
        else {
            return false;
        }
    },

    generateReport: async (req, res) => {
        logger.info('GENERATE REPORT STARTED', req.body);

        try {
            let dates = req.body.date.split(' - ');
            let start_date_ = dates[0].split('/').reverse().join('-') + ' 00:00:00';
            let end_date_ = dates[1].split('/').reverse().join('-') + ' 23:59:59';

            let start_date = moment
                .tz(start_date_, 'Asia/Kolkata')
                // .format('YYYY-MM-DD HH:mm:ss.sssZ');
                .format('x');
            let end_date = moment
                .tz(end_date_, 'Asia/Kolkata')
                // .format('YYYY-MM-DD HH:mm:ss.sssZ');
                .format('x');

            // let start_date = "2019-06-26";
            // let end_date = "2019-07-15";

            logger.info('BEFORE QUERY', new Date(), start_date, end_date);
            // let b = await Table.find({
            //     game_completed_at: {
            //         $ne: '-1'
            //     },
            //     created_at: {
            //         $gte: parseInt(start_date),
            //         $lte: parseInt(end_date)
            //     }
            // });

            let count = await Table.find({
                game_completed_at: {
                    $ne: '-1',
                },
                created_at: {
                    $gte: parseInt(start_date),
                    $lte: parseInt(end_date),
                },
            }).countDocuments();

            logger.info('COUNT', count);
            let d = await Table.aggregate([
                {
                    $match: {
                        game_completed_at: {
                            $ne: '-1',
                        },
                        created_at: {
                            $gte: parseInt(start_date),
                            $lte: parseInt(end_date),
                        },
                    },
                },
                {
                    $unwind: '$players',
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'players.id',
                        foreignField: '_id',
                        as: 'players.id',
                    },
                },
                {
                    $unwind: '$players.id',
                },
                {
                    $group: {
                        _id: '$_id',
                        room: {
                            $first: '$room',
                        },
                        room_type: {
                            $first: '$room_type',
                        },
                        no_of_players: {
                            $first: '$no_of_players',
                        },
                        room_fee: {
                            $first: '$room_fee',
                        },
                        created_at: {
                            $first: '$created_at',
                        },
                        created_date: {
                            $first: '$created_date',
                        },
                        players: {
                            $push: '$players',
                        },
                    },
                },
                {
                    $sort: {
                        created_at: 1,
                    },
                },
            ]).allowDiskUse(true);
            // logger.info('DATA', d.length, b.length);
            logger.info('BEFORE MAP', new Date());

            let gData = await Promise.all(
                d.map(async (u) => {
                    let remark = 'User'.padEnd(15) + '\t' + 'Rank'.padEnd(6) + '\t' + 'Winnings'.padEnd(8) + '\n';
                    for (const us of u.players) {
                        remark +=
                            us.id.username.padEnd(15) +
                            '\t' +
                            us.rank.toString().padEnd(6) +
                            '\t' +
                            us.pl.toString().padEnd(8) +
                            '\n';
                    }
                    return {
                        'Room Code': u.room,
                        'Room Type': u.room_type,
                        'No Of Players': u.no_of_players,
                        'Total Amount': u.room_fee,
                        'Date Time': Service.formateDateandTime(u.created_at),
                        Remark: remark, //players
                        // 'TS':u.created_at
                    };
                })
            );

            const fields = ['Room Code', 'Room Type', 'No Of Players', 'Total Amount', 'Date Time', 'Remark'];
            logger.info('BEFORE PARSE', new Date());
            const json2csvParser = new Parser({
                fields,
            });
            const csv = json2csvParser.parse(gData);
            logger.info('AFTER PARSE', new Date());
            // logger.info(csv);
            return res.send({
                status: 1,
                file_name: 'Report_' + start_date_ + ' TO ' + end_date_ + '.csv',
                data: csv,
            });
        } catch (err) {
            logger.info('ERR', err);
            return res.send({
                status: 0,
                message: 'Something is wrong, Please try again',
                error: err,
            });
        }
    },

    exportWithdrawal: async (req, res) => {
        logger.info('export_withdrawal_request STARTED', req.body);

        try {
            let bank_match = {
                is_status: 'P',
                payment_type: 'bank',
            };
            let paytm_match = {
                is_status: 'P',
                payment_type: 'paytm',
            };
            let phonepe_match = {
                is_status: 'P',
                payment_type: 'phonepe',
            };
            let google_pay_match = {
                is_status: 'P',
                payment_type: 'google_pay',
            };

            if (req.body.data) {
                let _ids = _.isArray(req.body.data) ? req.body.data : JSON.parse(req.body.data);
                let final_ids = [];
                for (const id of _ids) {
                    if (!Service.validateObjectId(id)) {
                        return res.send({
                            status: 0,
                            Msg: localization.ServerError,
                        });
                    } else {
                        final_ids.push(ObjectId(id));
                    }
                }

                bank_match._id = {
                    $in: final_ids,
                };
                paytm_match._id = {
                    $in: final_ids,
                };
                phonepe_match._id = {
                    $in: final_ids,
                };
                google_pay_match._id = {
                    $in: final_ids,
                };
            }

            logger.info('DATA', bank_match, paytm_match, phonepe_match, google_pay_match);

            let bank_data = await WithdrawalRequest.aggregate([
                {
                    $match: bank_match,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: 0,
                        // "A/C Holder Name": "$user.username",
                        '#A/C Number': { $concat: ['#', '$account_no'] }, // { $concat: ["#", "$account_no"] } , {$concat: ["=\"","$account_no","\""]}
                        IFSC: '$ifsc_code',
                        Amount: '$amount', // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
                        'Remarks (optional)': { $concat: ['$user.username', '--', { $toString: '$_id' }] },
                    },
                },
            ]).allowDiskUse(true);

            logger.info('BANK DATA', bank_data);
            const bank_fields = ['#A/C Number', 'IFSC', 'Amount', 'Remarks (optional)'];
            const bankParser = new Parser({
                bank_fields,
            });
            const csv_bank = bank_data.length > 0 ? bankParser.parse(bank_data) : '';

            let paytm_data = await WithdrawalRequest.aggregate([
                {
                    $match: paytm_match,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: 0,
                        'User\'s Mobile Number/Email': '$mobile_no', // { $concat: ["#", { $substr: ["$mobile_no", 0, -1] }] }
                        Amount: '$amount', // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
                        'Beneficiary Name': '$user.username',
                        Comment: '$_id',
                    },
                },
            ]).allowDiskUse(true);
            logger.info('PAYTM DATA', paytm_data);

            const paytm_fields = ['User\'s Mobile Number/Email', 'Amount', 'Beneficiary Name', 'Comment'];
            const paytmParser = new Parser({
                paytm_fields,
            });
            const csv_paytm = paytm_data.length > 0 ? paytmParser.parse(paytm_data) : '';
            // logger.info(csv);

            let phonepe_data = await WithdrawalRequest.aggregate([
                {
                    $match: phonepe_match,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: 0,
                        Name: '$user.username',
                        'Mobile Number': '$mobile_no',
                        'UPI ID': '$upi_id',
                        Amount: '$amount',
                        'Remarks (optional)': '$_id',
                    },
                },
            ]).allowDiskUse(true);
            logger.info('PHONEPE DATA', phonepe_data);

            const phonepe_fields = ['Name', 'Mobile Number', 'UPI ID', 'Amount', 'Remarks (optional)'];
            const phonepeParser = new Parser({
                phonepe_fields,
            });
            const csv_phonepe = phonepe_data.length > 0 ? phonepeParser.parse(phonepe_data) : '';

            let googlepay_data = await WithdrawalRequest.aggregate([
                {
                    $match: google_pay_match,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: 0,
                        Name: '$user.username',
                        'Mobile Number': '$mobile_no',
                        'UPI ID': '$upi_id',
                        Amount: '$amount',
                        'Remarks (optional)': '$_id',
                    },
                },
            ]).allowDiskUse(true);
            logger.info('GOOGLEPAY DATA', googlepay_data);

            const googlepay_fields = ['Name', 'Mobile Number', 'UPI ID', 'Amount', 'Remarks (optional)'];
            const googlepayParser = new Parser({
                googlepay_fields,
            });
            const csv_googlepay = googlepay_data.length > 0 ? googlepayParser.parse(googlepay_data) : '';
            let files = [];

            let d = new Date();
            d = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();

            if (csv_paytm != '') {
                files.push({
                    file_name: 'Paytm_Requests_' + d + '.csv',
                    data: csv_paytm,
                    type: 'LC_PTM_',
                });
            }

            if (csv_bank != '') {
                files.push({
                    file_name: 'Bank_Requests_' + d + '.csv',
                    data: csv_bank,
                    type: 'LC_BNK_',
                });
            }

            if (csv_phonepe != '') {
                files.push({
                    file_name: 'PhonePe_Requests_' + d + '.csv',
                    data: csv_phonepe,
                    type: 'LC_PHN_',
                });
            }

            if (csv_googlepay != '') {
                files.push({
                    file_name: 'GooglePay_Requests_' + d + '.csv',
                    data: csv_googlepay,
                    type: 'LC_GPY_',
                });
            }

            return res.send({
                status: 1,
                files: files,
            });
        } catch (err) {
            logger.info('ERR', err);
            return res.send({
                status: 0,
                message: 'Something is wrong, Please try again',
                error: err,
            });
        }
    },

    exportCompleted: async (req, res) => {
        logger.info('exportCompleted_request STARTED', req.body);

        try {
            let bank_match = {
                is_status: 'A',
                payment_type: 'bank',
            };
            let paytm_match = {
                is_status: 'A',
                payment_type: 'paytm',
            };
            let phonepe_match = {
                is_status: 'A',
                payment_type: 'phonepe',
            };
            let google_pay_match = {
                is_status: 'A',
                payment_type: 'google_pay',
            };

            if (req.body.data) {
                let _ids = _.isArray(req.body.data) ? req.body.data : JSON.parse(req.body.data);
                let final_ids = [];
                for (const id of _ids) {
                    if (!Service.validateObjectId(id)) {
                        return res.send({
                            status: 0,
                            Msg: localization.ServerError,
                        });
                    } else {
                        final_ids.push(ObjectId(id));
                    }
                }

                bank_match._id = {
                    $in: final_ids,
                };
                paytm_match._id = {
                    $in: final_ids,
                };
                phonepe_match._id = {
                    $in: final_ids,
                };
                google_pay_match._id = {
                    $in: final_ids,
                };
            }

            logger.info('DATA', bank_match, paytm_match, phonepe_match, google_pay_match);

            let bank_data = await WithdrawalRequest.aggregate([
                {
                    $match: bank_match,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: 0,
                        'A/C Holder Name': '$user.username',
                        'A/C Number': '$account_no', // { $concat: ["#", "$account_no"] } , {$concat: ["=\"","$account_no","\""]}
                        IFSC: '$ifsc_code',
                        Amount: '$amount', // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
                        'Remarks (optional)': '$_id',
                    },
                },
            ]).allowDiskUse(true);

            logger.info('BANK DATA', bank_data);
            const bank_fields = ['A/C Holder Name', 'A/C Number', 'IFSC', 'Amount', 'Remarks (optional)'];
            const bankParser = new Parser({
                bank_fields,
            });
            const csv_bank = bank_data.length > 0 ? bankParser.parse(bank_data) : '';

            let paytm_data = await WithdrawalRequest.aggregate([
                {
                    $match: paytm_match,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: 0,
                        'User\'s Mobile Number/Email': '$mobile_no', // { $concat: ["#", { $substr: ["$mobile_no", 0, -1] }] }
                        Amount: '$amount', // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
                        'Beneficiary Name': '$user.username',
                        Comment: '$_id',
                    },
                },
            ]).allowDiskUse(true);
            logger.info('PAYTM DATA', paytm_data);

            const paytm_fields = ['User\'s Mobile Number/Email', 'Amount', 'Beneficiary Name', 'Comment'];
            const paytmParser = new Parser({
                paytm_fields,
            });
            const csv_paytm = paytm_data.length > 0 ? paytmParser.parse(paytm_data) : '';
            // logger.info(csv);

            let phonepe_data = await WithdrawalRequest.aggregate([
                {
                    $match: phonepe_match,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: 0,
                        Name: '$user.username',
                        'Mobile Number': '$mobile_no',
                        'UPI ID': '$upi_id',
                        Amount: '$amount',
                        'Remarks (optional)': '$_id',
                    },
                },
            ]).allowDiskUse(true);
            logger.info('PHONEPE DATA', phonepe_data);

            const phonepe_fields = ['Name', 'Mobile Number', 'UPI ID', 'Amount', 'Remarks (optional)'];
            const phonepeParser = new Parser({
                phonepe_fields,
            });
            const csv_phonepe = phonepe_data.length > 0 ? phonepeParser.parse(phonepe_data) : '';

            let googlepay_data = await WithdrawalRequest.aggregate([
                {
                    $match: google_pay_match,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: 0,
                        Name: '$user.username',
                        'Mobile Number': '$mobile_no',
                        'UPI ID': '$upi_id',
                        Amount: '$amount',
                        'Remarks (optional)': '$_id',
                    },
                },
            ]).allowDiskUse(true);
            logger.info('GOOGLEPAY DATA', googlepay_data);

            const googlepay_fields = ['Name', 'Mobile Number', 'UPI ID', 'Amount', 'Remarks (optional)'];
            const googlepayParser = new Parser({
                googlepay_fields,
            });
            const csv_googlepay = googlepay_data.length > 0 ? googlepayParser.parse(googlepay_data) : '';
            let files = [];

            let d = new Date();
            d = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();

            if (csv_paytm != '') {
                files.push({
                    file_name: 'Paytm_Requests_' + d + '.csv',
                    data: csv_paytm,
                    type: 'LC_PTM_',
                });
            }

            if (csv_bank != '') {
                files.push({
                    file_name: 'Bank_Requests_' + d + '.csv',
                    data: csv_bank,
                    type: 'LC_BNK_',
                });
            }

            if (csv_phonepe != '') {
                files.push({
                    file_name: 'PhonePe_Requests_' + d + '.csv',
                    data: csv_phonepe,
                    type: 'LC_PHN_',
                });
            }

            if (csv_googlepay != '') {
                files.push({
                    file_name: 'GooglePay_Requests_' + d + '.csv',
                    data: csv_googlepay,
                    type: 'LC_GPY_',
                });
            }

            return res.send({
                status: 1,
                files: files,
            });
        } catch (err) {
            logger.info('ERR', err);
            return res.send({
                status: 0,
                message: 'Something is wrong, Please try again',
                error: err,
            });
        }
    },

    //All Game records for admin
    allGameRecords: async (limit) => {
        //var startTime = new Date();

        let allGameRecords = await Table.find({
            $expr: {
                $eq: ['$no_of_players', { $size: '$players' }],
            },
        })
            .sort({
                created_at: -1,
            })
            .limit(limit);
        logger.info('allGameRecords: ',allGameRecords)
        let gData = await Promise.all(
            allGameRecords.map(async (u) => {
                const players = [];
                for (const us of u.players) {
                    if (Service.validateObjectId(us.id)) {
                        const user = await User.findById(us.id);
                        players.push({
                            id: user._id,
                            username: user.username,
                            rank: us.rank,
                            pl: us.pl,
                        });
                    }
                }
                return {
                    room: u.room,
                    type: u.room_type,
                    players: u.no_of_players,
                    amount: u.room_fee,
                    date: u.created_at,
                    pdata: players,
                };
            })
        );

        let total = await Table.find({ players: { $ne: [] } }).countDocuments();
        return { list: gData, total: total };
    },

    updateGameMode: async (req, res) => {
        let params = _.pick(req.body, 'status');
        //logger.info('ADMIN Game Mode Change REQUEST >> ', req.body);

        if (!params) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        if (!params.status) {
            return res.send({
                status: 0,
                Msg: localization.missingParamError,
            });
        }

        let status = await Default.findOneAndUpdate(
            {
                key: 'app_version',
            },
            {
                $set: {
                    undermaintenance: params.status,
                },
            }
        );

        if (status) {
            return res.send({
                status: 1,
                Msg: localization.success,
            });
        } else {
            return res.send({
                status: 0,
                Msg: localization.serverError,
            });
        }
    },

    manuallyVerify: async function (req, res) {
        let params = _.pick(req.body, ['id']);
        logger.info('PARAMS', params);
        if (!params) return res.send(Service.response(0, localization.missingParamError, null));
        if (!Service.validateObjectId(params.id)) {
            return res.send(Service.response(0, localization.missingParamError, null));
        }
        let rez = await User.findByIdAndUpdate(params.id, {
            $set: {
                email_verified: true,
            },
        });
        if (rez) return res.send(Service.response(1, localization.success, null));
        else return res.send(Service.response(0, localization.serverError, null));
    },

    updateUserPassword: async (req, res) => {
        let params = _.pick(req.body, 'user_id', 'user_password');
        if (!params) return res.send(Service.response(0, localization.missingParamError, null));
        if (!Service.validateObjectId(params.user_id)) {
            return res.send(Service.response(0, localization.missingParamError, null));
        }
        if (!params.user_password) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        let hash = bcrypt.hashSync(params.user_password);

        let rez = await User.findByIdAndUpdate(params.user_id, {
            $set: {
                password: hash,
            },
        });

        if (rez) {
            let newLog = new AccessLog({
                admin: req.admin._id,
                action: 'Changed user\'s account password',
                user: params.user_id,
                created_at: new Date().getTime(),
            });
            await newLog.save();

            return res.send(Service.response(1, localization.success, null));
        } else return res.send(Service.response(0, localization.serverError, null));
    },


};
