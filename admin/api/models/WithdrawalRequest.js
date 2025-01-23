var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WithdrawalModel = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    account_name: {
        type: String,
        trim: true,
    },
    account_no: {
        type: String
    },
    bank_name: {
        type: String,
        trim: true,
    },
    ifsc_code: {
        type: String
    },
    payment_type: {
        type: String,
        enum: ['paytm', 'bank','phonepe','google_pay'], // P = Paytm, B = Bank Transfer, P = PhonePe, G = Google Pay
        default: "bank"
    },
    mobile_no: {
        type: String,
        maxlength:12
    },
    upi_id: {
        type: String
    },
    created_at: {
        type: String
    },
    completed_at:{
        type: String
    },
    is_status: {
        type: String,
        enum: ['P', 'A', 'R'], // P = Pending, A = Accept, R = Reject
        default: 'P'
    }
});

var WithdrawalRequest = mongoose.model('WithdrawalRequest', WithdrawalModel);

module.exports = { WithdrawalRequest };