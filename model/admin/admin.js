const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema({

    firstName : {
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : true
    }, 
    emailAddress : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    profilePic : {
        type : String,
        required : true
    },
    token : {
        type : String,
        default : ""
    }

});

module.exports = mongoose.model('adminTbl' , adminSchema);