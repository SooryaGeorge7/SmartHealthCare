const grpc = require('@grpc/grpc-js');
const protoLoader = require('@proto-loader');
const PROTO_PATH = './proto/healthmonitor.proto'; 

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const healthMonitorProto = grpc.loadPackageDefinition(packageDefinition).healthmonitor;

const client = new healthMonitorProto.HealthMonitorService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

function fetchVitals(patientId) {
  return new Promise((resolve, reject) => {
    client.FetchVitals({ patient_id: patientId }, (err, response) => {
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
    const call = client.StreamHeartRate((err, response) => {
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