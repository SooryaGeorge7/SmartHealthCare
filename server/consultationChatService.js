const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');


// const PROTO_PATH = path.join(__dirname,'../proto/consultationchat.proto');
// const packageDefinition = protoLoader.loadSync(PROTO_PATH);
// const consultationChatProto = grpc.loadPackageDefinition(packageDefinition).consultationchat;

const chatProto = protoLoader.loadSync(path.join(__dirname, '../proto/consultationchat.proto'));
const chatPackage = grpc.loadPackageDefinition(chatProto).chat;


function consultationChat(call) {
  console.log("Consultation Chat Started");

  call.on('data', (message) => {
    console.log(message);
    console.log('Received message from patient', message);
    const response = {
      response: 'Hello , Thank you for your message: "' + message.message + '" i will get back to you as soon as i am available.'
     };
    // Sending response back to patient
    call.write(response);
  });

  call.on('end', () => {
    console.log("Consultation Chat Ended");
    call.end(); 
  });

  call.on('error', (error) => {
    console.error("gRPC Chat Error:", error);
  });
}

const server = new grpc.Server();
server.addService(chatPackage.ChatService.service, {
  ConsultationChat: consultationChat
});

server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), ()=>{
  console.log('Chat service is running');
  server.start(); 

});