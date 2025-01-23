let mongoose = require('mongoose')

let reportModel = new mongoose.Schema({
    user:{
        type: mongoose.Schema.ObjectId,
        requried: true,
        ref: "User",
    },
    reported_player:{
        type: mongoose.Schema.ObjectId,
        requried: true,
        ref: "User",
    },
    gameId:{
        type: mongoose.Schema.ObjectId,
        requried: true,
        ref: "Table",
    },
    reason: {
        type : Array,
        default : [],
    },
    description:{
        type:String,
        default: '',
    },
    report_count:{
        type:Number,
        default:1
    },
    status:{
        type:Boolean,
        requried: false     // block and unblock
    }
   
},{timestamps:true});

module.exports = mongoose.model('report', reportModel);