const mongoose = require('mongoose');
const moment = require('moment');

const settingSchema = new mongoose.Schema({

    apiKey : {
        type : String,
        required: true
    },
    key:{
        type : String,
        required : true
    },
    value : {
        type : String,
        default : null
    },
    createdAt : {
        type : String,
        default : moment().format('LLL')
    },
    updatedAt : {
        type : String,
        default : ""
    },
    createdBy : {
        type : String,
        required : true
    },
    type : {
        type : String,
        default : null
    },
    selectionOption: {
        type : String,
        default : "Yes,No"
    },
    deleted : {
        type : Boolean,
        default : false
    }

});

module.exports = mongoose.model('setting' , settingSchema);