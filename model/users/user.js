let mongoose = require('mongoose');
const _ = require('lodash');
const config = require('../../admin/config/index');
const moment = require('moment');

let UserModel = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
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
    referralCode : {
        type : String,
        default :''
    },
    referral: {
        type : String,
        default : ''
    },
    referralCount: {
        type : Number ,
        default : 0
    },
    created_at: {
        type: String,
        default: moment().format('LLL')
    },
    last_login: {
        type: String,
        default: ''
    },
    main_wallet: {
        type: Number,
        default: 4000
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
    apple_id : {
        type : String,
        default:''
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
        deviceName: {
            type: String,
            default: ''
        },
        deviceModel: {
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
        },
        deviceToken : {
            type :String,
            default : ''
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
    kyc_status: { 
        type: String, 
        default: config.KYC_STATUS.PENDING, 
        enum: _.values(config.KYC_STATUS) 
    },
    
    bank_kyc_status : { 
        type: String, 
        default: config.BANK_KYC_STATUS.PENDING, 
        enum: _.values(config.BANK_KYC_STATUS) 
    } ,
   
    login_type : {
        type : String,
        default : ''
    },
    games_played : {
        type : Array,
        default :[]
    },
    games_won : {
        type : Number,
        default : 0
    },
    referral_count : {
        type : Number ,
        default : 0
    },
    socketId : {
        type : String,
        default:''
    }
});

module.exports =  mongoose.model('User', UserModel);
