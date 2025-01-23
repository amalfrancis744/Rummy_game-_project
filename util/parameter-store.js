// const AWS = require('aws-sdk');
// const SSM = new AWS.SSM({
//     region: process.env.AWS_DEFAULT_REGION
// });

// const NODE_ENV = process.env.NODE_ENV || 'dev';
// const { SERVICE_NAME } = require('../util/constants');

// async function loadParameters(parameterPath, nextToken) {
//     const parameterResponse = await SSM.getParametersByPath({
//         Path: parameterPath,
//         NextToken: nextToken,
//         WithDecryption: true
//     }).promise();

//     parameterResponse.Parameters.forEach(parameter => {
//         process.env[parameter.Name.substr(parameterPath.length)] = parameter.Value;
//     });

//     if (parameterResponse.NextToken) {
//         await loadParameters(parameterPath, parameterResponse.NextToken);
//     }
// }

// async function init() {
//     if ('local' === NODE_ENV) {
//         return;
//     }
//     await loadParameters(`/${NODE_ENV}/mgp-common/`);
//     await loadParameters(`/${NODE_ENV}/${SERVICE_NAME}/`);
// }

// module.exports = {
//     init,
// };
