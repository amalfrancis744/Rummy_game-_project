const mongoose = require('mongoose');


const referralSchema = new mongoose.Schema({

    referredFrom : {
        type : String,
        default :''
    },
    referredTo : {
        type : String,
        default:''
    },
    referredBonus : {
        type : String,
        default : ''
    },
    joinedBonus : {
        type : String,
        default : ''
    }
    
});


module.exports = mongoose.model('referralList' , referralSchema);