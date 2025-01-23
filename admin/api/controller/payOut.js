var randomString = require('random-string');
var config = require('./../../config');
const cfSdk = require('cashfree-sdk');
const payout_config = {
    Payouts:{
        ClientID: config.PAYOUT_CASHFREE.CLIENTID,
        ClientSecret: config.PAYOUT_CASHFREE.SECRET,
        ENV: config.PAYOUT_CASHFREE.ENV, 
    }
};
const { Payouts } = cfSdk;
const { Beneficiary, Transfers } = Payouts;

const initTransfer = async(user,data) => {
    console.log(data)
    console.log(payout_config.Payouts)
    Payouts.Init(payout_config.Payouts);
    let addBene = false;
    let baneId = false;
    let payment_type = "banktransfer";
    if(data.payment_type == 'upi') payment_type = "upi";
    if(data.payment_type == 'paytm') payment_type = "paytm";
    let transfer = {
        beneId: '',
        transferId: data.transferId,
        amount: data.amount,
        "transferMode":payment_type,
    }
    //Get Beneficiary details
    try{
        const bane_Id = await Beneficiary.GetBeneId({
            "bankAccount": data.account_no,
            "ifsc": data.ifsc_code,
        });
        if(bane_Id.subCode !== '200') baneId = true;
        console.log("bane_Id :",bane_Id,baneId)
        if(!baneId){
            transfer.beneId =  bane_Id.data.beneId;
            const response = await Beneficiary.GetDetails({
                "beneId": bane_Id.data.beneId,
            });
            console.log("get beneficiary details response");
            console.log(response);
            if(response.status === 'ERROR' && response.subCode === '404' && response.message === 'Beneficiary does not exist'){
                addBene = true;
            }
            else{
                // handleResponse(response);
                if(response.status === "ERROR") return { message: response.message};
            }
        }            
    }
    catch(err){
        console.log("err caught in getting beneficiary details");
        console.log(err);
        return;
    }
    if(addBene || baneId){
        //Beneficiary Addition
        try{
            transfer.beneId = await randomString({length: 10,numeric: true,letters: true});
            
            let json = {
                "beneId": transfer.beneId,
                "name": user.username, 
                "email":user.email,
                "phone":data.mobile_no,
                "address1":"Dummy",
                "bankAccount":data.account_no,
                "ifsc":data.ifsc_code,
                "vpa":data.upi_id

            }
            console.log("JSON : ",json)
            const response = await Beneficiary.Add(json);
            console.log("beneficiarry addition response");
            console.log(response);
            // handleResponse(response);
            if(response.status === "ERROR") return { message: response.message};
        }
        catch(err){
            console.log("err caught in beneficiarry addition");
            console.log(err);
            return;
        }
    }
    //Request transfer
    try{
        console.log("transfer >>>",transfer)
        const response = await Transfers.RequestTransfer(transfer);
        console.log("request transfer response");
        console.log(response);
        if(response.status === "ERROR") return { message: response.message};
        // handleResponse(response);
    }
    catch(err){
        console.log("err caught in requesting transfer");
        console.log(err);
        return; 
    }
    //Get transfer status
    try{
        const response = await Transfers.GetTransferStatus({
            "transferId": transfer.transferId,
        });
        console.log("get transfer status response");
        console.log(response);
        if(response.status === "ERROR") return { message: response.message};
        if(response.status === 'SUCCESS') return {status:1, message: "Transfer Sucessful"}
        // handleResponse(response);
    }
    catch(err){
        console.log("err caught in getting transfer status");
        console.log(err);
        return; 
    }

};


module.exports = {
    initTransfer
}
  