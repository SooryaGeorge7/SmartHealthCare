//import required modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// load proto file
const labTestProto = protoLoader.loadSync(path.join(__dirname, '../proto/labtest.proto'));
const labPackage = grpc.loadPackageDefinition(labTestProto).labtest;

//mock data for patients using patient id
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
  ],
  "P47": [
    { testname: "Pap smear Test", result: "Slight infection" },
    { testname: "Colonoscopy", result: "ulcers found" },
    { testname: "X-Ray", result: "No issues detected" }
  ]
  
};

//this checks if incoming metadata contains valid API key
const checkApiKey = (call, callback) => {
  const metadata = call.metadata.get('api-key');

  if (metadata && metadata[0] === process.env.API_KEY) {
    callback(null, { success: true });
    console.log("Api sucessful");
  } else {
    console.error("Api key validation failed.");
    callback({
      code: grpc.status.UNAUTHENTICATED,
      details: 'Invalid API Key'
    });
  }
};

// Function to stream lab results after checking patientid
function streamLabResults(call) {
  checkApiKey(call, (err) => {
    if (err) {
      return callback(err);
    }
  const patientid = call.request.patientid;
  console.log(`Streaming lab results for Patient ID in labservice: ${patientid}`);

  //checks results from mock data
  const labResults = patientLabResults[patientid];

  if (!labResults) {
    console.log(`No results found for Patient ID: ${patientid}`);
    call.end(); 
    return;
  }

  // stream each result with a delay to simulate processing time
  labResults.forEach((result, index) => {
    setTimeout(() => {
      call.write(result);
      console.log(`Sent result: ${result.testname} - ${result.result}`);

      if (index === labResults.length - 1) {
        call.end(); 
        console.log(`Finished streaming lab results for Patient`);
      }
      //delay each result by 1 second
    }, index * 1000);
  });
});
}

//creatte grpc server
const server = new grpc.Server();

// register labtest service and its grpc method
server.addService(labPackage.LabTestService.service, {
  StreamLabResults: streamLabResults
});

// start the serever on port 50053
server.bindAsync('127.0.0.1:50053', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Lab Test Service is running on port 50053');
  server.start(); 
});