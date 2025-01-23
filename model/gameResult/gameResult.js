const mongoose = require('mongoose')

let gameResultModel = new mongoose.Schema({
    user:{
        type: mongoose.Schema.ObjectId,
        requried: true,
        ref: "User",
    },
    game_code:{
        type:Number,
        default:0
    },
    game_type:{
        type:String,
        default:'',
    },
    opponent:{
        type: mongoose.Schema.ObjectId,
        requried: true,
        ref: "User",
    },
    match_amount:{
        type:Number,
        default:0
    },
    result_type:{
        type:String,
        default:'',
    },
    amount:{
        type:Number,
        default:0
    },
    rummy_type:{
        type:String,
        default:''
    }
},{timestamps:true});

module.exports = mongoose.model('gameResult', gameResultModel);