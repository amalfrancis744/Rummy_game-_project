



let mongoose = require('mongoose')
const moment = require('moment');

let TableModel = new mongoose.Schema({
    rummy_type: {     //Game play Modes - pool or point
        type: String,
        required: true
    },
    rummy_points : {     //rummy points will be 101 or 201
        type : String,
        default : ''
    },
    game_mode: {     //Game Modes  - Best of 2, 3 , online rummy , etc
        type: String,
        default: ''
    },
    no_of_players: {
        type: Number,
        default: 0
    },
    point_value:{
        type : Number,
        default : 0
    },
    entry_fee: {
        type: Number,
        default: 0
    },
    win_amount:{
        type: Number,
        default: 0
    },
    admin_commission:{
        type:Number,
        default : 0
    },
    created_at: {
        type: String,
        default: moment().format('LLL')
    },
    action:{
        type:String,
    }
});

module.exports = mongoose.model('Table', TableModel);