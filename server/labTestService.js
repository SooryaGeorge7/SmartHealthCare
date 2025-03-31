const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../proto/labtest.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const labTestProto = grpc.loadPackageDefinition(packageDefinition).labtest;


const patientLabResults = {
  "P23": [
    { test_name: "MRI", result: "Normal" },
    { test_name: "CT Scan", result: "No issues detected" },
    { test_name: "X-Ray", result: "No issues detected" }
  ],
  "P66": [
    { test_name: "MRI", result: "Minor inflammation found" },
    { test_name: "CT Scan", result: "Mild anomaly detected" },
    { test_name: "X-Ray", result: "Broken femur" }
  ],
  "P89": [
    { test_name: "Urine Test", result: "Slight infection" },
    { test_name: "CT Scan", result: "No issues detected" },
    { test_name: "X-Ray", result: "No issues detected" }
  ]
};

// Function to stream lab results
function streamLabResults(call) {
  const patientId = call.request.patient_id;
  console.log(`Streaming lab results for Patient ID: ${patientId}`);

  
  const labResults = patientLabResults[patientId];

  if (!labResults) {
    console.log(`No results found for Patient ID: ${patientId}`);
    call.end(); 
    return;
  }

  
  labResults.forEach((result, index) => {
    setTimeout(() => {
      call.write(result);
      console.log(`Sent result: ${result.test_name} - ${result.result}`);

      if (index === labResults.length - 1) {
        call.end(); 
      }
    }, index * 1000);
  });
}

const server = new grpc.Server();
server.addService(labTestProto.LabTestService.service, {
  StreamLabResults: streamLabResults
});

server.bindAsync('127.0.0.1:50053', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Lab Test Service is running on port 50053');
});