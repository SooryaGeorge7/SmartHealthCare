//import modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

//load proto file
const healthMonitorProto = protoLoader.loadSync(path.join(__dirname, '../proto/healthmonitor.proto'));
const healthPackage = grpc.loadPackageDefinition(healthMonitorProto).healthmonitor;

//mock data for demo patients for patient id
const patientVitals = [
   {patientid: "P23", heartrate: 80, oxygenlevel: 98, temperature: 36 },
   {patientid: "P66", heartrate: 75, oxygenlevel: 95, temperature: 37 },
   {patientid: "P89", heartrate: 90, oxygenlevel: 97, temperature: 36.5 }
];

//this checks if incoming metadata contains valid API key
const checkApiKey = (call, callback) => {
  const metadata = call.metadata.get('api-key');
  if (metadata && metadata[0] === process.env.API_KEY) {
    callback(null, { success: true });
    console.log("api sucessful");
  } else {
    console.error("api key failed");
    callback({
      code: grpc.status.UNAUTHENTICATED,
      details: 'Invalid API Key'
    });
  }
};

// Server function for FetchVitals which looks up vitals by patient id and returns them
function fetchVitals(call, callback) {
  checkApiKey(call, (err) => {
    if (err) {
      return callback(err);
    }
  const patientid = call.request.patientid;
  //checks for id from mock data 
  const vitals = patientVitals.find(p => p.patientid === patientid);
  console.log("patientid in healthmonitor service",patientid);
  if (vitals) {
    console.log("vitals found for patient in service file")
    callback(null, vitals); 
  } else {
    callback({
      code: grpc.status.NOT_FOUND,
      message: `No vitals found for patient ID :${patientid}`
    });
  }});
}

// StreamHeartRate - Client-Streaming RPC which accepts a stream of heart rate data
// calculates average and returns a risk summary
function streamHeartRate(call, callback) {
  checkApiKey(call, (err) => {
    if (err) {
      return callback(err);
    }
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
    const summary = {
      averageheartrate: averageheartrate,
      risklevel: risklevel,
      recommendation: recommendation
      
    }
    console.log(`Final Summary -> Avg Heart Rate: ${averageheartrate},Recommendation: ${recommendation}, Risk: ${risklevel}`);

    // Send summary back to client
    callback(null, summary);
  });
});
}

//create grpc server
const server = new grpc.Server();

//registers the methods
server.addService(healthPackage.HealthMonitorService.service, {
  FetchVitals : fetchVitals,
  StreamHeartRate : streamHeartRate

});

//starts server on 50051 port
server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), ()=>{
  console.log('health monitor service is running');
  
  

});