const mongoose = require('mongoose');
const bankDetailSchema = new mongoose.Schema({

    userId : {
        type : mongoose.Schema.ObjectId,
        required : true,
        ref: "User",
    },
    type:{
        type:String,
        required : true,
        enum:['upi','bank']
    },
    upi_id:{
        type:String,  
    },
    account_number:{
        type:Number,
    },
    ifsc_code:{
        type:String,
    },
    account_holder_name:{
        type:String,
    }

},{timestamps:true});

module.exports = mongoose.model('bankDetail' , bankDetailSchema);