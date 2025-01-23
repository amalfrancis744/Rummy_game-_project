const mongoose = require('mongoose');

const AdminUserSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
  },
  permissions: {  // list of assigned modules
    type: Array
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('mgp_rummy_admin_user', AdminUserSchema);
