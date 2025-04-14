const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// const PROTO_PATH = path.join(__dirname, '../proto/labtest.proto');
// const packageDefinition = protoLoader.loadSync(PROTO_PATH);
// const labTestProto = grpc.loadPackageDefinition(packageDefinition).labtest;
const labTestProto = protoLoader.loadSync(path.join(__dirname, '../proto/labtest.proto'));
const labPackage = grpc.loadPackageDefinition(labTestProto).labtest;

const patientLabResults = {
  "P23": [
    { testname: "MRI", result: "Normal" },
    { testname: "CT Scan", result: "No issues detected" },
    { testname: "X-Ray", result: "No issues detected" }
  ],
  "P66": [
    { testname: "MRI", result: "Minor inflammation found" },
    { testname: "CT Scan", result: "Mild anomaly detected" },
    { testname: "X-Ray", result: "Broken femur" }
  ],
  "P89": [
    { testname: "Urine Test", result: "Slight infection" },
    { testname: "CT Scan", result: "No issues detected" },
    { testname: "X-Ray", result: "No issues detected" }
  ]
};
const checkApiKey = (call, callback) => {
  const metadata = call.metadata.get('api-key');

  if (metadata && metadata[0] === process.env.API_KEY) {
    callback(null, { success: true });
    console.log("api sucessful");
  } else {
    callback({
      code: grpc.status.UNAUTHENTICATED,
      details: 'Invalid API Key'
    });
  }
};
// Function to stream lab results
function streamLabResults(call) {
  checkApiKey(call, (err) => {
    if (err) {
      return callback(err);
    }
  const patientid = call.request.patientid;
  console.log(`Streaming lab results for Patient ID in labservice: ${patientid}`);

  
  const labResults = patientLabResults[patientid];

  if (!labResults) {
    console.log(`No results found for Patient ID: ${patientid}`);
    call.end(); 
    return;
  }

  
  labResults.forEach((result, index) => {
    setTimeout(() => {
      call.write(result);
      console.log(`Sent result: ${result.testname} - ${result.result}`);

      if (index === labResults.length - 1) {
        call.end(); 
      }
    }, index * 1000);
  });
});
}

const server = new grpc.Server();
server.addService(labPackage.LabTestService.service, {
  StreamLabResults: streamLabResults
});

server.bindAsync('127.0.0.1:50053', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Lab Test Service is running on port 50053');
  server.start(); 
});