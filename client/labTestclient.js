
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
// const PROTO_PATH = './proto/labtest.proto'; 
const path = require('path');
const PROTO_PATH = path.join(__dirname, '../proto/labtest.proto');


const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const labTestProto = grpc.loadPackageDefinition(packageDefinition).labtest;

const client = new labTestProto.LabTestService('localhost:50053', grpc.credentials.createInsecure());

function streamLabResults(patientId) {
  return new Promise((resolve, reject) => {
    const call = client.StreamLabResults({ patient_id: patientId });
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