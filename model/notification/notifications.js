const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({

    type : {
        type : String,
        required : true,   //inApp and push
    },
    user_type : {
        type : String,
        required : true,   //all and custom
    },
    title : {
        type : String,
        default : ''
    },
    users : [{
        userId : {
            type: mongoose.Schema.ObjectId,
            requried: true,
            ref: "User",
        },
        isViewed : {
            type : Boolean,
            default : false
        }
    }],
    sentAt : {
        type : String,
        default : ''
    },
    message : {
        type : String,
        default:'',
        required : true
    },
    is_sent:{
        type:Boolean,
        default: false
    },
    action : {
        type: String
    },
});


module.exports = mongoose.model('notification' , notificationSchema);