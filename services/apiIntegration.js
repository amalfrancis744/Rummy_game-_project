const axios = require('axios');
var FormData = require('form-data');





//Fetch table 
async function fetchTable( url , data){
    var form = new FormData();

    form.append('tournament_id' , data.tournamentId );
    form.append('auth_key', data.token);

    let config = {
        method : "post",
        maxBodyLength: Infinity,
        url:  `${process.env.FRONT_URL}${url}`,
        headers : {
            'Accept': 'application/json', 
            Authorization : `Bearer ${data.token}`,
            ...form.getHeaders()
        },
        data : form

    }
   let response = await axios.request(config)
            // console.log("Response" , response);
        if(response.status === 200 && response.data.status === 1) return response.data.data


}
exports.fetchTable = fetchTable;



//Verify User
async function verifyUser (url , token){

        // console.log("Token----",token)
        var form = new FormData();
    
        form.append('auth_key', `Bearer ${token}`);
    
        let config = {
            method : "post",
            maxBodyLength: Infinity,
            url:  `${process.env.FRONT_URL}${url}`,
            headers : {
                'Accept': 'application/json', 
                Authorization : `Bearer ${token}`,
                ...form.getHeaders()
            },
            // data : form
    
        }
        let response = await axios.request(config);

            // console.log("Response" , response.data);
            if(response.status === 200 && response.data.status === 1){
                // console.log("response.data.data",response.data.data)
                return response.data.data;
            }
    
  

}
exports.verifyUser = verifyUser;



//Insert End Game Data
async function EndGame( data ) {

    try{
        let form = new FormData();
        form.append('tournament_id', data.tournamentId);
        form.append('score', data.currentScore);
        form.append('room_code', data.roomId);
        form.append('win_status', data.winStatus);
        form.append('opponentScore', data.opponentScore);
        form.append('quit_reason', data.leaveReason);
    
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${process.env.FRONT_URL}/api/v1/end_user_tournament`,
            headers: { 
                'Authorization': `Bearer ${data.token}`, 
                ...form.getHeaders()
            },
            data : form
        };
    
        let response = await axios.request(config);
        console.log(JSON.stringify(response.data));
    }catch(err){
        console.log("Error occured in End game API integration",err);
    }
 
}
exports.EndGame = EndGame;


//Join Battle 
async function joinBattle(data){

    try{
        let form = new FormData();
        form.append('auth_key',data.token)
        form.append('tournament_id', data.tournamentId);
        form.append('room_code', data.roomId);
        
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${process.env.FRONT_URL}/api/v1/join_battle`,
            headers: { 
                'Authorization': `Bearer ${data.token}`, 
                ...form.getHeaders()
            },
            data : form
        };
    
        let response = await axios.request(config);
        console.log("join Battle Response------------->",JSON.stringify(response.data));
    }catch(err){
        console.log("Error occured in Join Battle API integration",err);
    }

  
    

}
exports.joinBattle = joinBattle;



//Update Score 
async function updateScore(data){

    try{
        let form = new FormData();
        form.append('auth_key',data.token);
        form.append('room_code', data.roomId);
        form.append('score', data.currentScore);
        form.append('tournament_id', data.tournamentId);
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${process.env.FRONT_URL}/api/v1/update_user_score`,
            headers: { 
                'Authorization': `Bearer ${data.token}`, 
                ...form.getHeaders()
            },
            data : form
        };
    
        let response = await axios.request(config);
        console.log("Update Score Response------------->",JSON.stringify(response.data));
    }catch(err){
        console.log("Error occured in Update score API  integration",err)
    }
}
exports.updateScore = updateScore;