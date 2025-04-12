const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
// const PROTO_PATH = './proto/healthmonitor.proto'; 
const path = require('path');
// const PROTO_PATH = path.join(__dirname, '../proto/healthmonitor.proto');

// const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
// const healthMonitorProto = grpc.loadPackageDefinition(packageDefinition).healthmonitor;

// const client = new healthMonitorProto.HealthMonitorService(
//   'localhost:50051',
//   grpc.credentials.createInsecure()
// );

const healthProto = protoLoader.loadSync(path.join(__dirname, '../proto/healthmonitor.proto'));
const healthPackage = grpc.loadPackageDefinition(healthProto).healthmonitor;
const healthClient = new healthPackage.HealthMonitorService('localhost:50051', grpc.credentials.createInsecure());

function fetchVitals(patientid) {
  console.log("patient id in healthmonitorclient",patientid);
  return new Promise((resolve, reject) => {
    healthClient.FetchVitals({ patientid: patientid}, (err, response) => {
      console.log("vitals response in healthmonitor",response)
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

function streamHeartRate() {
  return new Promise((resolve, reject) => {
    const call = healthClient.StreamHeartRate((err, response) => {
      console.log("heart summary response in healthmonitor",response)
      if (err) {
        reject(err); 
      } else {
        resolve(response); 
      }
    });

    // Simulate random heart rate generation 
    let count = 0;
    const interval = setInterval(() => {
      if (count >= 10) {
        clearInterval(interval); 
        call.end(); 
      } else {
        const bpm = Math.floor(Math.random() * (100 - 60 + 1)) + 60; 
        console.log(`Sending Heart Rate: ${bpm} bpm`);
        call.write({ bpm });
        count++;
      }
    }, 1000); 
  });
}

module.exports = {
  fetchVitals,
  streamHeartRate,
};