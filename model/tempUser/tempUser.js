const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({

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
    otp : {
        type : String,
        required : true        
    },
    otp_verified : {
        type : Boolean,
        default : false
    }

});


module.exports = mongoose.model('tempUser' , tempUserSchema);