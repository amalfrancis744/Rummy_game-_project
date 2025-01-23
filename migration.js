const path = require('path');
const fs = require('fs');
const logger = require('./util/logger');

const MigrationLock = require('./model/migration-lock');
const Migration = require('./model/migration');

const MIGRATION_DIR = './migrations';

module.exports.run = async () => {
  await MigrationLock.acquireLock();
  try {
    const migrationDirPath = path.join(__dirname, MIGRATION_DIR);

    const files = fs.readdirSync(migrationDirPath).filter(e => e.endsWith('.js'));
    console.log("Migration Files" , files)
    const migratedFiles = [];
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (await Migration.exists({ scriptName: file })) {
        continue;
      }
      const module = require(`${MIGRATION_DIR}/${file}`);
      await module.up()
        .then(async () => {
          await Migration.create({ scriptName: file });
          migratedFiles.push(file);
        })
        .catch(async upError => {
          // eslint-disable-next-line no-console
          console.error('Error while calling up method', file, upError);
          try {
            await module.down();
          } catch (downError) {
            // eslint-disable-next-line no-console
            console.error('Error while calling down method', file, downError);
          }
          throw upError;
        });
    }
    if (migratedFiles.length) {
      logger.info(`Migrated: ${migratedFiles.join(', ')}`);
    }
  } finally {
    await MigrationLock.releaseLock();
  }
};
