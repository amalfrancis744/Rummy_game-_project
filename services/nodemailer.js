const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({ 
  host:'smtp.gmail.com',
  port : 587,
  auth: {
     user: process.env.nodemailerUser ,
     pass: process.env.nodemailerPass
  }
});

module.exports = {


  //Send Reset Password Link via nodemailer
  resetMailer : async( res , emailAddress , resetLink ) =>{  
    transporter.sendMail({
        from: "test1.capermint@gmail.com",
        to: emailAddress,
        subject: "Reset Password",
        html: `<div>
                  <h1>Here is the link to reset the password : </h1>
                  <p><a href = "${process.env.STAGING_PANEL_URL}/reset-password/${resetLink}"> ${process.env.STAGING_PANEL_URL}/reset-password/${resetLink}</a></p>
                  <p><b> Please Don't share it with anyone. </b></p>
              </div>`
        },
        function (err, info) {
          if (err) {
            console.log("Error while sending reset-password mail", err);
          }else{
            console.log("INFO", info?.response);
            return res.status(200).send({ code:200 , status:'success', message: "A mail has been sent successfully."})
          }    
        }
    );
  },

  //Send Verification Email
  sendVerificationEmail : async ( res , emailAddress , userId ) => {
    transporter.sendMail({
      from: "test1.capermint@gmail.com",
      to: emailAddress,
      subject: "Verify Email Address",
      html: `<div>
                <h1>Here is the link to verify your Email Address : </h1>
                <p><a href = "${process.env.URL}/mgp-rummy/api/verify-email/${userId}"> ${process.env.URL}/mgp-rummy/api/verify-email/${userId}</a></p>
                <p><b> Please Don't share it with anyone. </b></p>
            </div>`
      },
      function (err, info) {
        if (err) {
          console.log("Error while sending email-verification mail", err);
        }else{
          console.log("INFO", info?.response);
          return res.status(200).send({ code:200 , status:'success', message: "A mail has been sent successfully."})
        }    
      }
  );
  }

}

  

