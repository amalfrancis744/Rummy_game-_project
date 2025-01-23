const AdminUser = require('../model/admin-user');

const passwordUtil = require('../util/password-util');

module.exports = {

  up: async function () {
    await AdminUser.create([
      {
        _id: '61efd2576835f10e9461418f',
        email: 'superadmin',
        username: 'superadmin',
        password: passwordUtil.cryptPassword('Test@123'),
        role: 'SuperAdmin',
      },
    ]);
  },

  down: async function () {
    throw new Error('Unsupported method down');
  }

};
