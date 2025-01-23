var CronJob = require('cron').CronJob;
var Backup = require('mongodb-backup');
var config = require('../config');
var Service = require('../api/service');
var fs = require('fs');
const Table = require('../api/models/table');
var path = `${new Date().getDate()+'-'+(new Date().getMonth()+1)+'-'+new Date().getFullYear()}.tar`;
var url = 'dbbackup/'+path;
var logger = require('../api/service/logger');

// DAILY 2:30 AM , Take Backup of Database '0 30 02 * * *
new CronJob('30 2 * * *', async function () {
  console.log("Cron Executed");
  // FIX_2407 : ALREADY PLAYING
  let tabs = await Table.deleteMany({ 'game_completed_at': '-1','created_at':{$lt:new Date().getTime() - 3600000}, $expr: { $ne: ["$no_of_players", { $size: "$players" }] } });
  console.log("remove",tabs);
}, null, true, 'Asia/Kolkata');