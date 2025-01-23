var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DefaultModel = new Schema({
    key: {
        type: String,
        required: true
    },
    undermaintenance: {
        type: String,
        enum: ['Y', 'N'],
        default: 'N'
    },
    value: {
        type: Number,
        default: 0
    }
});

var Default = mongoose.model('Default', DefaultModel);

module.exports = {
    Default
};