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


const service = new grpc.Server();
server.addService(healthMonitorProto.HealthMonitorService.service,{
  FetchVitals : fetchVitals,
  StreamHeartRate : streamHeartRate

});

server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), ()=>{
  console.log('health monitor service is running');
  server.start();

});