var {
	User
} = require('../models/user');
var config = require('../../config');
var request = require('request');
var logger = require('./logger');
const apikey = config.textLocalKey.authkey;
const senderID = config.textLocalKey.sender;

module.exports = {

    sendOtp: function (mobile, otp) {

		return new Promise((resolve, reject) => {
			var projectname = "Richludo7";
			var message = otp + ` is your OTP (One Time Password) to verify your user account on Richludo7. 
            Do not share this with anyone.`;

			request.post('https://api.textlocal.in/send/', {
				form: {
					apikey: apikey,
					numbers: mobile,
					message: message,
					sender: senderID
				}
			}, function (error, response, body) {
				if (response.statusCode == 200) {
					//logger.info('Response:', body);
					var body_obj = JSON.parse(body);
					if (body_obj.status == 'success') {
						//logger.info("OTP Sent!");
						return resolve(true);
					} else {
						return resolve(false);
					}
				} else {
					//logger.info("Server Error", body);
					return resolve(false);
				}
			});
		});
	},

}