const os = require('os');
const logger = require('../util/logger');

const mongoose = require('mongoose');

const MigrationLockSchema = mongoose.Schema({
  isLocked: {
    type: Boolean,
  },
  lockedBy: {
    type: String,
  },
  uid: {
    type: String,
  },
  gid: {
    type: String,
  },
  env: {
    type: String
  },
  os: {
    type: String
  },
}, {
  timestamps: true
});

const model = mongoose.model('mgp_rummy_migration_lock', MigrationLockSchema);

const locks = [];

model.acquireLock = async () => {
  const utils = require('../util/utils');

  const userInfo = os.userInfo();
  const json = {
    isLocked: true,
    lockedBy: userInfo.username,
    uid: userInfo.uid,
    gid: userInfo.gid,
    env: process.env.NODE_ENV,
    os: `${os.type()} [${os.platform()}]`,
  };

  while (await model.exists({ isLocked: true })) {
    logger.info('Migration lock is already acquired, waiting for 5000ms');
    await utils.sleep(5000);
  }
  const entity = await model.create(json);
  logger.info('Migration lock acquired');
  locks.push(entity._id);
  await model.deleteMany({ isLocked: false });
};

model.releaseLock = async () => {
  if (locks.length) {
    await model.findByIdAndDelete(locks[0]);
    locks.splice(0, 1);
  }
  logger.info('Migration lock released');
};


module.exports = model;
