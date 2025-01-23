let mongoose = require('mongoose')

let WalletDetailsModel = new mongoose.Schema({
    user:{
        type: mongoose.Schema.ObjectId,
        requried: true,
        ref: "User",
    },
    transaction_type : {
        type : String,
        requried: true,
        default : ''
    },
    amount:{
        type:Number,
        requried: true,
        default:0
    },
    status:{
        type:String,
        requried: true,
    }
   
},{timestamps:true});

module.exports = mongoose.model('WalletDetails', WalletDetailsModel);