const { DateTime } = require('luxon');
const moment = require('moment-timezone');

function getWeekStart(timezone, timestamp) {
  timezone = timezone || 'UTC';
  let date = timestamp ? moment(timestamp) : moment();
  date = date.startOf('week');
  date = moment.tz(date.toISOString().split('.')[0], timezone).toDate();
  return date;
}

function getWeekEnd(timezone, timestamp) {
  timezone = timezone || 'UTC';
  let date = timestamp ? moment(timestamp) : moment();
  date = date.endOf('week');
  date = moment.tz(date.toISOString().split('.')[0], timezone).toDate();
  return date;
}

function getStartOf(timezone, timestamp, type) {
  if ('week' === type) {
    return getWeekStart(timezone, timestamp);
  }
  timezone = timezone || 'Asia/Kolkata';
  let date = timestamp ? DateTime.fromJSDate(new Date(timestamp)) : DateTime.local();
  date = date.setZone(timezone).startOf(type);
  return date.toJSDate();
}

function getEndOf(timezone, timestamp, type) {
  if ('week' === type) {
    return getWeekEnd(timezone, timestamp);
  }
  timezone = timezone || 'Asia/Kolkata';
  let date = timestamp ? DateTime.fromJSDate(new Date(timestamp)) : DateTime.local();
  date = date.setZone(timezone).endOf(type);
  return date.toJSDate();
}

module.exports = {
  getWeekStart,
  getWeekEnd,
  getStartOf,
  getEndOf,
};