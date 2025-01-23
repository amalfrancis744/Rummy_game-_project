const mongoose = require('mongoose');


const gameModeSchema = new mongoose.Schema({

    gametype : {
        type : String,
        required : true
    },
    code : {
        type : String,
        default :''
    },
    createdAt : {
        type : String,
        default : ""
    }

});


module.exports = mongoose.model('gameMode' , gameModeSchema);