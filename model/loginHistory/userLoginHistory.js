const mongoose = require('mongoose');
const moment = require('moment');

const UserLoginHistorySchema = new mongoose.Schema({

    user:{
        type: mongoose.Schema.ObjectId,
        requried: true,
        ref: "user",
    },
    os:{
        type:String,
        default:''
    },
    ip:{
        type:String,
        default:''
    },
    city:{
        type:String,
        default:''
    },
    state:{
        type:String,
        default:''
    },
    region:{
        type:String,
        default:''
    },
    country:{
        type:String,
        default:''
    },
    login_date:{
        type:String,
        default: moment().format('LLL')
    },
    is_login:{
        type:Boolean,
        default:true
    },
    logout_date:{
        type:String,
        default:''
    }
});

module.exports = mongoose.model('UserLoginHistory' , UserLoginHistorySchema);