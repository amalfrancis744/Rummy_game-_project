let mongoose = require('mongoose'),
    Schema = mongoose.Schema;


let roomSchema = new Schema({
    room: {
        type: String,
        required: true
    },
    room_type: {
        type: String,
        default: ''
    },
    tournamentId : {
        type : String,
        default:''
    },
    no_of_players: {
        type: Number,
        default: 0
    },
    created_by: {
        type: String,
        default: ''
    },
    created_at: {
        type: Number,
        default: 0
    },
    game_started_at: {
        type: String,
        default: '-1'
    },
    game_completed_at: {
        type: String,
        default: '-1'
    },
    created_date: {
        type: Date,
        default: Date.now()
    },
    room_fee: {
        type: Number,
        default: 0
    },
    players: [{
        id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        rank: {
            type: Number,
            default: 0
        },
        fees:{
            type: Number,
            default: 0
        },
        pl:{
            type: Number,
            default: 0
        },  
        is_active:{
            type: Boolean,
            default: false
        },
        status : {
            type : String,
            default : ''
        }
    }],
});

module.exports = mongoose.model('Room', roomSchema);
