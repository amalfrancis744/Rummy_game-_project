exports.viewKYCDocuments = (data) => {
    return `<a href=/mgp-rummy/api/viewDoc/${data._id}><button  type="button" class="btn btn-info"> <i class="mdi mdi-eye"></i> View</button></a>`;
}
exports.viewAllDoc = (data) => {
    return `<div class="ml-5"><span><b>Passport</b></span><img src="/uploads/kycdocuments/${data.passport}" alt="" style="width: 150px; height:150px ; display: block; margin-bottom: 10px; "></img></div><div class="ml-4 mt-5"><a href=/mgp-rummy/api/viewSingleDoc/passport/${data.passport} ><button  type="button" class="btn btn-info"><i class="mdi mdi-eye"></i></button></a></div>
    <div class="ml-5"><span><b>Driving Licence Front</b></span><img src="/uploads/kycdocuments/${data.driving_licence_front}" alt="" style="width: 150px; height:150px ; display: block; margin-bottom: 10px; "></img></div><div class="ml-4 mt-5"><a href=/mgp-rummy/api/viewSingleDoc/driving_licence_front/${data.driving_licence_front} ><button  type="button" class="btn btn-info"><i class="mdi mdi-eye"></i></button></a></div>
    <div class="ml-5"><span><b>Driving Licence Back</b></span><img src="/uploads/kycdocuments/${data.driving_licence_back}" alt="" style="width: 150px; height:150px ; display: block; margin-bottom: 10px; "></img></div><div class="ml-4 mt-5"><a href=/mgp-rummy/api/viewSingleDoc/driving_licence_back/${data.driving_licence_back} ><button  type="button" class="btn btn-info"><i class="mdi mdi-eye"></i></button></a></div>
    `;
}
exports.documentStatus = (data) => {
    return `<button class="btn-status2 btn p-0 bg-transparent" value="2" onclick="" style="font-size: 25px;color: green;"><i class="mdi mdi-checkbox-marked-circle-outline"></i><input type="hidden" value="${data._id}"></button><button class="btn-status2 ml-2 btn p-0 bg-transparent" value="3" style="font-size: 25px;color: red;"><i class="mdi mdi-close-circle-outline"></i><input type="hidden" value="${data._id}"></button>`
}

exports.viewCheatingReport = (data) => {
    return `<a href=/mgp-rummy/api/view-cheating-report/${data._id}><button  type="button" class="btn btn-info"> <i class="mdi mdi-eye"></i></button></a>`;
}