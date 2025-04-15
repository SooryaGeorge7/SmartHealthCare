//import modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// load proto file for chat service
const chatProto = protoLoader.loadSync(path.join(__dirname, '../proto/consultationchat.proto'));
const chatPackage = grpc.loadPackageDefinition(chatProto).chat;

//this checks if incoming metadata contains valid API key
const checkApiKey = (call, callback) => {
  const metadata = call.metadata.get('api-key');

  if (metadata && metadata[0] === process.env.API_KEY) {
    callback(null, { success: true });
    console.log("api sucessful");
  } else {
    console.error(" API key failed.");
    callback({
      //returns unauthenticated error if invalid API
      code: grpc.status.UNAUTHENTICATED,
      details: 'Invalid API Key'
    });
  }
};

//This simulates a doctor patient chat using gRPC bidirectional streaming
function consultationChat(call) {
  console.log("Consultation Chat Started");
  checkApiKey(call, (err) => {
    if (err) {
      //stops service if authentication fails
      return callback(err);
    }

  // listen for messages from client
  call.on('data', (message) => {
    console.log(message);
    console.log('Received message from patient', message);

    //simulated doctor response
    const response = {
      response: 'Hello , Thank you for your message: "' + message.message + '" i will get back to you as soon as i am available.'
     };
    // Sending response back to patient
    call.write(response);
    console.log(` Sent response to patient (${message.patientid})`);
  });

  // handle the end of the call
  call.on('end', () => {
    console.log("Consultation Chat Ended");
    call.end(); 
  });

  //handles any errors 
  call.on('error', (error) => {
    console.error("gRPC Chat Error:", error);
  });
});
}

//create new gRPC server instance
const server = new grpc.Server();
// add chat service to server
server.addService(chatPackage.ChatService.service, {
  ConsultationChat: consultationChat
});

// Bind server to specfic port
server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), ()=>{
  console.log('Chat service is running on port 50052');
  server.start(); 

});