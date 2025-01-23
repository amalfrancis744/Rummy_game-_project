
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID , process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_SERVICE_SID);
const from =+19289166827;



module.exports ={

    //Send OTP via number
    sendOTP : async (number,otp) => {
        return await client.messages
        .create({to: '+91'+ number,from:from, body:` Andrew CheXss Login OTP: ${otp}. Please don't share it anyone `  , channel: 'sms',locale:'en'})
    }

   
}