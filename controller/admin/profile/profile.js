const queries = require('../../../model/admin/index');
const response = require('../../../services/response');
const config = require('../../../config/index')
const validator = require('validator');
const bcryptService = require('../../../services/bcrypt')

module.exports = {
    
    //Get Profile
    fetchProfile : async ( req , res ) => {
        try{
        let adminExist = await queries.getAdmin({_id : req.auth._id});
        
        if(!adminExist) 
            return (
                await response.errorResponse(
                    res,
                    400,
                    "Invalid Admin"
                )
            )     
        
            return res.status(200).send({
                code : 200 , 
                status : 'success' , 
                message :"Retrieved Profile Details", 
                data : {
                    _id : adminExist?._id,
                    firstName : adminExist?.firstName,
                    lastName : adminExist?.lastName,
                    emailAddress : adminExist?.emailAddress,
                    profilePic : `${process.env.URL}/assets/uploads/${adminExist?.profilePic}`
                }
            });
        }catch(err){
        console.log(`Get Profile Error occured : ${err}`);
        return res.status(200).send({code:400 , status:'failure', message: err?.message})
        }
    }, 
    //Change Password
    changePassword : async ( req , res ) => {
        const { oldPassword ,  newPassword , confirmPassword } = req.body;
    
    
        if( !oldPassword ||  !newPassword || !confirmPassword ) 
            return res.status(200).send({ 
                code : 401 , 
                status :'failure' , 
                message : "Invalid Parameter's."
            });
        
        try{
            let adminExist = await queries.getAdmin({_id : req.auth._id});
        
            if(!adminExist) 
                return res.status(200).send({ 
                        code : 400 , 
                        status :'failure' , 
                        message :' Invalid User'
                    });
        
            let comparingOldPassword = await bcryptService.comparePass(oldPassword , adminExist?.password);
        
            if(comparingOldPassword === false) 
                return res.status(200).send({
                    code : 400 , 
                    status:'failure' , 
                    message :"Please Enter your correct old password"
                });
        
            //Comparing Password
            let comparingNewPassword = await bcryptService.comparePass(newPassword , adminExist?.password);
            
            if(comparingNewPassword === true) 
                return res.status(200).send({
                        code : 400 , 
                        status:'failure' , 
                        message :"Password must be different"
                    });
        
            if(newPassword !== confirmPassword) 
                return res.status(200).send({
                        code : 400 , 
                        status : 'failure' , 
                        message:'Incorrect Password'
                    });
        
            if(confirmPassword.length < config?.passMinLength ) 
                return res.status(200).send({
                        code:200 , 
                        status : 'failure' , 
                        message:"Password should be atleast 6 characters long."
                    });
        
            let encryptingPassword = await bcryptService.hashPass(confirmPassword , 10);
        
            let data = {
                password : encryptingPassword , token : ''
            }
            await queries.updateAdmin(adminExist._id , data);
        
            return res.status(200).send({
                code:200 , 
                status :'success' , 
                message:"Password has been changed successfully."
        
            });
    
        }catch(err) {
        console.log(`Change Password Error occured : ${err}`);
        return (
            await response.errorResponse(
                res,
                400,
                err?.message
            )
        )
        }
    },
    //Edit Profile
    editProfile : async (req , res) => {

        const { firstName , lastName , email } = req.body;
    
        const file = req.file;
    
        // console.log("firstName",firstName ,"lastName",lastName , "file" ,req.files , "email" , email)
    
        if( !email ||  !firstName || firstName == "" || lastName == ""|| !lastName || !validator.isEmail(email)) 
        // {
        //     req.flash("danger", "Please fill the required fields");
        //     return res.redirect("/mgp-rummy/api/admin/edit-profile");
        // }
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameters"
                )
            )
        try{
        var pic ;
        let adminExist = await queries.getAdmin({_id : req.auth._id});
        
        if(!adminExist)
        // {
        //     req.flash("danger", "Invalid Admin");
        //     return res.redirect("/mgp-rummy/api/admin/edit-profile");
        // }
            return (
                await response.errorResponse(
                    res,
                    400,
                    "Invalid Admin"
                )
            )
        file?.image?.length != 0 && file?.image && file != {} ? pic = `${file?.image[0]?.filename}` : pic = adminExist?.profilePic    
        
        let dataa = {
            firstName : firstName , lastName : lastName ,  profilePic : pic , emailAddress : email
        }
        await queries.updateAdmin(adminExist._id , dataa);
        let adminProfile = await queries.getAdmin({_id : req.auth._id});
        
        if(adminExist?.emailAddress !== adminProfile?.emailAddress){
            await queries.updateAdmin({_id : adminProfile?._id} , { token : "" , lastLoginAt : new Date()});
        }
        // return res
        // .status(200)
        // .cookie("token", token)
        // .redirect("/mgp-rummy/api/admin/profile");
        return res.status(200).send({code:200 , status : 'success' , message:"Profile has been updated.", data : {
            firstName : adminProfile?.firstName,
            lastName : adminProfile?.lastName,
            profilePic : `${process.env.URL}/assets/uploads/${adminProfile?.profilePic}`,
            emailAddress : adminProfile?.emailAddress
        }});
        }catch(err){
        
            console.log(`Edit Profile error occured : ${err}`);
            
            return (
                await response.errorResponse(     
                    res,     
                    400,    
                    err?.message    
                )
            );
        }
    },
}