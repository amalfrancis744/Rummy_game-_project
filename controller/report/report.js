const response = require('../../services/response')
const queries = require('../../model/report/index');
const template= require('../../util/template');
const commonService = require('../../services/common');

module.exports = {
    //***********************Pages*****************************/
    
    //load Cheating Report Details
    loadCheatingReport :async (req , res ) => {
        var data = {
          token : req.cookies.token,
          url : process.env.URL,
          adminProfile : ''
        }
        commonService.redirecting( req, res , 'pages/userReportManagement/viewCheatingReport' , data )
    },

    // ********************Admin-side End points *******************************/
    fetchCheatingReport: async (req, res) => {
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
            
            let cheatingReportList = await queries.reportListing(searchOptions , req.query.length , req.query.start , columnName , columnSortOrder);
            
            let indexes = (req.query.start * 1) + 1;
            cheatingReportList.map((el) => {
                el.view= template.viewCheatingReport(el)
                // if (el.kyc_status == "2")
                //     el.status = `<span class="p-2 badge badge-success" style="color:black;font-size:12px">Approved</span>`
                // else if (el.kyc_status == "3")
                //     el.status = `<span class="p-2 badge badge-danger" style="color:black;font-size:12px">Rejected</span>`
                // else
                //     el.status = template.documentStatus(el)
                // el.datetime = moment(el['createdAt']).format('DD-MM-YYYY h:mm A');
                el.serialNo = indexes;
               
                indexes++;
            });
            const recordsTotal = await queries.reportCountDocument(searchOptions);
            
            const data = {
                draw: req.query.draw,
                recordsFiltered: recordsTotal,
                recordsTotal: recordsTotal,
                data: cheatingReportList,
            };
            
            res.json(data);
        }
        catch(err){
            console.log("something went wrong : ", err)
        }
    },
    //View cheating report details 
    viewCheatingReport : async ( req , res ) => {
        const id = req.params.id
        if(!id )
            return (
                await response.errorResponse( res , 401 , "Invalid Parameter")
            )

        try{
            let cheatingReportExist = await queries.getReport({_id : id});
            
            if(!cheatingReportExist) 
                return (
                    await response.errorResponse( res , 400 , "Invalid Cheating Report")
                );

            // var userStatus;
            // if(userExist.is_active === true){
            //     userStatus = ` <input type="checkbox" id="${userExist._id}" value="${userExist._id}" class="btn-status1" switch="bool" checked />
            //     <label for="${userExist._id}" data-on-label="Yes" data-off-label="No"></label>`
            // }else{
            //     userStatus = `<input type="checkbox" id="${userExist._id}" value="${userExist._id}" class="btn-status1" switch="bool" unchecked />
            //     <label for="${userExist._id}" data-on-label="No" data-off-label="No"></label>`
            // }

            return await response.successResponse( res , 200 , "Fetching Particular Cheating Report Details." , {
                userId : cheatingReportExist?.reported_player?._id,
                username : cheatingReportExist?.reported_player?.name,
                reported_by : cheatingReportExist?.user?.name,
                reason : cheatingReportExist?.reason,
                gameId : cheatingReportExist?.gameId?._id,
                game_mode : cheatingReportExist?.gameId?.game_mode,
                table_name : cheatingReportExist?.gameId?.rummy_type,
                total_players : cheatingReportExist?.gameId?.no_of_players,
            });
        }catch(err){
            console.log("Error occured in viewing user details" , err);
            return await response.errorResponse( res , 400 , err?.message);
        }
    },
    


    //***************User-side End points**********************/
    //Report Player
    reportPlayer : async ( req , res ) => {
        let { reportedPlayer , reason, description, gameId } = req.body;
        const userId = req.auth._id
        if(!reportedPlayer || !reason || !gameId || !Array.isArray(reason) ) 
            return (
                await response.errorResponse(
                    res ,
                    401,
                    "Invalid Parameters"
                )
            )
        try{
            console.log(req.body)
            const reportExist = await queries.getReport({user:userId, reported_player:reportedPlayer})

            if(reportExist){
                await queries.updateReport(reportExist._id,{
                    reason :  reason,
                    description: description,
                    gameId: gameId,
                    report_count:reportExist?.report_count + 1
                })
                let updateReport = await queries.getReport({_id : reportExist._id})
                return (
                    await response.successResponse(
                        res,
                        200,
                        "Player has been reported",
                        {
                            _id : updateReport?._id,
                            user:updateReport?.user,
                            reported_player : updateReport?.reported_player,
                            reason : updateReport?.reason,
                            description : updateReport?.description,
                            gameId: updateReport?.gameId,
                            status : updateReport?.status,
                            report_count : updateReport?.report_count,
                            created_at: updateReport?.createdAt,
                            updated_at: updateReport?.updatedAt,
                        }
                    )
                )

            }
            else{
                let savingReport = await queries.saveReport(
                    { 
                        user: userId , 
                        reported_player : reportedPlayer,
                        reason :  reason,
                        description: description,
                        gameId : gameId
                    });
                
                return (
                    await response.successResponse(
                        res,
                        200,
                        "Player has been reported",
                        {
                            _id : savingReport?._id,
                            user:savingReport?.user,
                            reported_player : savingReport?.reported_player,
                            reason : savingReport?.reason,
                            description : savingReport?.description,
                            gameId: savingReport?.gameId,
                            report_count : savingReport?.report_count,
                            status : savingReport?.status,
                            created_at: savingReport?.createdAt,
                            updated_at: savingReport?.updatedAt,
                        }
                    )
                )
            }
            
        }catch(err){
            console.log(`Report Player error occured : ${err}`);
            return res.status(200).send({code:400 , status:'failure',message:err?.message});
        }
    },
    //Fetch All Report of player
    fetchReport : async (req , res ) => {
        try{
            let report = await queries.getAllReport({user:req.auth._id});
            if(report?.length === 0) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Data found"
                    )
                );
                report.map((e , index) =>{
                e['serialNo'] = index + 1;
            })

            return await response.listSuccessResponse(
                res,
                200 , 
                'Report List' , 
                report ,
                report?.length 
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