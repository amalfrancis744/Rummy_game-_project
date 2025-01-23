const mongoose = require('mongoose');

const ActuatorSchema = mongoose.Schema({}, { timestamps: true });

module.exports = mongoose.model('mgp_rummy_actuator', ActuatorSchema);
