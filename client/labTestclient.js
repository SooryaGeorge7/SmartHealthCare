
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
// const PROTO_PATH = './proto/labtest.proto'; 
const path = require('path');
// const PROTO_PATH = path.join(__dirname, '../proto/labtest.proto');


// const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
// const labTestProto = grpc.loadPackageDefinition(packageDefinition).labtest;

// const client = new labTestProto.LabTestService('localhost:50053', grpc.credentials.createInsecure());


const labtestProto = protoLoader.loadSync(path.join(__dirname, '../proto/labtest.proto'));
const labtestPackage = grpc.loadPackageDefinition(labtestProto).labtest;
const labtestClient = new labtestPackage.LabTestService('localhost:50053', grpc.credentials.createInsecure());


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