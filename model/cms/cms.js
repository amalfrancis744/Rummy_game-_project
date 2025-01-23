const mongoose = require('mongoose');
const moment = require('moment');

const cmsSchema = new mongoose.Schema({

    title : {
        type : String,
        required : true
    },
    code:{
        type : String,
        default : ''
    },
    active : {
        type : Boolean,
        default : true
    },
    description :{
        type : String,
        required : true
    },
    createdBy : {
        type : String ,
        required : true
    },
    createdAt : {
        type : String,
        default : moment().format('LLL')

    },
    updatedAt : {
        type : String,
        default:""
    },
    uniqueCode : {
        type : String,
        default : null
    }

});

module.exports = mongoose.model('cmsTbl' , cmsSchema);

