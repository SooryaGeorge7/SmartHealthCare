const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

//create healthmonitor client
const createHealthClient = (address) => {
  const healthProto = protoLoader.loadSync(path.join(__dirname, '../proto/healthmonitor.proto'));
  const healthPackage = grpc.loadPackageDefinition(healthProto).healthmonitor;
  return new healthPackage.HealthMonitorService(address, grpc.credentials.createInsecure());
};

//sends the patient id as request to server and gets a response back to client.js which is then sent back to gui
function fetchVitals(patientid, HealthMonitorService) {
  console.log("patient id in healthmonitorclient",patientid);
  return new Promise((resolve, reject) => {
    const healthClient = createHealthClient(HealthMonitorService);
    healthClient.FetchVitals({ patientid: patientid}, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

//sends randomly generated heart rate data to server, and recieves response back from server
function streamHeartRate(HealthMonitorService) {
  return new Promise((resolve, reject) => {
    const healthClient = createHealthClient(HealthMonitorService);
    const call = healthClient.StreamHeartRate((err, response) => {
      if (err) {
        reject(err); 
      } else {
        resolve(response); 
      }
    });

    // Simulate random heart rate generation  for 10secs 
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