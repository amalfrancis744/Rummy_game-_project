let { User } = require('./../models/user'),
    config = require('./../../config'),
    _ = require('lodash'),
    Service = require('./../service'),
    localization = require('./../service/localization');
let Cryptr = require('cryptr');
let { Transaction } = require('./../models/transaction');
let Table = require('./../models/table');
let { WithdrawalRequest } = require('./../models/WithdrawalRequest');
const uniqid = require('uniqid');

let logger = require('./../service/logger');

cryptr = new Cryptr(config.cryptrSecret);

let ObjectId = require('mongoose').Types.ObjectId;

let checksum = require('../../api/service/paytm/checksum');

let utility = require('./utilityController');




module.exports = {
    pgredirect: async function(req, res) {
        // logger.info("in pgdirect");
        // logger.info("--------testtxnjs----");
        return res.render('pgredirect.ejs');
    },

    testtxnGet: async function(req, res) {
        let startTime = new Date();
        // logger.info("Add Money Request >> ", req.params);
        let params = _.pick(req.params, 'uid');

        let user = await User.findOne({
            numeric_id: params.uid
        });

        if (!user) {
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'testTXNGet');

            return res.render('testtxn.ejs', {
                status: 0,
                title: localization.tokenExpired
            });
        } else {
            // var a = uniqid();
            // var b = params.uid;

            let order_id = utility.objectId();

            //var order_id = `${b}${a}`;
            // var order_id = uniqid();
            // var maxNumId = await Transaction.find({}, ['order_id'])
            //     .sort({
            //         order_id: -1
            //     })
            //     .limit(1);
            // var order_id;
            // if (maxNumId.length == 0) order_id = 10000;
            // else {
            //     if (maxNumId[0].order_id) order_id = parseInt(maxNumId[0].order_id) + 1;
            //     else order_id = 10000;
            // }
            logger.info('order_id---->', order_id);
            let data = _.pick(user, '_id', 'name', 'main_wallet', 'numeric_id');
            data.order_id = order_id;
            data.user_id = data._id;

            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'testTXNGet');

            res.render('testtxn.ejs', {
                status: 1,
                data: data,
                config: config,
                host: config.pre + req.headers.host
            });
        }
    },

    testtxnPost: async function(req, res) {
        let startTime = new Date();
        // logger.info("POST Order start");
        let paramarray = _.pick(
            req.body,
            'MID',
            'ORDER_ID',
            'CUST_ID',
            'INDUSTRY_TYPE_ID',
            'CHANNEL_ID',
            'TXN_AMOUNT',
            'WEBSITE'
        );
        paramarray.CALLBACK_URL = config.live_url + '/response'; //'http://localhost:3001/response'; // in case if you want to send callback
        paramarray.MERC_UNQ_REF = req.body.USERID;
        // logger.info("paramarray >>", paramarray);
        checksum.genchecksum(paramarray, config.PAYTM_MERCHANT_KEY, async function(err, result) {
            // logger.info("Result", result);

            let newOrder = new Transaction({
                user_id: result.MERC_UNQ_REF,
                txn_amount: result.TXN_AMOUNT,
                txn_win_amount: 0,
                txn_bonus_amount: 0,
                txn_main_amount: result.TXN_AMOUNT,
                order_id: result.ORDER_ID,
                created_at: new Date().getTime(),
                txn_id: '',
                checksum: result,
                main_wallet_closing: 0,
                win_wallet_closing: 0,
                transaction_type: 'C',
                txn_mode: 'P'
            });

            let newOrderSave = await newOrder.save();

            if (!newOrderSave) {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'testTXNPost');

                return res.render('pgredirect.ejs', {
                    status: 0,
                    msg: localization.ServerError
                });
            } else {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'testTXNPost');

                return res.render('pgredirect.ejs', {
                    status: 1,
                    restdata: result
                });
            }
            // var endTime = new Date();
            // utility.logElapsedTime(req, startTime, endTime, "testTXNPost");

            // return res.render('pgredirect.ejs', {
            //     status: 1,
            //     restdata: result
            // });
        });

        // logger.info("POST Order end");
    },

    response: async function(req, res) {
        let startTime = new Date();

        // logger.info("in response post");
        let paramlist = req.body;
        let paramarray = _.pick(paramlist, 'ORDERID', 'MID', 'TXNID', 'TXNAMOUNT', 'STATUS', 'RESPMSG', 'MERC_UNQ_REF');
        if (checksum.verifychecksum(paramlist, config.PAYTM_MERCHANT_KEY)) {
            // logger.info("true");
            let status;
            if (paramarray.STATUS == 'TXN_SUCCESS' && paramarray.RESPMSG == 'Txn Success') {
                status = 'S';
            } else if (paramarray.STATUS == 'PENDING') {
                status = 'P';
            } else {
                status = 'F';
            }

            let filter = {
                order_id: paramarray.ORDERID,
                user_id: paramarray.MERC_UNQ_REF
            };
            let update = {
                txn_id: paramarray.TXNID,
                is_status: status,
                resp_msg: paramarray.RESPMSG
            };

            let order = await Transaction.findOne(filter); 

            if (order) {
                let orderUpdate = await order.updateOne(update);
                if (orderUpdate) {
                    let user = await User.findOne({
                        _id: paramarray.MERC_UNQ_REF
                    });

                    if (user) {
                        // user.main_wallet = user.main_wallet + parseInt(paramarray.TXNAMOUNT);
                        // var balnceUpdate = await user.save();
                        if (status == 'S') {
                            user.main_wallet = user.main_wallet + parseInt(paramarray.TXNAMOUNT);
                            var balnceUpdate = await user.save();
                        }

                        if (balnceUpdate) {
                            //logger.info('true');
                            var endTime = new Date();
                            utility.logElapsedTime(req, startTime, endTime, 'response');

                            res.render('response.ejs', {
                                status: 1,
                                msg: paramarray.RESPMSG,
                                host: config.pre + req.headers.host
                            });
                        } else {
                            //logger.info("false");
                            var endTime = new Date();
                            utility.logElapsedTime(req, startTime, endTime, 'response');

                            return res.render('response.ejs', {
                                status: 0,
                                msg: Service.ServerError,
                                host: config.pre + req.headers.host
                            });
                        }
                    } else {
                        //logger.info("false");
                        var endTime = new Date();
                        utility.logElapsedTime(req, startTime, endTime, 'response');

                        return res.render('response.ejs', {
                            status: 0,
                            msg: Service.ServerError,
                            host: config.pre + req.headers.host
                        });
                    }
                } else {
                    //logger.info("false");
                    var endTime = new Date();
                    utility.logElapsedTime(req, startTime, endTime, 'response');

                    return res.render('response.ejs', {
                        status: 0,
                        msg: Service.ServerError,
                        host: config.pre + req.headers.host
                    });
                }
            } else {
                //logger.info("false");
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'response');

                return res.render('response.ejs', {
                    status: 0,
                    msg: 'Invalid order.'
                });
            }
        } else {
            //logger.info("false");
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'response');

            return res.render('response.ejs', {
                status: 0,
                msg: Service.tokenExpired
            });
        }
    },

    //for cache implementation
    transactionsHistory: async function(req, res) {
        let startTime = new Date();

        //logger.info("Transactions History Request >> ", req.user._id);

        let key_userTransactionHistory = 'userTransactionHistory' + req.user._id;

        userHistory = await Transaction.find({
            $or: [{
                    user_id: req.user._id,
                    transaction_type: { $ne: 'D' }
                },
                {
                    user_id: req.user._id,
                    txn_mode: { $ne: 'A' }
                }
            ]
        });

        userHistory = userHistory.map(d => {
            return {
                status: d.is_status,
                txn_amount: d.txn_amount,
                txn_win_amount: d.txn_win_amount || 0,
                txn_bonus_amount: d.txn_bonus_amount || 0,
                txn_main_amount: d.txn_main_amount || 0,
                txn_type: d.txn_mode || 'G',
                created_at: d.created_at
            };
        });

        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'transactionHistory');

        return res.status(200).json(Service.response(1, localization.TransactionsHistory, userHistory));
    },

    transactionList: async limit => {
        const transaction = await Transaction.find({})
            .populate('user_id')
            .sort({
                created_at: -1
            })
            .limit(limit);

        let list = await Promise.all(
            transaction.map(async u => {
                if (u.user_id) {
                    return {
                        order_id: u.order_id,
                        username: _.capitalize(u.user_id.username),
                        user_id: u.user_id._id,
                        txn_amount: u.txn_amount,
                        win_wallet: u.txn_win_amount || 0,
                        bonus_wallet: u.txn_bonus_amount || 0,
                        main_wallet: u.txn_main_amount || 0,
                        created_at: u.created_at, //await Service.formateDateandTime(parseInt(u.created_at)),
                        is_status: u.is_status,
                        msg: u.resp_msg || 'No Data Found',
                        txn_mode: u.txn_mode || 'G'
                    };
                } else {
                    return false;
                }
            })
        );

        let count = await Transaction.countDocuments();
        return {
            list: list.filter(d => d),
            count: count
        };
    },

    transactionListPending: async limit => {
        const transaction = await Transaction.find({
                is_status: 'P',
                checksum: { $exists: true }
            })
            .populate('user_id')
            .sort({
                created_at: -1
            })
            .limit(limit);

        let list = await Promise.all(
            transaction.map(async u => {
                if (u.user_id) {
                    return {
                        order_id: u.order_id,
                        username: _.capitalize(u.user_id.username),
                        user_id: u.user_id._id,
                        txn_amount: u.txn_amount,
                        win_wallet: u.txn_win_amount || 0,
                        bonus_wallet: u.txn_bonus_amount || 0,
                        main_wallet: u.txn_main_amount || 0,
                        created_at: u.created_at, //await Service.formateDateandTime(parseInt(u.created_at)),
                        is_status: u.is_status,
                        msg: u.resp_msg || 'No Data Found',
                        txn_mode: u.txn_mode || 'G'
                    };
                } else {
                    return false;
                }
            })
        );

        let count = await Transaction.countDocuments({
            is_status: 'P',
            checksum: { $exists: true }
        });
        return {
            list: list.filter(d => d),
            count: count
        };
    },

    getTxnAjax: async function(req, res) {
        let startTime = new Date();

        const params = req.query;

        let matchObj = {};
        if (params.search) {
            if (params.search.value.trim() != '') {
                matchObj['$or'] = [{
                    order_id: {
                        $regex: params.search.value,
                        $options: 'i'
                    }
                }, {
                    resp_msg: {
                        $regex: params.search.value,
                        $options: 'i'
                    }
                }];
            }
        }

        let sortObj = {};
        if (params.order) {
            if (params.order[0]) {
                if (params.order[0].column == '2') {
                    // SORT BY TXN AMOUNT amount will be in assending order
                    sortObj.txn_amount = params.order[0].dir == 'asc' ? 1 : -1;
                } else if (params.order[0].column == '3') {
                    // SORT BY WIN WALLET
                    sortObj.txn_win_amount = params.order[0].dir == 'asc' ? 1 : -1;
                } else if (params.order[0].column == '4') {
                    // SORT BY MAIN WALLET
                    sortObj.txn_main_amount = params.order[0].dir == 'asc' ? 1 : -1;
                // } else if (params.order[0].column == '5') {
                //     // SORT BY MAIN WALLET
                //     sortObj.txn_bonus_amount = params.order[0].dir == 'asc' ? 1 : -1;
                } else if (params.order[0].column == '6') {
                    // SORT BY DATE
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

        const user_id = params.id || '';

        if (Service.validateObjectId(user_id)) {
            matchObj.user_id = ObjectId(user_id);
        }

        if (!_.isEmpty(params.status)) {
            matchObj.is_status = params.status;
        }

        if (!_.isEmpty(params.type)) {
            matchObj.txn_mode = params.type;
        }

        let aggregation_obj = [];

        logger.info('OBJMATCH', matchObj);

        if (matchObj != {})
            aggregation_obj.push({
                $match: matchObj
            });

        console.log("AGG", aggregation_obj);
        aggregation_obj.push({
                $sort: sortObj
            }, {
                $skip: params.start == 'All' ? 0 : parseInt(params.start)
            }
            // limit
            // { $limit: params.length == -1 ? null :  parseInt(params.length) },
        );

        if (params.length != -1) {
            aggregation_obj.push({
                $limit: parseInt(params.length)
            });
        }

        aggregation_obj.push({
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'users'
            }
        }, {
            $unwind: '$users'
        });

        aggregation_obj.push({
            $project: {
                _id: 1,
                txn_win_amount: 1,
                txn_bonus_amount: 1,
                txn_main_amount: 1,
                created_at: 1,
                txn_amount: 1,
                username: '$users.username',
                user_id: '$users._id',
                resp_msg: 1,
                order_id: 1,
                is_status: 1,
                txn_mode: 1
            }
        });

        logger.info('AGGRE', JSON.stringify(aggregation_obj, undefined, 2));

        let list = await Transaction.aggregate(aggregation_obj).allowDiskUse(true);
        let aggregate_rf = [];

        if (matchObj) {
            aggregate_rf.push({
                $match: matchObj
            });
        }

        aggregate_rf.push({
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        });

        logger.info('aggregate_rf', aggregate_rf);
        let rF = await Transaction.aggregate(aggregate_rf).allowDiskUse(true);

        logger.info('RF', rF);
        let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
        let recordsTotal = await Transaction.find({}).countDocuments();

        list = await Promise.all(
            list.map(async u => {
                //logger.info("User Transaction",u);
                let txn_amount = u.txn_amount;
                if (u.txn_amount > 0) {
                    txn_amount = '<span class="label label-success">' + u.txn_amount + '</span>';
                } else {
                    txn_amount = '<span class="label label-danger">' + u.txn_amount + '</span>';
                }

                let payment_mode = u.txn_mode;
                if (u.txn_mode == 'G') {
                    payment_mode = 'GAME';
                } else if (u.txn_mode == 'P') {
                    payment_mode = 'Payment';
                    console.log("UU", u.payment_mode)
                    if (!u.payment_mode)
                        payment_mode += ' - Paytm'
                    else if (u.payment_mode == 'PA')
                        payment_mode += ' - Paytm'
                    else if (u.payment_mode == 'N/A')
                        payment_mode += ''
                    else
                        payment_mode += ' - Cashfree ' + u.payment_mode;
                } else if (u.txn_mode == 'A') {
                    payment_mode = 'ADMIN';
                } else if (u.txn_mode == 'B') {
                    payment_mode = 'BONUS';
                } else if (u.txn_mode == 'R') {
                    payment_mode = 'REFUND';
                } else if (u.txn_mode == 'A') {
                    payment_mode = 'REFERRAL';
                } else if (u.txn_mode == 'O') {
                    payment_mode = 'OTHER';
                }

                let status_ = u.is_status;

                if (status_ == 'P') {
                    status_ = '<span class="label label-warning">Pending</span>';
                } else if (status_ == 'S') {
                    status_ = '<span class="label label-success">Success</span>';
                } else {
                    status_ = '<span class="label label-danger">Failed</span>';
                }

                return [
                    u.order_id,
                    `<a  href="${config.pre + req.headers.host}/user/view/${u.user_id}">${_.capitalize(
                        u.username
                    )}</a>`,
                    txn_amount,
                    u.txn_win_amount || 0,
                    u.txn_main_amount || 0,
                    u.txn_bonus_amount || 0,
                    // `<div class="time_formateDateandTime2">${u.created_at}</div>`,
                    u.created_at,
                    payment_mode,
                    u.resp_msg ? u.resp_msg : 'No Data Found',
                    status_
                ];
            })
        );

        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'getTXNAjax');

        return res.status(200).send({
            data: await list,
            draw: new Date().getTime(),
            recordsTotal: recordsTotal,
            recordsFiltered: recordsFiltered
        });
    },

    withdrawRequest: async(req, res) => {
        let startTime = new Date();

        try {
            const params = _.pick(req.body, [
                'amount',
                'account_name',
                'account_no',
                'bank_name',
                'ifsc_code',
                'payment_type',
                'mobile_no'
            ]);
            //logger.info('Withdrawal Request :: ', params);

            if (_.isEmpty(params.payment_type)) {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                return res.status(200).json(Service.response(0, localization.missingParamError, null));
            }

            if (params.amount <= 0) {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                return res.status(200).json(Service.response(0, localization.invalidAmountError, null));
            }

            if (params.payment_type.trim() != 'paytm' && params.payment_type.trim() != 'bank') {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                return res.status(200).json(Service.response(0, localization.paymentTypeValidationError, null));
            }

            if (params.payment_type == 'paytm') {
                if (_.isEmpty(params.amount) || _.isEmpty(params.mobile_no)) {
                    var endTime = new Date();
                    utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                    return res.status(200).json(Service.response(0, localization.missingParamError, null));
                }

                const us = await User.findById(req.user._id);

                if (!us) {
                    var endTime = new Date();
                    utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                    return res.status(200).json(Service.response(0, localization.ServerError, null));
                }

                if (params.amount < 50) {
                    var endTime = new Date();
                    utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                    return res.status(200).json(Service.response(0, localization.minWithdrawalLimit, null));
                }

                if (us.win_wallet < params.amount) {
                    var endTime = new Date();
                    utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                    return res.status(200).json(Service.response(0, localization.insufficientWithdrawlError, null));
                }

                if (!us.otp_verified || !us.email_verified) {
                    var endTime = new Date();
                    utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                    return res.status(200).json(Service.response(0, localization.accountVerifiedError, null));
                }

                const wq = new WithdrawalRequest({
                    user_id: us._id,
                    amount: params.amount,
                    payment_type: params.payment_type,
                    mobile_no: params.mobile_no,
                    created_at: new Date().getTime()
                });

                us.win_wallet = us.win_wallet - params.amount;
                var t = await us.save();
                // if (t) {
                //     logger.info("amount deducted", us.win_wallet);
                // }
                const rez = await wq.save();

                if (!rez) {
                    var endTime = new Date();
                    utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                    return res.status(200).json(Service.response(0, localization.ServerError, null));
                }
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                return res.status(200).json(Service.response(1, localization.success, null));
            }

            if (params.payment_type == 'bank') {
                if (
                    _.isEmpty(params.amount) ||
                    _.isEmpty(params.account_name) ||
                    _.isEmpty(params.account_no) ||
                    _.isEmpty(params.bank_name) ||
                    _.isEmpty(params.ifsc_code)
                ) {
                    var endTime = new Date();
                    utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                    return res.status(200).json(Service.response(0, localization.missingParamError, null));
                }
            }

            if (params.amount < 50) {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                return res.status(200).json(Service.response(0, localization.minWithdrawalLimit, null));
            }

            if (req.user.win_wallet < params.amount) {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                return res.status(200).json(Service.response(0, localization.insufficientWithdrawlError, null));
            }

            if (!req.user.otp_verified || !req.user.email_verified) {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                return res.status(200).json(Service.response(0, localization.accountVerifiedError, null));
            }

            const weq = new WithdrawalRequest({
                user_id: req.user._id,
                amount: params.amount,
                account_name: params.account_name,
                account_no: params.account_no,
                bank_name: params.bank_name,
                ifsc_code: params.ifsc_code,
                payment_type: params.payment_type,
                mobile_no: req.user.mobile_no.number,
                created_at: new Date().getTime()
            });

            //logger.info('With Request :: ', weq);

            req.user.win_wallet = req.user.win_wallet - params.amount;
            var t = await req.user.save();
            // if (t) {
            //     logger.info("amount deducted", req.user.win_wallet);
            // }

            const result = await weq.save();

            if (!result) {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

                return res.status(200).json(Service.response(0, localization.ServerError, null));
            }
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

            res.status(200).json(Service.response(1, localization.success, null));
        } catch (err) {
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'withdrawRequest');

            res.status(200).json(Service.response(0, localization.ServerError, err.message));
        }
    },

    // for cache implementation
    gameRecords: async function(req, res) {
        let startTime = new Date();

        //logger.info("Game Records Request >> ", req.body);

        userHistory = await Table.find({
            'players.id': req.user._id
        }, {
            room: 1,
            created_at: 1,
            'players.$': 1
        });

        userHistory = userHistory.filter(d => d.players[0].fees != 0);

        userHistory = userHistory.map(d => {
            return {
                room: d.room,
                fees: d.players[0].fees,
                pl: d.players[0].pl,
                created_at: d.created_at || 0
            };
        });

        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'gameRecords');

        return res.status(200).json(Service.response(1, localization.TransactionsHistory, userHistory));
    },

    withdrawHistory: async(req, res) => {
        let startTime = new Date();

        try {
            //logger.info("Withdrawal History Request >> ", req.body);

            let withdrawalHistory = await WithdrawalRequest.find({
                user_id: req.user._id
            });

            withdrawalHistory = withdrawalHistory.map(d => {
                return {
                    mode: d.payment_type,
                    amount: d.amount,
                    status: d.is_status,
                    created_at: d.created_at || 0
                };
            });
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'withdrawHistory');

            return res.status(200).json(Service.response(1, localization.TransactionsHistory, withdrawalHistory));
        } catch (err) {
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'withdrawHistory');

            res.status(200).json(Service.response(0, localization.ServerError, err.message));
        }
    },

    listAllAjaxGameRecode: async(req, res) => {
        let startTime = new Date();

        try {
            const params = req.query;
            logger.info('QUERY', params);
            logger.info(params.start);

            let matchObj = {
                $expr: {
                    $eq: [
                        '$no_of_players',
                        { $size: '$players' }
                    ]
                }
            };

            const user_id = params.id || '';

            if (Service.validateObjectId(user_id)) {
                matchObj['players.id'] = ObjectId(user_id);
            }

            if (!_.isEmpty(params.type)) {
                matchObj['room_type'] = params.type;
            }

            if (!_.isEmpty(params.players) && !isNaN(params.players)) {
                matchObj['no_of_players'] = parseInt(params.players);
            }

            if (!_.isEmpty(params.amount) && !isNaN(params.amount)) {
                matchObj['room_fee'] = parseInt(params.amount);
            }

            if (params.search.value.trim() != '') {
                matchObj.room = {
                    $regex: params.search.value,
                    $options: 'i'
                };
            }

            let agg = [{
                $match: matchObj
            }];

            let sortObj = {};
            if (params.order) {
                if (params.order[0]) {
                    if (params.order[0].column == '4') {
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

            agg.push({
                $sort: sortObj
            }, {
                $skip: params.start == 'All' ? 0 : parseInt(params.start)
            });

            if (params.length != -1) {
                agg.push({
                    $limit: parseInt(params.length)
                });
            }

            agg.push({
                $unwind: '$players'
            }, {
                $lookup: {
                    from: 'users',
                    localField: 'players.id',
                    foreignField: '_id',
                    as: 'users'
                }
            }, {
                $unwind: '$users'
            });

            agg.push({
                $group: {
                    _id: '$_id',
                    room: {
                        $first: '$room'
                    },
                    room_type: {
                        $first: '$room_type'
                    },
                    no_of_players: {
                        $first: '$no_of_players'
                    },
                    created_by: {
                        $first: '$created_by'
                    },
                    game_started_at: {
                        $first: '$game_started_at'
                    },
                    game_completed_at: {
                        $first: '$game_completed_at'
                    },
                    created_date: {
                        $first: '$created_date'
                    },
                    created_at: {
                        $first: '$created_at'
                    },
                    room_fee: {
                        $first: '$room_fee'
                    },
                    players: {
                        $push: {
                            id: '$players.id',
                            rank: '$players.rank',
                            pl: '$players.pl',
                            username: '$users.username'
                        }
                    }
                }
            });
            agg.push({
                $sort: {
                    created_at: -1
                }
            });
            agg.push({
                $project: {
                    _id: 1,
                    room: 1,
                    room_type: 1,
                    no_of_players: 1,
                    created_by: 1,
                    created_at: 1,
                    game_started_at: 1,
                    game_completed_at: 1,
                    created_date: 1,
                    room_fee: 1,
                    players: 1,
                    data: 1
                }
            });

            // logger.info('AGGR', agg);

            const llist = await Table.aggregate(agg).option({
                allowDiskUse: true
            });

            let gData = await Promise.all(
                llist.map(async u => {
                    let datatoRender = '';

                    if (u.players.length > 0) {
                        for (let ij = 0; ij < u.players.length; ij++) {
                            datatoRender += `<tr>
                        <td><a href="/user/view/${u.players[ij].id}">${u.players[ij].username}</a></td>
                        <td>${u.players[ij].rank}</td>
                        <td>${u.players[ij].pl}</td>
                        </tr>`;
                        }
                    }
                    logger.info("span class >>>111>", `<span class="label label-${u.room_type == 'PUB' ? 'success' : 'info'}">${u.room_type == 'PUB' ? 'Public' : u.room_type == 'TOURNEY' ? 'Tournament' : 'Private'
                }</span>`);
                    return [
                        u.room,
                        u.room_type,
                        u.no_of_players,
                        u.room_fee,
                        `<div class="time_formateDateandTime2">${u.created_at}</div>`,
                        `<table class="table">
                        <tr class="success">
                            <th>User</th>
                            <th>Rank</th>
                            <th>Winnings</th>
                        </tr>
                        ${datatoRender}
                    </table>`
                    ];
                })
            );

            let total = await Table.find({
                $expr: {
                    $eq: [
                        '$no_of_players',
                        { $size: '$players' }
                    ]
                }
            }).countDocuments();
            let total_f = await Table.find(matchObj).countDocuments();

            // logger.info('Final Returned Data :: ',gData);
            // logger.info("LLIST", llist);
            let endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'listAllAjaxGameRecode');

            return res.status(200).send({
                data: gData,
                draw: new Date().getTime(),
                recordsTotal: total,
                recordsFiltered: total_f
            });
        } catch (err) {
            logger.info('ERR', err);
        }
    },
};