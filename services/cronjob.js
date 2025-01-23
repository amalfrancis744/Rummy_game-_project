const cron = require('node-cron');
const queries = require('../model/notification/index');
const moment  =require ('moment')

// every minute to send notification
const cronJob = cron.schedule('* * * * *', async () => {
    try{
        let currentDateTime = moment().format('YYYY-MM-DDTHH:mm')
        let notificationList = await queries.getAllNotification({sentAt :currentDateTime ,is_sent:false,type:"Push"})
        // logic for notification sent

        if (notificationList.length > 0)  {
            for (const data of notificationList) {
                await queries.updateNotification(data._id, { is_sent: true });
            }
            console.log("notifications",notificationList)
            console.log("cron-job ---> notification sent")
        }else{
            console.log("cron-job ---> no notification sent")    
        }
    }catch(e){
        console.log("Error",e)
    }
});