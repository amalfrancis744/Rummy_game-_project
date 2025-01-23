const response = require('../../services/response')
const queries = require('../../model/cms/index');
const commonService = require('../../services/common');
const R = require('ramda')

module.exports = {

    //Adding CMS
    addCms : async ( req , res ) => {
        let { title , description } = req.body;
        
        if(!title || !description ) 
            return (
                await response.errorResponse(
                    res ,
                    401,
                    "Invalid Parameters"
                )
            )
        
        try{
            let newCode = title.toLowerCase()
            title = title.charAt(0).toUpperCase() + title.slice(1);

            let cmsExists = await queries.getCms({title : title });
           
            if(cmsExists) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "CMS already Exists"
                    )
                )
            
      
           
            let savingCms = await queries.saveCms(
                { 
                    title: title , 
                    code : newCode.replace(/\s/g,'-') , 
                    createdBy : req.auth._id , 
                    description : description , 
                    uniqueCode : await commonService?.generateRandomCode(7) 
                });
            
            return (
                await response.successResponse(
                    res,
                    200,
                    "New CMS has been added",
                    {
                        _id : savingCms?._id,
                        title : savingCms?.title,
                        code : savingCms?.code,
                        description: savingCms?.description,
                        createdBy : savingCms?.createdBy,
                        active : savingCms?.active,
                        uniqueCode : savingCms?.uniqueCode
                    }
                )
            )
        }catch(err){
            console.log(`Add CMS error occured : ${err}`);
            return res.status(200).send({code:400 , status:'failure',message:err?.message});
        }
    },
    //Fetch All CMS
    fetchCms : async (req , res ) => {
        try{
            let cmsList = await queries.getAllCms();
            if(cmsList?.length === 0) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Data found"
                    )
                );

            cmsList.map((e , index) =>{
                e['serialNo'] = index + 1;
               
            })

            return await response.listSuccessResponse(
                res,
                200 , 
                'CMS List' , 
                cmsList , 
                cmsList?.length 
            );

        }catch(err){
         
            console.log(`Fetch CMS error occured : ${err}`);
         
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }
    },
    //Change Status
    changeStatus : async ( req , res ) => {
        const id = req.params.id;

        if(R.isEmpty(id) === true || R.isNil(id) === true) 
            return (
               await response.errorResponse(
                res,
                401,
                "Invalid Parameter"
               )
            );
        
        try{
            let cmsExists = await queries.getCms({ _id : id });
            
            if(!cmsExists) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "Invalid CMS"
                    )
                );
            
            cmsExists?.active === true ?  modifyStatus(res , cmsExists?._id , false ) : modifyStatus(res , cmsExists?._id , true )
        }catch(err){
            console.log(`Change Status error occured : ${err}`);
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }

    },
    //Showing CMS details
    viewCms : async ( req ,res ) => {
        const id= req.params.id;
        if(R.isEmpty(id) === true || R.isNil(id) === true) 
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameter"
                   )
                );
        try{
            let cmsExists = await queries.getCms({ _id : id });
            
            if(!cmsExists) 
            return (
                await response.errorResponse(
                    res,
                    400,
                    "Invalid CMS"
                )
            );    
            
            return (
                await response.successResponse(
                    res,
                    200,
                    "CMS Details",
                    {
                        _id : cmsExists?._id , 
                        title : cmsExists?.title,
                        code : cmsExists?.code,
                        active : cmsExists?.active,
                        createdAt : cmsExists?.createdAt,
                        description : cmsExists?.description
                    }
                )
            )

        }catch(err){
            console.log(`View Category error occured : ${err}`);
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }
    },
    //Edit CMS
    editCms : async ( req , res ) => {
        const id = req.params.id
        const {title , description} = req.body;
        
        if(!title || !description || R.isEmpty(id) === true || R.isNil(id) === true) 
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameter"
                )
            );
        
        try{
            let cmsExists = await queries.getCms({_id:id});
           
            let newCode = title.toLowerCase();
            
            if(!cmsExists) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "CMS doesn't Exists"
                    )
                );  
           
            //Updating CMS
            await queries.updateCms(
                {
                    _id:id
                },
                { 
                    title : title.charAt(0).toUpperCase() + title.slice(1) , 
                    code : newCode.replace(/\s/g,'-'),
                    description:description, 
                    updatedAt: moment().format('LLL') 
                });

            let fetchCms= await queries.getCms({_id:id});
            
            return res.status(200).send({
                code:200 , 
                status:'success' , 
                message:'CMS has been updated successfully' , 
                data : {
                    _id : fetchCms?._id,
                    title : fetchCms?.title,
                    code : fetchCms?.code,
                    description : fetchCms?.description,
                    createdBy : fetchCms?.createdBy,
                    createdAt : fetchCms?.createdAt,
                    updatedAt : fetchCms?.updatedAt,
                    active : fetchCms?.active
                }
            });
        }catch(err){
            console.log(`Add Curriculum error occured : ${err}`);
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }
    },
    cmsList : async (req , res ) => {
        try{
            let cmsList = await queries.getAllCms({active:true});
          
            if(cmsList?.length === 0) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Data found"
                    ) 
                );
            
            let arr= [];

            cmsList.map((e) =>{
                let obj = {
                    _id : e?._id,
                    title : e?.code
                }
                arr.push(obj);
            })        

            return await response.listSuccessResponse(
                res,
                200 , 
                'CMS List' , 
                arr , 
                arr?.length );

        }catch(err){
           
            console.log(`Fetch CMS error occured : ${err}`);
            
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }
    },

    //Deleting a CMS
    dropCMS : async (req , res ) => {
        const id = req.params.id

        if(!id) 
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameter"
                )
            )
        try{

            let cms = await queries.getCms({_id : id});

            if(!cms)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "CMS doesn't Exists"
                    )
                );

            await queries.removeCMS({_id : cms._id});

            return (
                await response.successResponse(
                    res ,
                    200,
                    "CMS has been removed successfully"
                )
            )

        }catch(err){
            console.log("Error occured while dropping a CMS", err);
            
            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                )
            )
        }
    }
}

//Function for Changing Status
async function modifyStatus( res , id , status ){
    await queries.updateCms( { _id : id },{ active : status , updatedAt : moment().format('LLL')});
    return res.status(200).send({code:200 , status:'success',message :'Status has been changed'});
}