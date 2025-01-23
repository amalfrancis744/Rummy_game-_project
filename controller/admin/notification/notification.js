const queries = require("../../../model/notification/index");
const userQueries = require("../../../model/users/index");
const response = require("../../../services/response");
const commonService = require("../../../services/common");
const moment = require('moment');
module.exports = {
    //*********************************PAGES*************************************** */
    //Load Edit Table Page
    loadEditNotification : async ( req,res) => {
        
        const id = req.params.id
        
        const notificationData = await queries.loadNotification({_id:id})
        let usernames = []
        if(notificationData){
            notificationData.users.forEach((user)=>{
                usernames.push(user.userId._id)
            })
            notificationData.usernames = usernames;
        }
        let admin ={
            url : process.env.URL,
            adminProfile : '',
            token: req.cookies.token,
        }
        const data = { notificationData, admin };
        commonService.redirecting( req, res , 'pages/notificationManagement/editNotification' , data)
    },

//***************Admin-side Table Management functions *******************************/

    //Creating a new table
    createNotification: async (req, res) => {
        
        const {type , user_type, title, usernames, description, scheduledDateTime} = req.body
        if (!type ||!user_type || !title || !description)
            return await response.errorResponse(
                res,
                401,
                "Please enter mandatory fields"
            );
                
        const formattedTime  = moment(scheduledDateTime);
        const currentDateTimeIST = moment();

        if (formattedTime.isBefore(currentDateTimeIST))
            return await response.errorResponse(
                res,
                401,
                "Scheduled date and time should be later than the current date and time."
            );
        
        try{
            let alluser = [];
            if (user_type == "All") {
                const userid = await userQueries.listAllUser();
                userid.forEach((user) => {
                    alluser.push(user._id);
                })
            }else if(user_type == "Custom"){
                if (!usernames)
                    return await response.errorResponse(
                        res,
                        401,
                        "Please select usernames"
                    );
                if (typeof(usernames) === "object") {
                    usernames.forEach(async (userid) => {
                        alluser.push(userid);  
                    });
                }
                else if (typeof(usernames) === "string"){
                    alluser.push(usernames);
                }
            }
            const usersData = alluser.map(userId => ({
                userId: userId,
            }));
            let data = {
                type: type,
                user_type: user_type,
                title: title,
                users: usersData,
                sentAt: scheduledDateTime,
                message: description,
            }
            let createNotification = await queries.saveNotification(data);
            return await response.successResponse(
                res,
                200,
                "A Notification has created successfully.",
                createNotification
            );
        } catch (err) {
            console.log("Error occured while Creating table", err);
            return await response.errorResponse(res, 400, err?.message);
        }
    },
    //Listing via Data-table
    fetchNotification : async ( req , res ) => {
        try{ 

            const columnIndex = req.query.order ? req.query.order[0].column : undefined;
            let columnName = columnIndex ? req.query.columns[columnIndex].data : "";
            const columnSortOrder = req.query.order ? req.query.order[0].dir : "";
            const value = req.query.search.value ? req.query.search.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : undefined;
            const regex = value ? new RegExp(value, "i") : undefined;
            
            columnName = columnSortOrder == "asc" ? columnName : columnName
            const stringQuery = {
                $or: [
                { user_type : regex},
                { title: regex },
                { type: regex },
                { sentAt : regex },
                ]
            };
            const searchOptions = value?stringQuery:{};
            console.log("--------",searchOptions  ,  req.query.length , req.query.start , columnName , columnSortOrder)
            
            let NotificationList = await queries.notificationListing(searchOptions  ,  req.query.length , req.query.start , columnName , columnSortOrder);
            
            let indexes = (req.query.start * 1) + 1;
            NotificationList.map((el) => {
                var status = '';
                if (el['is_sent']){
                    status = 'disabled'
                    el['action'] = `<a href="#" class="${status}" ><button type="button" class="btn btn-info " >
                    <i class="fa fa-pencil"></i>
                        </button>
                        </a> `;
                }else{
                    el['action'] = `<a href="/mgp-rummy/api/edit-notification/${el._id}" class="${status}" ><button type="button" class="btn btn-info " >
                    <i class="fa fa-pencil"></i>
                        </button>
                        </a> `;
                }
                el['serialNo'] = indexes;
                el['sentAt'] = moment(el['sentAt']).format('DD-MM-YYYY h:mm A');
               
                indexes++;
            });
            
            const recordsTotal = await queries.notificationCountDocument(searchOptions);
            
            const data = {
                draw: req.query.draw,
                recordsFiltered: recordsTotal,
                recordsTotal: recordsTotal,
                data: NotificationList,
            };
            
            res.json(data);
        }
        catch(err){
            console.log("something went wrong : ", err)
        }

    },
    // Updating Notification
    updateNotification: async (req, res) => {
        
        const { notificationId, type , user_type, title, usernames, description, scheduledDateTime} = req.body
        if (!type ||!user_type || !title || !description)
            return await response.errorResponse(
                res,
                401,
                "Please enter mandatory fields"
            );
                
        const formattedTime  = moment(scheduledDateTime);
        const currentDateTimeIST = moment();


        if (formattedTime.isBefore(currentDateTimeIST))
            return await response.errorResponse(
                res,
                401,
                "Scheduled date and time should be later than the current date and time."
            );
        
        try{
            let notificationExists = await queries.getNotification({_id:notificationId});
            if (!notificationExists)
                return await response.errorResponse(res, 400, "Notification Not Exists");
            let alluser = [];
            if (user_type == "All") {
                const userid = await userQueries.listAllUser();
                userid.forEach((user) => {
                    alluser.push(user._id);
                })
            }else if(user_type == "Custom"){
                if (!usernames)
                    return await response.errorResponse(
                        res,
                        401,
                        "Please select usernames"
                    );
                if (typeof(usernames) === "object") {
                    usernames.forEach(async (userid) => {
                        alluser.push(userid);  
                    });
                }
                else if (typeof(usernames) === "string"){
                    alluser.push(usernames);
                }
            }
            const usersData = alluser.map(userId => ({
                userId: userId,
            }));
            let data = {
                type: type,
                user_type: user_type,
                title: title,
                users: usersData,
                sentAt: scheduledDateTime,
                message: description,
            }
            let createNotification = await queries.updateNotification(notificationExists._id,data);
            return await response.successResponse(
                res,
                200,
                "A Notification has been updated successfully.",
                createNotification
            );
        } catch (err) {
            console.log("Error occured while Creating table", err);
            return await response.errorResponse(res, 400, err?.message);
        }
    },

    //***************User-side Table management functions *******************************/
    fetchNotificationList : async (req , res ) => {
        try{
            const data = {
                'users.userId':req.auth._id,
                type:'In-App',
            }
            let gameResult = await queries.getAllNotification(data);
            if(gameResult?.length === 0) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Data found"
                    )
                );
                gameResult.map((e , index) =>{
                    e['serialNo'] = index + 1;
                })

            return await response.listSuccessResponse(
                res,
                200 , 
                'Game Result List' , 
                gameResult ,
                gameResult?.length 
            );

        }catch(err){
            console.log(`Fetch gameResult error occured : ${err}`);
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }
    },
};