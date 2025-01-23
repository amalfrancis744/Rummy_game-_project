const queries = require("../../../model/KYC/index");
const userQuery = require("../../../model/users/index");
const response = require("../../../services/response");
const template = require("../../../util/template")
const path = require('path');
const uploadsDir = path.join(__dirname, '../../../assets/uploads');
const commonService = require("../../../services/common");
const moment = require("moment")
const fs = require('fs')

module.exports = {

    //*********************************PAGES*************************************** */
    loadViewDoc: async (req, res) => {
        try {
            const id = req.params.id;
            const kycDoc = await queries.getKyc({_id:id});
            let admin ={
                url : process.env.URL,
                adminProfile : '',
                token: req.cookies.token,
            }
            const docData = {
                viewAlldoc: template.viewAllDoc(kycDoc)
            }
            const data = { docData, admin };
            commonService.redirecting( req, res , 'pages/kycManagement/viewDoc.ejs' , data)
        } catch (error) {
            return res.json({ message: "something went wrong" });
        }
    },
    loadViewSingleDoc : async (req, res) => {
        try {
            const file = req.params.id;
            const name = req.params.name

            
            let admin ={
                url : process.env.URL,
                adminProfile : '',
                token: req.cookies.token,
            }
            const fileData = { name: name, file: file }
            const data = { fileData, admin };
            commonService.redirecting( req, res , 'pages/kycManagement/viewSingleDoc.ejs' , data)
        } catch (error) {
            return res.json({ message: "something went wrong" });
        }
    },
    // ********************Admin-side End points *******************************/
    fetchKyc: async (req, res) => {
        try{ 
            const columnIndex = req.query.order ? req.query.order[0].column : undefined;
            let columnName = columnIndex ? req.query.columns[columnIndex].data : "";
            const columnSortOrder = req.query.order ? req.query.order[0].dir : "";
            const value = req.query.search.value ? req.query.search.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : undefined;
            const regex = value ? new RegExp(value, "i") : undefined;
            
            columnName = columnSortOrder == "asc" ? columnName : columnName
            const stringQuery = {
                $or: [
                    { name : regex},
                    { email: regex },
                ]
            };
            const searchOptions = value?stringQuery:{};
            columnName = columnName == 'datetime'?'createdAt':columnName
            columnName = columnName == 'status'?'kyc_status':columnName
            console.log("--------",searchOptions  ,  req.query.length , req.query.start , columnName , columnSortOrder)
            
            let kycList = await queries.kycListing(searchOptions , req.query.length , req.query.start , columnName , columnSortOrder);
            
            let indexes = (req.query.start * 1) + 1;
            kycList.map((el) => {
                el.viewDoc = template.viewKYCDocuments(el)
                if (el.kyc_status == "2")
                    el.status = `<span class="p-2 badge badge-success" style="color:black;font-size:12px">Approved</span>`
                else if (el.kyc_status == "3")
                    el.status = `<span class="p-2 badge badge-danger" style="color:black;font-size:12px">Rejected</span>`
                else
                    el.status = template.documentStatus(el)
                el.datetime = moment(el['createdAt']).format('DD-MM-YYYY h:mm A');
                el.serialNo = indexes;
               
                indexes++;
            });
            
            const recordsTotal = await queries.kycCountDocument(searchOptions);
            
            const data = {
                draw: req.query.draw,
                recordsFiltered: recordsTotal,
                recordsTotal: recordsTotal,
                data: kycList,
            };
            
            res.json(data);
        }
        catch(err){
            console.log("something went wrong : ", err)
        }
    },
    documentDownload: async (req, res) => {
        try {
            const fileName = req.params.id;
            const filePath = path.join(uploadsDir, 'kycdocuments', fileName);
            res.attachment(fileName);
            res.sendFile(filePath);
        } catch (error) {
            return res.json({ message: "something went wrong" });
        }
    },
    changeDocStatus: async (req, res) => {
        try {
            const { id, status } = req.params;
            const userKYC = queries.updateKyc(id,{kyc_status:status})
            return await response.successResponse(
                res,
                200,
                "Status has been changed",
                userKYC
            );
        } catch (error) {
            return res.json({ message: "something went wrong" });
        }
    },

    //***************User-side End points**********************/
    addKycDetails:async(req,res)=>{
        try {
            const passport=req?.files?.passport[0]?.filename
            const driving_licence_front=req?.files?.driving_licence_front[0]?.filename
            const driving_licence_back=req?.files?.driving_licence_back[0]?.filename
            const {name,email,dob}=req.body
            const existKyc = await queries.getKyc({userId:req.auth._id})
            if(existKyc){
                let  path_p = "assets/uploads/kycdocuments/" +passport;
                let  path_df = "assets/uploads/kycdocuments/" +driving_licence_front;
                let  path_db = "assets/uploads/kycdocuments/" +driving_licence_back;
                if (fs.existsSync(path_p)) {
                    fs.unlinkSync(path_p);
                }
                if (fs.existsSync(path_df)) {
                    fs.unlinkSync(path_df);
                }
                if (fs.existsSync(path_db)) {
                    fs.unlinkSync(path_db);
                }
                return (
                    await response.errorResponse(
                        res ,
                        400,
                        "Kyc Already Added"
                    )
                )    
            }
            const userDetailsExist = await userQuery.getUser({name:name,email:email})
            console.log(userDetailsExist)
            if(!userDetailsExist){
                return (
                    await response.errorResponse(
                        res ,
                        400,
                        "Email or Name should be same as registered"
                    )
                )
            }
            const savingKyc=await queries.saveKyc(
                {
                    userId:req.user._id,
                    name,
                    email,
                    dob,
                    passport,
                    driving_licence_front,
                    driving_licence_back
                });
            return (
                await response.successResponse(
                    res,
                    200,
                    "Kyc has been added",
                    {
                        _id : savingKyc?._id,
                        userId:savingKyc?.userId,
                        name : savingKyc?.name,
                        email : savingKyc?.email,
                        dob : savingKyc?.dob,
                        created_at: savingKyc?.createdAt,
                        passport : savingKyc?.passport,
                        driving_licence_front : savingKyc?.driving_licence_front,
                        driving_licence_back : savingKyc?.driving_licence_back,
                    }
                )
            )
        } catch (error) {
            return res.json({status:500,message:error.message})
        }
    },
    //Fetch Kyc Details
    fetchKycList : async (req , res ) => {
        try{
            let kycDetails = await queries.getAllKyc({userId:req.auth._id});
            if(kycDetails?.length === 0) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Data found"
                    )
                );
            return await response.listSuccessResponse(
                res,
                200 , 
                'Kyc Details List' , 
                kycDetails ,
                kycDetails?.length 
            );

        }catch(err){
            console.log(`Fetch walletDetails error occured : ${err}`);
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }
    },

}