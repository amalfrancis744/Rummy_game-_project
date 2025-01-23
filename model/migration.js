const mongoose = require('mongoose');

const MigrationSchema = mongoose.Schema({
  scriptName: {
    type: String,
    unique: true,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('mgp_rummy_migration', MigrationSchema);
