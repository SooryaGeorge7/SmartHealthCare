const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');


const PROTO_PATH = path.join(__dirname,'../proto/healthmonitor.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const healthMonitorProto = grpc.loadPackageDefinition(packageDefinition).healthmonitor;

const patientVitals = {
  "P23": { heart_rate: 80, oxygen_level: 98, temperature: 36 },
  "P66": { heart_rate: 75, oxygen_level: 95, temperature: 37 },
  "P89": { heart_rate: 90, oxygen_level: 97, temperature: 36.5 }
};

// Server function for FetchVitals
function fetchVitals(call, callback) {
  const patientId = call.request.patient_id;
  const vitals = patientVitals[patientId];

  if (vitals) {
    callback(null, vitals); 
  } else {
    callback({
      code: grpc.status.NOT_FOUND,
      message: `No vitals found for patient ID ${patientId}`
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

    const avgHeartRate = Math.round(totalHeartRate / count);
    let riskLevel, recommendation;

    // Determine risk level based on average heart rate
    if (avgHeartRate < 60) {
      riskLevel = "Low";
      recommendation = "Monitor if you feel dizzy or weak.";
    } else if (avgHeartRate >= 60 && avgHeartRate <= 100) {
      riskLevel = "Normal";
      recommendation = "Maintain a healthy lifestyle.";
    } else {
      riskLevel = "High";
      recommendation = "Consult a doctor for further evaluation.";
    }

    console.log(`Final Summary -> Avg Heart Rate: ${avgHeartRate}, Risk: ${riskLevel}`);

    // Send summary back to client
    callback(null, {
      average_heartrate: avgHeartRate,
      risk_level: riskLevel,
      recommendation: recommendation
    });
  });
}

const server = new grpc.Server();
server.addService(healthMonitorProto.HealthMonitorService.service,{
  FetchVitals : fetchVitals,
  StreamHeartRate : streamHeartRate

});

server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), ()=>{
  console.log('health monitor service is running');
  

});