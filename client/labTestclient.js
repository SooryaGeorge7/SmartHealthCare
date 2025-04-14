//import modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

//create lab test client
const labtestProto = protoLoader.loadSync(path.join(__dirname, '../proto/labtest.proto'));
const labtestPackage = grpc.loadPackageDefinition(labtestProto).labtest;
const labtestClient = new labtestPackage.LabTestService('localhost:50053', grpc.credentials.createInsecure());

//sends patient id to recieve lab test results from lab test service.js, then collects to results in an array.
function streamLabResults(patientid) {
  return new Promise((resolve, reject) => {
    console.log("patient id in labclient", patientid);
    const call = labtestClient.StreamLabResults({ patientid: patientid });
    const results = [];

    call.on('data', (result) => {
      results.push(result);
    });

    call.on('end', () => {
      resolve(results);
    });

    call.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  streamLabResults,
};