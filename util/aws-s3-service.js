// const AWS = require('aws-sdk');
// const time = require('./constants');
// const s3 = new AWS.S3({
//     signatureVersion: 'v4',
//     region: process.env.AWS_DEFAULT_REGION || 'ap-south-1'
// });

// function downloadFileSignedUrl(fileName) {

//     if(!fileName){
//         return null;
//     }

//     const params = {
//         Bucket: process.env.BUCKET_NAME,
//         Key: fileName,
//         Expires: time.URL_EXPIRE_SECONDS.seconds
//     };

//     const url = s3.getSignedUrl('getObject', params);

//     return url;
// }

// module.exports = {
//     downloadFileSignedUrl
// };
