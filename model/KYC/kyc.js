const mongoose = require('mongoose');
const config = require('../../config/index');
const _ = require('lodash');

const kycSchema = new mongoose.Schema({

    userId : {
        type : mongoose.Schema.ObjectId,
        required : true,
        ref: "User",
    },
    kyc_status: { 
        type: String, 
        default: config.KYC_STATUS.PENDING, 
        enum: _.values(config.KYC_STATUS) 
    },
    passport : {
        type : String,
        default : ''
    },
    driving_licence_front : {
        type : String,
        default:''
    },
    driving_licence_back : {
        type : String,
        default:''
    },
    name:{
        type:String,
        default:''
      },
    email:{
        type:String,
        default:''
    },
    dob:{
        type:String,
        default:''
    },

},{ timestamps: true });

module.exports = mongoose.model('kycDetail' , kycSchema);