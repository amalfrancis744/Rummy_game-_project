const adminQuery = require("../model/admin/index");

module.exports = {

    //Generating Random Code
    generateRandomCode : async( length )=>{
        var result = '';
        var characters = '0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *charactersLength));
        }
        return parseInt(result);        
    },
    //Generating Referral Code
    generateRandomReferralCode : async( length = 7)=>{
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *charactersLength));
        }
        console.log("Result-->" , result)
        return result;        
    },
    //Redirecting to another Pages
    redirecting : async (req, res , page , data) => {
        try{
            console.log("Page-->",page , data);
            const token = req.cookies.token
            let adminExist = await adminQuery.getAdmin({token : token});
            if(adminExist){
                data.adminProfile = `${process.env.URL}/uploads/${adminExist?.profilePic}`
            return res.render(page , {data} ) ;

            }else{
            return res.redirect('/mgp-rummy/api/admin')
            }
        } catch (error) {
            console.log("Something went wrong" + error);
        }
    }
}