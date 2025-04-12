const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const healthMonitorProto = protoLoader.loadSync(path.join(__dirname, '../proto/healthmonitor.proto'));
const healthPackage = grpc.loadPackageDefinition(healthMonitorProto).healthmonitor;

//const PROTO_PATH = path.join(__dirname,'../proto/healthmonitor.proto');
//const packageDefinition = protoLoader.loadSync(PROTO_PATH);
//const healthMonitorProto = grpc.loadPackageDefinition(packageDefinition).healthmonitor;

const patientVitals = {
  "P23": { heartrate: 80, oxygenlevel: 98, temperature: 36 },
  "P66": { heartrate: 75, oxygenlevel: 95, temperature: 37 },
  "P89": { heartrate: 90, oxygenlevel: 97, temperature: 36.5 }
};

// Server function for FetchVitals
function fetchVitals(call, callback) {
  const patientid = call.request.patientid;
  const vitals = patientVitals[patientid];
  console.log("patientid in healthmonitor service",patientid);
  if (vitals) {
    callback(null, vitals); 
  } else {
    callback({
      code: grpc.status.NOT_FOUND,
      message: `No vitals found for patient ID ${patientid}`
    });
  }
}
// StreamHeartRate - Client-Streaming RPC
function streamHeartRate(call, callback) {
  let totalHeartRate = 0;
  let count = 0;

  // Listen for incoming heart rate data from the client
  call.on('data', (heartRateData) => {
    totalHeartRate += heartRateData.bpm;
    count++;
    console.log(`Received Heart Rate: ${heartRateData.bpm}`);
  });

  // When the client is done streaming
  call.on('end', () => {
    if (count === 0) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "No heart rate data received."
      });
    }

    const averageheartrate = Math.round(totalHeartRate / count);
    let risklevel, recommendation;

    // Determine risk level based on average heart rate
    if (averageheartrate < 60) {
      risklevel = "Low";
      recommendation = "Monitor if you feel dizzy or weak.";
    } else if (averageheartrate >= 60 && averageheartrate <= 100) {
      risklevel = "Normal";
      recommendation = "Maintain a healthy lifestyle.";
    } else {
      risklevel = "High";
      recommendation = "Consult a doctor for further evaluation.";
    }

    console.log(`Final Summary -> Avg Heart Rate: ${average_heartrate},${recommendation} Risk: ${risk_level}`);

    // Send summary back to client
    callback(null, {
      averageheartrate: averageheartrate,
      risklevel: risklevel,
      recommendation: recommendation
      
    });
  });
}

const server = new grpc.Server();
server.addService(healthPackage.HealthMonitorService.service, {
  FetchVitals : fetchVitals,
  StreamHeartRate : streamHeartRate

});

server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), ()=>{
  console.log('health monitor service is running');
  
  

});