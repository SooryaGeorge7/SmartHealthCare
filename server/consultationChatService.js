const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');


const PROTO_PATH = path.join(__dirname,'../proto/consultationchat.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const consultationChatProto = grpc.loadPackageDefinition(packageDefinition).consultationchat;


function consultationChat(call) {
  console.log("Consultation Chat Started");

  call.on('data', (patientMessage) => {
    console.log(`Received from Patient: ${patientMessage.patient_message}`);
    const doctorResponse = `Doctor: I received your message - "${patientMessage.patient_message}"`;

    // Sending response back to patient
    call.write({ doctor_message: doctorResponse });
  });

  call.on('end', () => {
    console.log("Consultation Chat Ended");
    call.end(); 
  });
}

const server = new grpc.Server();
server.addService(consultationChatProto.ChatService.service,{
  ConsultationChat: consultationChat
});

server.bindAsync('127.0.0.1:50052', grpc.ServerCredentials.createInsecure(), ()=>{
  console.log('Chat service is running');
  

});