var mongoose = require('mongoose');
const config=  require('../config/index');

var TransactionModel = new mongoose.Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    txn_amount: {
        type: Number,
        required: true,
        default: 0
    },
    txn_win_amount: {
        type: Number,
        required: true,
        default: 0
    },
    txn_main_amount:{
        type: Number,
        required: true,
        default: 0    
    },
    txn_bonus_amount:{
        type: Number,
        required: true,
        default: 0    
    },
    txn_id: {
        type: String,
        default: ""
    },
    order_id: {
        type: String,
        required: true
        // unique: true
    },
    created_at: {
        type: String
    },
    main_wallet_closing: {
        type: Number,
        default: 0
    },
    win_wallet_closing: {
        type: Number,
        default: 0
    },
    transaction_type: {
        type: String,
        enum: ['C', 'D'], // C = Credit, D = Debit
        default: "C"
    },
    checksum:{
        type: Schema.Types.Mixed
    },
    resp_msg:{
        type: String,
        default: ""
    },
    txn_mode: {
        type: String,
        enum: ['G', 'P', 'A','B', 'R', 'O', 'REF'] //G = Game, P = Paytm, A = By Admin,  B = Bonus, R = Refund, REF = Referral, O =  Other
    },
    payment_mode: {
        type: String,
        enum: Object.values(config.payment_modes),
        default: config.payment_modes.PA
        // PA = Paytm_Old , OTHERS
    },
    is_status: {
        type: String,
        enum: ['P', 'S', 'F', 'C', 'FL'], // P = Pending, S = Success, F = Failed, C = Canceled, FL = Flagged suspecious
        default: 'P'
    }
});

module.exports = mongoose.model('Transaction', TransactionModel);

