let mongoose = require('mongoose'),
    Schema = mongoose.Schema;
let _ = require('lodash');
const config = require('./../../config');
let UserModel = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    numeric_id: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        // unique: true,
        trim: true,
        default: ''
        
    },
    password: {
        type: String,
        default: ''
    },
    mobile_no: {
        country_code: {
            type: String,
            default: ''
        },
        number: {
            type: String,
            trim: true,
            default: ''
        }
    },
    profilepic: {
        type: String,
        trim: true,
        default: ''
    },
    referral: {
        referral_code: String,
        referred_by: String,
        amount: {
            type: Number,
            default: 0
        },
        matches: {
            type: Number,
            default: 0
        },
        first_ref: {
            type: Boolean,
            default: false
        }
    },
    created_at: {
        type: String,
        default: ''
    },
    last_login: {
        type: String,
        default: ''
    },
    main_wallet: {
        type: Number,
        default: 0
    },
    bonus_wallet: {
        type: Number,
        default: 0
    },
    win_wallet: {
        type: Number,
        default: 0
    },
    app_version: {
        type: String,
        default: ''
    },
    facebook_id: {
        type: String,
        default: ''
    },
    device_id: {
        type: String,
        trim: true,
        default: ''
    },
    device_type: {
        type: String,
        enum: ['ios', 'android'],
        default: 'android'
    },
    otp: {
        value: {
            type: String,
            default: ''
        },
        send_attempts: {
            type: Number,
            default: 0
        },
        continuous_false_attempts: {
            type: Number,
            default: 0
        }
    },
    otp_verified: {
        type: Boolean,
        default: false
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    email_token: {
        value: {
            type: String,
            default: ''
        },
        expired_at: {
            type: String,
            default: ''
        }
    },
    reset_token: {
        value: {
            type: String,
            default: ''
        },
        expired_at: {
            type: String,
            default: ''
        },
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    onesignal_id: {
        type: String,
        default: ''
    },
    push_enable: {
        type: Boolean,
        default: true
    },
    ref_bonus_passed: {
        type: Boolean,
        default: false
    },
    user_device: {
        name: {
            type: String,
            default: ''
        },
        model: {
            type: String,
            default: ''
        },
        os: {
            type: String,
            default: ''
        },
        processor: {
            type: String,
            default: ''
        },
        ram: {
            type: String,
            default: ''
        }
    },
    tokens: [
        {
            access: {
                type: String,
                default: ''
            },
            token: {
                type: String,
                default: ''
            }
        }
    ],
    kyc_status: { type: String, default: config.KYC_STATUS.PENDING, enum: _.values(config.KYC_STATUS) },
    bank_kyc_status : { type: String, default: config.BANK_KYC_STATUS.PENDING, enum: _.values(config.BANK_KYC_STATUS) }
});

let User = mongoose.model('User', UserModel);

module.exports = {
    User
};
