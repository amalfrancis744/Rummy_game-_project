const queries = require('../../model/users/index');
const loginHistoryQueries = require('../../model/loginHistory/index');
const tempUserQuerires = require('../../model/tempUser/index');
const referralQueries = require('../../model/referral/index');
const response = require('../../services/response');
const validator = require('validator');
const R = require('ramda')
const commonService = require('../../services/common');
const nodemailerService = require('../../services/nodemailer')
const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../../config/index');
const tableQuery = require('../../model/table/index');
const userQuery = require('../../model/users/index')
const rummyRoomCacheService = require('../../services/rummy-room-cache-service');
const common = require('../../services/common') 
const Room = require('../../model/room/room')
const constants = require("../../util/constants")
module.exports = {

    //***********************Pages*****************************/
    
    //load User profile 
    loadUserProfile :async (req , res ) => {
        var data = {
          token : req.cookies.token,
          url : process.env.URL,
          adminProfile : ''
        }
        commonService.redirecting( req, res , 'pages/userManagement/viewUser' , data )
    },

    //User-login
    login : async ( req , res ) =>{
        let { loginType , number , countryCode , email , appleId } = req.body;

        if(R.isEmpty(loginType) === true || R.isNil(loginType) === true )
            return ( 
                await response.errorResponse(
                    res , 
                    401 , 
                    "Invalid Parameters"
                )
            );
    
        try{

            if(loginType === "mobileNumber"){
                //Login with Mobile Number - Send OTP

                // var regex = /\+61[4-5]{1}[0-9]{8}$/;   //Regex for Australia number's

                if(!countryCode) 
                    return (
                        await response.errorResponse(
                            res,
                            400,
                            "Country Code is missing"
                        )
                    )
                if (number.length != 10)
                  return ( 
                    await response.errorResponse( res , 400 , "Invalid Number")
                  );

                // let otp = await commonService.generateRandomOTP();             

                // let sendingOTP = await twilioService.sendOTP(number , otp);

                // `console.log`("sendingOTP---->" , sendingOTP);
               
                // if(sendingOTP.status === "queued"){
                    let otp = "1111";

                    let registeredUser = await queries.getUser({"mobile_no.number" : number , "mobile_no.country_code" : countryCode});
                    if(!registeredUser){
                        let tempUser = await tempUserQuerires.getTempUser({"mobile_no.number" : number , "mobile_no.country_code" : countryCode });
                    
                        if(!tempUser) {
                            await tempUserQuerires.saveTempUser({mobile_no : {
                                country_code : countryCode,
                                number : number
                            } , otp : otp });
                        }else{
                            await tempUserQuerires.updateTempUser(tempUser._id ,{ otp : otp})
                        }
                    
                    }else{
                        console.log("user-->",registeredUser?._id ,"otp-->", otp)
                        await queries.updateUser(registeredUser?._id , { 'otp.value' : otp, otp_verified : false});
                    }

                    return (
                        await response.successResponse( res , 200 , "OTP has been sent successfully" )
                    )
                // }else{
                //     return (
                //         await response.errorResponse( res , 400 , "Something went wrong while sending OTP")
                //     )
                // }

               
                
            }else if( loginType === "google"){

                if(!email) 
                    return (
                        await response.errorResponse(
                            res,
                            400,
                            "Email Address is missing"
                        )
                    );

                if(!validator.isEmail(email)) 
                    return (
                        await response.errorResponse(
                            res,
                            400,
                            "Invalid Email Address"
                        )
                    );

                let registeredUser = await queries.getUser({email : email , login_type : loginType});
                console.log("Registered User in google login type-->" , registeredUser)
                if(registeredUser){
                    let newToken = jwt.sign({ 
                        _id : registeredUser?._id,
                        name : registeredUser?.name , 
                        email : registeredUser?.email , 
                        login_type : registeredUser?.login_type ,
                        email_verified : registeredUser?.email_verified,
                        roles :'User'
                    } , process.env.TOKEN )

                    console.log("Generating new token for google registered user-->" , newToken)
                    
                    let data = {tokens : [{access:"Bearer" , token:newToken}]}

                    await queries.updateUser( registeredUser?._id , data );
                    
                    let savingToken = await queries.getUser({_id : registeredUser?._id})
                    // let savingUserLoginHistory = await loginHistoryQueries.saveUserLoginHistory({
                    //     user : registeredUser?._id,
                    //     os : loginOS,
                    //     ip : ip,
                    //     city : city,
                    //     state : state,
                    //     region : region,
                    //     country : country
                    // })

                    console.log("savingToken " , savingToken.tokens)

                    return await response.successResponse( 
                        res , 
                        200 , 
                        "User has been logged-In successfully" , 
                        {
                            "access" : savingToken.tokens[0].access,
                            "token" : savingToken.tokens[0].token
                        }
                    )
                    
                }else{
                  
                    
                    return await response.redirectResponse( res , 200 , "User doesn't Exists. Move to complete my profile screen" );
                }   
                
            }else if(loginType === "apple"){

                if(!appleId)
                    return (
                        await response.errorResponse(
                            res , 
                            400 ,
                            "Apple Id is missing"
                        )
                    )

                let registeredUser = await queries.getUser({apple_id : appleId , login_type : loginType});
                
                if(registeredUser){
                    let newToken = jwt.sign({ 
                        _id : registeredUser?._id,
                        name : registeredUser?.name , 
                        apple_id : registeredUser?.apple_id , 
                        login_type : registeredUser?.login_type ,
                        roles :'User'
                    } , process.env.TOKEN )

                    let data = {tokens : [{access:"Bearer" , token:newToken}]}

        
                    await queries.updateUser( registeredUser?._id , data );
                    
                    let savingToken = await queries.getUser({_id : registeredUser?._id})
                    // let savingUserLoginHistory = await loginHistoryQueries.saveUserLoginHistory({
                    //     user : registeredUser?._id,
                    //     os : loginOS,
                    //     ip : ip,
                    //     city : city,
                    //     state : state,
                    //     region : region,
                    //     country : country
                    // })
        
                    return await response.successResponse( 
                        res , 
                        200 , 
                        "User has been logged-In successfully" , 
                        {
                            "access" : savingToken?.tokens[0].access,
                            "token" : savingToken?.tokens[0].token
                        }
                    )
                    
                }else{
                  
                    return await response.redirectResponse( res , 200 , "User doesn't Exists. Move to complete my profile screen" );
                }   

            }else{
                return (
                    await response.errorResponse(
                        res ,
                        400,
                        "Invalid Login Type"
                    )
                )
            }


        }catch(err){

            console.log("Error occured while User logging in" , err);

            return (
                await response.errorResponse(
                    res , 
                    400 ,
                    err?.message
                )
            )
        }
    },
    //Verify OTP
    verifyOTP : async ( req , res ) => {
        
        const { countryCode , number , otp , loginOs, ip, city, state, region, country } = req.body;

        console.log("Params in verify otp" , req.body)

        try{

            let registeredUser = await queries.getUser({
                "mobile_no.number" : number ,
                "mobile_no.country_code" : countryCode
            });

            if(!registeredUser){
                
                let temporaryUser = await tempUserQuerires.getTempUser({
                    "mobile_no.number" : number ,
                    "mobile_no.country_code" : countryCode
                });

                if(!temporaryUser) 
                    return await response.errorResponse(
                        res , 
                        400 , 
                        "No Temporary User found"
                    );              
    
                if(temporaryUser?.otp === otp) {
    
                    await tempUserQuerires.updateTempUser(temporaryUser?._id , { otp_verified : true});
    
                    let userRegistered = await queries.getUser({   
                        "mobile_no.number" : temporaryUser?.mobile_no?.number ,
                        "mobile_no.country_code" :  temporaryUser?.mobile_no?.countryCode});
    
                    if(!userRegistered) {
                        return await response.redirectResponse( res , 200 , "Complete your Profile first.");
                    }
    
                    let newToken = jwt.sign({
                        _id: userRegistered?._id,
                         name : userRegistered?.name , 
                         email : userRegistered?.email , 
                         mobile_no : userRegistered?.mobile_no , 
                         login_type : userRegistered?.login_type ,
                         roles : 'User',
                         otp_verified : true
                        } , process.env.TOKEN );
    
                    let data = {otp_verified : true ,tokens : [{access:"Bearer" , token:newToken}]};

                    await queries.updateUser(userRegistered?._id , data);
    
                    await tempUserQuerires.dropTempUser(temporaryUser?._id)
    
                    return await response.successResponse( res , 200 , "Logged-In successfully" , newToken)
    
                }else{
                    return await response.errorResponse( res , 400 , "Incorrect OTP")
                }
            }else{
                console.log("Regis",registeredUser?.otp ,"otp",otp ,"id",registeredUser?._id)
                if(registeredUser?.otp?.value !== otp){
                    return await response.errorResponse( res , 400 , "Incorrect OTP!!")
                }else{
                    let newToken = jwt.sign({
                        _id : registeredUser?._id,
                        name : registeredUser?.name , 
                        email : registeredUser?.email , 
                        mobile_no : registeredUser?.mobile_no , 
                        login_type : registeredUser?.login_type ,
                        otp_verified : registeredUser?.otp_verified,
                        roles : "User"
                    } , process.env.TOKEN );

                    // let savingUserLoginHistory = await loginHistoryQueries.saveUserLoginHistory({
                    //     user : registeredUser?._id,
                    //     os : loginOs,
                    //     ip : ip,
                    //     city : city,
                    //     state : state,
                    //     region : region,
                    //     country : country
                    // })
                    
                    let updatedToken = await queries.updateUser(registeredUser?._id , {tokens : [{access:"Bearer" , token:newToken}] , otp_verified : true})
                    
                    console.log("Token modified------->" ,updatedToken )
                    
                    return await response.successResponse( res , 200 , "Logged-In successfully" , newToken)
                    
                }
            }
        }catch(err){

            console.log("Error occured while verifying otp" , err);
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }
    },
    //Completing Profile
    completeProfile : async ( req , res ) => {
   
        let { name , number ,countryCode, loginType , appleId , email , referralCode , deviceName , processor , deviceModel , ram , os} = req.body;

        const file = req.file;
    
        console.log("request--->" , req.body, "Empty Referral",R.isEmpty(referralCode) , "Nil Referral" , R.isNil(referralCode))
    
        if(R.isEmpty(name) === true || R.isNil(name) === true || !deviceName || !deviceModel || !ram || !os || !email ){
            return (
                await response.errorResponse( res , 401 , "Invalid Parameter's")
            );
        }
        
        try{
            var pic , referralBy ;
            R.isEmpty(appleId) === true ? appleId = "" : appleId = appleId
            R.isEmpty(referralCode) === true ? referralCode = "" : referralCode = referralCode
            file !== undefined && file ? pic = `${req.file.filename}` : pic = "default.jpg";

            let emailExistence = await queries.getUser({email : email});

            if(emailExistence)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "User exists with such email address"
                    )
                )

            if(referralCode != ""){
                let referringFriend = await queries.getUser({'referralCode' : referralCode});
                !referringFriend ? referralBy = "" : referralBy = referringFriend?._id
            }
            if(!loginType) 
                return await response.errorResponse(
                    res ,
                    400,
                    "Login Type is missing"
                )

            let code = await commonService.generateRandomReferralCode();
            console.log("COde", code)

            if(loginType === "mobileNumber"){
                
                if(!number || !countryCode) 
                    return (
                        await response.errorResponse(
                            res,
                            400,
                            "Mobile Number is missing"
                        )
                    );

                    if (number.length != 10)
                    return ( 
                    await response.errorResponse( res , 400 , "Invalid Number")
                    );

                let temporaryUser = await tempUserQuerires.getTempUser({"mobile_no.number" : number , "mobile_no.country_code" : countryCode});

                console.log("Temp User in complete profile" , temporaryUser , "picture" , pic)
                
                let savingUser = await queries.saveUser({
                    name : name.charAt(0).toUpperCase() + name.slice(1),
                    numeric_id : await commonService.generateRandomCode(5),
                    referralCode : code ,
                    referral: referralBy,
                    apple_id : appleId,
                    mobile_no : {
                        country_code : countryCode,
                        number : number
                    } ,
                    login_type : loginType,
                    email : email,
                    otp_verified : temporaryUser?.otp_verified,
                    email_verified : false,
                    otp : temporaryUser?.otp,
                    profilepic : pic,
                    user_device : {
                        deviceName : deviceName,
                        deviceModel : deviceModel,
                        ram : ram,
                        os:os,
                        processor :processor
                    }
                });

                console.log("Saving USer-->" , savingUser)

                let newToken = jwt.sign({ 
                    _id : savingUser?._id,
                    name : savingUser?.name , 
                    email : savingUser?.email , 
                    mobile_no : savingUser?.mobile_no, 
                    login_type : savingUser?.login_type ,
                    roles : 'User',
                    otp_verified : savingUser?.otp_verified
                } , process.env.TOKEN );

                let data = {tokens : [{access:"Bearer" , token:newToken}]}

                await queries.updateUser( savingUser?._id , data );
                    
                let savingToken = await queries.getUser({_id : savingUser?._id});


                // let savingUserLoginHistory = await loginHistoryQueries.saveUserLoginHistory({
                //     user : savingUser?._id,
                //     os : loginOs,
                //     ip : ip,
                //     city : city,
                //     state : state,
                //     region : region,
                //     country : country
                // })
                
                console.log("savingToken",savingToken)

                // console.log("User login History",savingUserLoginHistory)
            
                await tempUserQuerires.dropTempUser({"mobile_no.number" : temporaryUser?.mobile_no?.number , "mobile_no.country_code" : temporaryUser?.mobile_no?.country_code })

                if(savingToken.referral !== "") {

                    let savingReferral =  await referralQueries.saveReferral({
                        referredFrom : referralBy,
                        referredTo : savingToken?._id,
                        referredBonus : config?.referralBonus,
                        joinedBonus : config?.joiningBonus
                    });

                    //Updating Referral Bonus - to who referred
                    await queries.updateUser(
                        savingReferral.referredFrom , 
                        {
                            referralBonus: savingToken?.referralBonus +  config?.referralBonus,
                            referralCount : savingToken?.referralCount + 1
                        }
                    );

                    //Updating joining bonus - who took referral
                    await queries.updateUser(
                        savingReferral.referredTo , 
                        {
                            joiningBonus: savingToken?.joiningBonus + config?.joiningBonus
                        }
                    );

                }
                return response.successResponse( res , 200 , "User has been registered successfully" , {
                    "access" : data?.tokens[0].access,
                    "token" : data?.tokens[0].token
                });
        
            }else if(loginType === "apple"){
                
                if(!appleId)
                    return (
                        await response.errorResponse(
                            res , 
                            400,
                            "Apple Id is missing"
                        )
                    )

                !countryCode ? countryCode = "" : countryCode = countryCode
                
                if(!number) {
                
                    number = ''
                
                }else{

                    if (number.length != 10)
                        return ( 
                        await response.errorResponse( res , 400 , "Invalid Number")
                        );

                    let numberExists = await queries.getUser(
                        {
                            "mobile_no.number" : number , 
                            "mobile_no.country_code" : countryCode
                        }
                    );

                    if(numberExists)
                        return (
                            await response.errorResponse(
                                res,
                                400,
                                "Number already Exists"
                            )
                        );

                    number = number;
                }
        
                let savingUser = await queries.saveUser({
                    name : name.charAt(0).toUpperCase() + name.slice(1),
                    numeric_id : await commonService.generateRandomCode(5),
                    referralCode : code ,
                    referral: referralBy,
                    apple_id : appleId,
                    mobile_number : {
                        country_code : countryCode,
                        number : number
                    } ,
                    login_type : loginType,
                    email : email,
                    otp_verified : false,
                    email_verified : true,
                    otp : '',
                    profilepic : pic,
                    user_device : {
                        deviceName : deviceName,
                        deviceModel : deviceModel,
                        ram : ram,
                        os:os,
                        processor : processor
                    }
                });

                let newToken = jwt.sign({ 
                    _id : savingUser?._id,
                    name : savingUser?.name , 
                    email : savingUser?.email , 
                    apple_id : savingUser?.apple_id , 
                    login_type : savingUser?.login_type ,
                    roles : 'User',
                    email_verified : savingUser?.email_verified
                } , process.env.TOKEN )

                let data = {tokens : [{access:"Bearer" , token:newToken}]}

            let savingToken =  await queries.updateToken( savingUser?._id , data);


                if(savingToken.referral !== "") {

                    let savingReferral =  await referralQueries.saveReferral({
                        referredFrom : referralBy,
                        referredTo : savingToken?._id,
                        referredBonus : config?.referralBonus,
                        joinedBonus : config?.joiningBonus
                    });

                    //Updating Referral Bonus - to who referred
                    await queries.updateUser(
                        savingReferral.referredFrom , 
                        {
                            referralBonus: savingToken?.referralBonus +  config?.referralBonus,
                            referralCount : savingToken?.referralCount + 1
                        }
                    );

                    //Updating joining bonus - who took referral
                    await queries.updateUser(
                        savingReferral.referredTo , 
                        {
                            joiningBonus: savingToken?.joiningBonus + config?.joiningBonus
                        }
                    );

                }
                // let savingUserLoginHistory = await loginHistoryQueries.saveUserLoginHistory({
                //     user : savingUser?._id,
                //     os : loginOS,
                //     ip : ip,
                //     city : city,
                //     state : state,
                //     region : region,
                //     country : country
                // })

                return await response.successResponse( res , 200 , "User has been logged-In successfully" , {
                    "access" : data?.tokens[0].access,
                    "token" : data?.tokens[0].token
                })
            }else if(loginType === "google"){
            
                if(!email)
                    return (
                        await response.errorResponse(
                            res , 
                            400,
                            "Email Address is missing"
                        )
                    )
                if(!validator.isEmail(email)){
                    return (
                        await response.errorResponse(
                            res,
                            400,
                            "Invalid Email Address"
                        )
                    )
                }
                
                !countryCode ? countryCode = "" : countryCode = countryCode     

                if(!number){
                    number = ""
                }else{
                    
                    if (number.length != 10)
                    return ( 
                    await response.errorResponse( res , 400 , "Invalid Number")
                    );

                    let numberExists = await queries.getUser({"mobile_no.number" : number , "mobile_no.country_code" : countryCode});

                    if(numberExists)
                        return (
                            await response.errorResponse(
                                res,
                                400,
                                "Number already Exists"
                            )
                        );
                    
                    number = number
                }

                let savingUser = await queries.saveUser({
                    name : name.charAt(0).toUpperCase() + name.slice(1),
                    numeric_id : await commonService.generateRandomCode(5),
                    referralCode : code ,
                    referral: referralBy,
                    apple_id : appleId,
                    mobile_number : {
                        country_code : countryCode,
                        number : number
                    } ,
                    login_type : loginType,
                    email : email,
                    otp_verified : false,
                    email_verified : true,
                    otp : '',
                    profilepic : pic,
                    user_device : {
                        deviceName : deviceName,
                        deviceModel : deviceModel,
                        ram : ram,
                        os:os,
                        processor : processor
                    }
                });

                let newToken = jwt.sign({ 
                    _id : savingUser?._id,
                    name : savingUser?.name , 
                    email : savingUser?.email , 
                    login_type : savingUser?.login_type ,
                    roles : 'User',
                    email_verified : savingUser?.email_verified
                } , process.env.TOKEN )

                let data = {tokens : [{access:"Bearer" , token:newToken}]}

                await queries.updateUser( savingUser?._id , data);

                let savingToken = await queries.getUser({_id : savingUser?._id});

                if(savingToken.referral !== "") {

                    let savingReferral =  await referralQueries.saveReferral({
                        referredFrom : referralBy,
                        referredTo : savingToken?._id,
                        referredBonus : config?.referralBonus,
                        joinedBonus : config?.joiningBonus
                    });

                    //Updating Referral Bonus - to who referred
                    await queries.updateUser(
                        savingReferral.referredFrom , 
                        {
                            referralBonus: savingToken?.referralBonus +  config?.referralBonus,
                            referralCount : savingToken?.referralCount + 1
                        }
                    );

                    //Updating joining bonus - who took referral
                    await queries.updateUser(
                        savingReferral.referredTo , 
                        {
                            joiningBonus: savingToken?.joiningBonus + config?.joiningBonus
                        }
                    );

                }
                // let savingUserLoginHistory = await loginHistoryQueries.saveUserLoginHistory({
                //     user : savingUser?._id,
                //     os : loginOS,
                //     ip : ip,
                //     city : city,
                //     state : state,
                //     region : region,
                //     country : country
                // })

                return await response.successResponse( res , 200 , "User has been logged-In successfully" , {
                    "access" : data?.tokens[0].access,
                    "token" : data?.tokens[0].token
                })
            }else{
                return (
                    await response.errorResponse(
                        res, 
                        400,
                        "Invalid Login Type"
                    )
                )
            }

            

        }catch(err){
            console.log("Error ocurred while completing Profile" , err);
            return await response.errorResponse( res , 400 , err?.message);
        }
    },  
    //Auto-login 
    autoLogin : async ( req , res ) => {

        try{

            let userExists = await queries.getUser({_id : req.auth._id});


            if(!userExists)
                return (
                    await response.errorResponse(
                        res ,
                        400 ,
                        "User doesn't Exists"
                    )
                );

            userExists['profilepic'] = `${process.env.URL}/uploads/${userExists?.profilepic}`

            return await response.successResponse( 
                res ,
                200 ,
                "Auto-logged In Successfully",
                userExists
            );


        }catch(err){
            console.log("Error occured while auto-login" , err);
            return await response.errorResponse(
                res,
                400,
                err?.message
                )
        }
    },
    //Resend Otp 
    resendOTP : async ( req , res ) => {
        const { number , countryCode } = req.body;
        
        if(!number || !countryCode) return (
            await response.errorResponse( res , 401 , "Invalid Parameter")
        );

        try{
            
            if(!countryCode) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "Country Code is missing"
                    )
                )


            if (number.length != 10)
               return ( 
                    await response.errorResponse( res , 400 , "Invalid Number")
                );

            let tempUser = await tempUserQuerires.getTempUser(
                {
                    "mobile_no.number" : number , 
                    "mobile_no.country_code" : countryCode, 
                    otp_verified : false 
                });

                console.log("temp user in resend-->" , tempUser)

            if(tempUser){

                let otp = "0000";
                await tempUserQuerires.updateOTP(tempUser?._id , {otp : otp});
                
                return await response.successResponse( 
                    res , 
                    200 , 
                    "OTP has been re-sent successfully."
                )
           
            }else{
                
                return await response.redirectResponse( res , 400 , "Go to Receive OTP Screen")
            }
        }catch(err){

            console.log("Error occured while resending OTP" , err);
            return await response.errorResponse( res , 400 , err?.message);
        }
    },
    //View Profile
    fetchProfile : async ( req , res ) => {
        try{
            let userExists = await queries.getUser({_id : req.auth._id});
    
    
            if(!userExists)
                return (
                    await response.errorResponse(
                        res ,
                        400 ,
                        "User doesn't Exists"
                    )
                );

            userExists['profilepic'] = `${process.env.URL}/uploads/${userExists?.profilepic}`

            return await response.successResponse( 
                res ,
                200 ,
                "Auto-logged In Successfully",
                userExists
            );

        }catch(err){
            console.log("Error occured while fetching user profile" , err);
            return (
                await response.errorResponse(
                    res , 
                    400 ,
                    err?.message
                )
            )
        }
    },
    //logout 
    logOut : async ( req , res ) => {
        try{
            let userExists = await queries.getUser({_id : req.auth._id});

            if(!userExists)
                return (
                    await response.errorResponse(
                        res ,
                        400 ,
                        "User doesn't Exists"
                    )
                ); 
            let data = {
                tokens :[{ access : '' , token :''}],
                last_login : moment().format('LLL'),
                'user_device.device_token':''
            }

            await queries.updateUser(userExists._id , data);

            return await response.successResponse(
                res , 
                200 ,
                "Logged-out successfully"
            )
        }catch(err){
            console.log("Error occured while logging out",err);

            return await response.errorResponse(
                res,
                400,
                err?.message
            )
        }
    },
    //Delete an account
    deleteAccount : async ( req , res ) => {
        
        try{

            await queries.dropUser({_id : req.auth._id});

            return (
                await response.successResponse(
                    res,
                    200,
                    "Account has been Deleted successfully"
                )
            )


        }catch(err){
            console.log("Error occured while deleting Account" , err);

            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                )
            )
        }
    },
    //Edit profile
    editProfile : async ( req , res ) => {
        let { name , email , countryCode , number  } = req.body;
        const file = req.file;
        console.log("Request in edit profile--->" , req.body , "file-->" , file)
        try{
            var pic ;

            let userExists = await queries.getUser({_id : req.auth._id});

            if(!userExists )
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "User doesn't Exists"
                    )
                );

                console.log("User exists-->" ,userExists.profilepic)

                !name ? name = userExists?.name : name = name;
                !file ? pic = userExists?.profilepic : pic = req.file.filename
                
                if(!number) {
                    countryCode = userExists?.mobile_no.country_code
                    number = userExists?.mobile_no?.number
                }else{

                    if(!countryCode)
                        return (
                            await response.errorResponse(
                                res,
                                400,
                                "Country Code is missing"
                            )
                        );

                    if(number.length != 10)
                        return (
                            await response.errorResponse(
                                res,
                                400,
                                "Invalid Number"
                            )
                        );

                    countryCode = countryCode;
                    number = number;
                }

                if(!email){
                    email = userExists?.email;
                    console.log("email", email)

                }else{
    
                    if(!email)
                        return (
                            await response.errorResponse(
                                res,
                                400,
                                "Email is missing"
                            )
                        );

                    if(!validator.isEmail(email)){
                        return (
                            await response.errorResponse(
                                res,
                                400,
                                "Invalid Email Address"
                            )
                        );

                

                }
                email = email;

              

                    
            }
            let data = {
                name : name ,
                mobile_no : {
                    country_code : countryCode,
                    number : number
                },
                email : email,
                otp_verified : false,
                email_verified : false,
                profilepic: pic
            }

            await queries.updateUser( userExists._id , data );

            let fetchUser = await queries.getUser({_id : userExists?._id});

            console.log("FetchUser" , fetchUser.profilepic);
            
            fetchUser.profilepic = `${process.env.URL}/uploads/${fetchUser.profilepic}`

            return (
                await response.successResponse(
                    res,
                    200,
                    "Profile has been updated successfully",
                    fetchUser
                )
            )
        }catch(err){
            console.log("Error occured while editing profile " , err);

            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                )
            );
        }

    },
    //Send Verification Email
    sendVerifyEmail : async ( req , res ) => {
        const { email } = req.body;

        if(!email || !validator.isEmail(email)) 
            return (
                await response.errorResponse(
                    res , 
                    401 ,
                    "Invalid Parameter"
                )
            );

        try{

            let userExists = await queries.getUser({_id : req.auth._id});

            if(!userExists) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "User doesn't Exists"
                    )
                );

            let sendingEmail = await nodemailerService.sendVerificationEmail( res , email , userExists?._id )


        }catch(err){

            console.log("Error occured while sending verification email" , err);
            return await response.errorResponse(
                res,
                400,
                err?.message
            )
        }
    },
    //Verifying Email
    verifyEmail : async ( req , res ) => {

        const id = req.params.id;
        
        if(!id) 
            return (
                await response.errorResponse(
                    res, 
                    400,
                    "Invalid Parameters"
                )
            )

        try{

            let userExists = await queries.getUser({_id : id});

            if(!userExists) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "User doesn't Exists"
                    )
                );

            await queries.updateUser(userExists?._id , {  email_verified : true});
            const updatedUser = await queries.getUser({_id : userExists?._id});
            if(updatedUser?.email_verified === true){
                return (
                    await response.successResponse(
                        res ,
                        200,
                        "Email has been Verified!",
                        updatedUser?.email_verified
                    )
                )
            }else{
                return (
                    await response.errorResponse(
                        res ,
                        400,
                        "Email Verification Failed"
                    )
                )
            }


        }catch(err){
            console.log("Error occured while verifying email" , err);
            return (
                await response.errorResponse(
                    res , 
                    400 ,
                    err?.message
                )
            )
        }
    },

   
 createPrivateRoom : async ( req , res ) => {

        const { tournamentId , userId } = req.body;

        if(!tournamentId || !userId) 
            return (
                await response.errorResponse(
                    res, 
                    400,
                    "Invalid Parameters"
                )
            );

        try{
            let tableExists = await tableQuery.getTable({_id : tournamentId });
            console.log("Table--------------------",tableExists)
            if(!tableExists)
              return (
                await response.errorResponse(
                    res,
                    400,
                    "Invalid Table"
                )
              );
            
            if(tableExists.game_mode !== constants.RUMMY_MODES.PLAYWITHFRIENDS ){
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "You have choose the wrong table"
                    )
                  );

            }else{

                let userExistence = await rummyRoomCacheService.getUserRoom(userId);     //Check if a user is in a room
                
                console.log("User existence----->" , userExistence);
    
                if(userExistence)
                  return (
                    await response.errorResponse(
                        res,
                        400,
                        "Already Playing in another room"
                    )
                  );
    
                let userExists = await userQuery.getUser({_id:userId});
    
                console.log("User exists------>" , userExists)
    
                if(userExists?.main_wallet < tableExists?.entry_fee){
                    return (
                        await response.errorResponse(
                            res ,
                            400,
                           "Insufficient Balance"
                        )
                    )
                }
    
                // userExists = await userQuery.updateUser( userExists._id , {socketId : socket.id} );
    
                // console.log("socket id---->" , userExists.socketId)
                let code = await common.generateRandomReferralCode();
                console.log("New Code generated--->" , code);
    
                let data = {
                  room: code,
                  room_type:tableExists.rummy_type,
                  no_of_players : tableExists.no_of_players,
                  tournamentId: tableExists._id,
                  created_by : userExists.name,
                  room_fee: tableExists.entry_fee,
                  players : []
                }
                let createRoom = await Room(data).save();
    
                console.log("Create room------>" , createRoom);
                return (
                    await response.successResponse(
                        res ,
                        200,
                        "New Room code has been generated",
                        createRoom
                    )
                )
            }
        }catch(err){
            console.log("Error occured while creating private room" , err);
            return (
                await response.errorResponse(
                    res , 
                    400 ,
                    err?.message
                )
            )
        }
    },
    fetchRoomCode : async (req , res)=>{
        const roomCode = req.params.roomCode;

        if(!roomCode) {
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameter"
                )
            )
        }

        try{

            let roomDetails = await Room.findOne({room : roomCode});

            if(!roomDetails) {
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "Invalid Room Code"
                    )
                )
            }


            let userExists = await userQuery.getUser({_id : req.auth._id});


            if(!userExists)
                return (
                    await response.errorResponse(
                        res ,
                        400 ,
                        "User doesn't Exists"
                    )
                );

            let fetchWinAmount = await tableQuery.getTable({_id : roomDetails.tournamentId});

            return (
                await response.successResponse(
                    res,
                    200,
                    {
                        hostName : roomDetails.created_by,
                        profilePic : `${process.env.URL}/uploads/${userExists?.profilepic}`,
                        roomCode: roomDetails.room,
                        entryFee : roomDetails.room_fee,
                        price : fetchWinAmount.win_amount
                    }
                )
            )


        }catch(err){    
            
            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                )
            )
        }
    },

    //*********************************ADMIN-SIDE Functions********************************************************/

    //Listing via Data-table
    userListing : async ( req , res ) => {
        try{ 

        const columnIndex = req.query.order ? req.query.order[0].column : undefined;
        let columnName = columnIndex ? req.query.columns[columnIndex].data : "";
        const columnSortOrder = req.query.order ? req.query.order[0].dir : "";
        
        const value = req.query.search.value ? req.query.search.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : undefined;
        const regex = value ? new RegExp(value, "i") : undefined;

        columnName = columnSortOrder == "asc" ? columnName : columnName

        // console.log("final column name--->" , columnName)
        const searchOptions = value
          ? { $or: [{ name: regex }, { email: regex }, { 'mobile_no.number': regex} ,{ login_type: regex },] }
          : {};
          console.log("--------",searchOptions  ,  req.query.length , req.query.start , columnName , columnSortOrder)
        
        let userList = await queries.userListing(searchOptions  ,  req.query.length , req.query.start , columnName , columnSortOrder);
        
        let indexes = (req.query.start * 1) + 1;
        userList.map((el) => {
            el['serialNo'] = indexes;
            if(el.is_active === true){
                el.is_active = ` <input type="checkbox" id="${el._id}" value="${el._id}" class="btn-status1" switch="bool" checked />
                <label for="${el._id}" data-on-label="Yes" data-off-label="No"></label>`
            }else{
                el.is_active = `<input type="checkbox" id="${el._id}" value="${el._id}" class="btn-status1" switch="bool" unchecked />
                <label for="${el._id}" data-on-label="No" data-off-label="No"></label>`
            }
            el['profilePic'] =  `<img src="/uploads/${el.profilepic}" height="50px" width="60px">`
            el['action'] =`<a href= /mgp-rummy/api/view-user/${el._id} >
            <button  type="button" class="btn btn-info">
            <i class="mdi mdi-eye"></i>
                </button>
                </a>`
            indexes++;
        });

        // const sortOptions = columnSortOrder === "asc" ? columnName : `-${columnName}`;
        
        const recordsTotal = await queries.countingDocuments(searchOptions);
        
        const data = {
          draw: req.query.draw,
          recordsFiltered: recordsTotal,
          recordsTotal: recordsTotal,
          data: userList,
        };
        
        res.json(data);
        }
        catch(err){
            console.log("something went wrong : ", err)
        }

    },
    //View User Details 
    viewUser : async ( req , res ) => {
        const id = req.params.id
        if(R.isEmpty(id) === true || R.isNil(id) === true )
            return (
                await response.errorResponse( res , 401 , "Invalid Parameter")
            )

        try{
            let userExist = await queries.getUser({_id : id});
            
            if(!userExist) 
                return (
                    await response.errorResponse( res , 400 , "User doesn't Exists.")
                );

            // userExist.profilePic = `<img src="uploads/${userExist.profilePic}" height="50px" width="60px">`
            userExist.profilePic = `${process.env.URL}/uploads/${userExist?.profilepic}`
            var userStatus;
            if(userExist.is_active === true){
                userStatus = ` <input type="checkbox" id="${userExist._id}" value="${userExist._id}" class="btn-status1" switch="bool" checked />
                <label for="${userExist._id}" data-on-label="Yes" data-off-label="No"></label>`
            }else{
                userStatus = `<input type="checkbox" id="${userExist._id}" value="${userExist._id}" class="btn-status1" switch="bool" unchecked />
                <label for="${userExist._id}" data-on-label="No" data-off-label="No"></label>`
            }
            return await response.successResponse( res , 200 , "Fetching Particular User Details." , {
                _id : userExist?._id,
                numeric_id : userExist?.numeric_id,
                name : userExist?.name,
                profilePic : userExist?.profilePic,
                mobileNumber : userExist?.mobile_no?.number,
                created_at : userExist?.created_at,
                is_active: userStatus,
                email : userExist?.email,
                gamePlayed : userExist?.gamePlayed,
                gameWon : userExist?.gameWon,
                deviceName : userExist?.user_device?.deviceName,
                deviceModel: userExist?.user_device?.deviceModel,
                ram : userExist?.user_device?.ram,
                os : userExist?.user_device?.os

            });
        }catch(err){
            console.log("Error occured in viewing user details" , err);
            return await response.errorResponse( res , 400 , err?.message);
        }
    },
    //Change Status
    changeStatus : async ( req , res ) => {
        const id = req.params.id;

        if(R.isEmpty(id) === true || R.isNil(id) === true) 
            return (
                await response.errorResponse( res , 401 , "Invalid Parameter")
            )
        try{
            let userExists = await queries.getUser({ _id : id });
            
            if(!userExists) 
                return (
                    await response.errorResponse( res , 400 , "Invalid User")
                )
            
            userExists?.is_active === true ?  modifyStatus(res , userExists?._id , false ) : modifyStatus(res , userExists?._id , true )
        }catch(err){
            console.log("Error occured while changing status" , err)
            return await response.errorResponse( res , 400 , err?.message);
        }
    },

    //Listing via Data-table
    userLoginHistoryTable : async ( req , res ) => {
        try{ 
            const id = req.params.id
            console.log("id------",id)

            const columnIndex = req.query.order ? req.query.order[0].column : undefined;
            let columnName = columnIndex ? req.query.columns[columnIndex].data : "";
            const columnSortOrder = req.query.order ? req.query.order[0].dir : "";
            
            const value = req.query.search.value ? req.query.search.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : undefined;
            const regex = value ? new RegExp(value, "i") : undefined;
            
            // console.log("column Name--->" , columnName , "Sort order--->" ,columnSortOrder)

            columnName = columnSortOrder == "asc" ? columnName : columnName

            // console.log("final column name--->" , columnName)
            const searchOptions = value
            ? {$or: [ { ip: regex },{ city: regex }, { state: regex }, { country: regex} ,{ is_active: regex },]}
            : {};
            
            const search = {
                ...(id ? { user: id } : {}), 
                ...searchOptions,
            };
            console.log("--------",search  ,  req.query.length , req.query.start , columnName , columnSortOrder)
            
            let userLoginHistoryList = await loginHistoryQueries.userLoginHistoryListing(search  ,  req.query.length , req.query.start , columnName , columnSortOrder);
            
            let indexes = (req.query.start * 1) + 1;
            userLoginHistoryList.map((el) => {
                el['serialNo'] = indexes;
                if (el.is_login){
                    el.is_login = `<span class="p-1 badge badge-success" style="font-size:13px">Login</span>`
                }
                else{
                    el.is_login = `<span class="p-1 badge badge-danger" style="font-size:13px">Logout</span>`
                }
                indexes++;
            });

            // const sortOptions = columnSortOrder === "asc" ? columnName : `-${columnName}`;
            
            const recordsTotal = await loginHistoryQueries.userLoginHistoryCount(searchOptions);
            
            const data = {
            draw: req.query.draw,
            recordsFiltered: recordsTotal,
            recordsTotal: recordsTotal,
            data: userLoginHistoryList,
            };
            
            res.json(data);
        }
        catch(err){
            console.log("something went wrong : ", err)
        }

    },
    // Find User for Notification
    getUsers: async (req, res) => {
		try {
			const query = req.query.q || "";
			const regex = new RegExp(query, "i");
			const users = await queries.findUser({ name: { $regex: regex } }, "name");
            console.log("------>",users)
			res.send(users);
		} catch (error) {
			return res.json({ message: "something went wrong" });
		}
	},
}

//Function for Changing Status
async function modifyStatus( res , id , status ){
    try{
        let updated = await queries.updateUser( { _id : id },{ is_active : status , updatedAt : moment().format('LLL')});
        return await response.successResponse( res , 200 , "Status has been changed successfully" , updated?.is_active)
    }catch(err){
        console.log("Error occured while changing status" , err)
        return await response.errorResponse( res , 400 , err?.message);
    }
}