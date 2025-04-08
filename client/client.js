const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// const HEALTHMONITOR_PROTO_PATH = path.join(__dirname, '../proto/healthmonitor.proto');
// const LABTEST_PROTO_PATH = path.join(__dirname, '../proto/labtest.proto');
const CONSULTATIONCHAT_PROTO_PATH = path.join(__dirname, '../proto/consultationchat.proto');
const DISCOVERY_PROTO_PATH = path.join(__dirname, '../proto/discovery.proto');

// const healthMonitorProto = grpc.loadPackageDefinition(protoLoader.loadSync(HEALTHMONITOR_PROTO_PATH)).healthmonitor;
// const labTestProto = grpc.loadPackageDefinition(protoLoader.loadSync(LABTEST_PROTO_PATH)).labtest;
const consultationChatProto = grpc.loadPackageDefinition(protoLoader.loadSync(CONSULTATIONCHAT_PROTO_PATH)).consultationchat;
const discoveryProto = grpc.loadPackageDefinition(protoLoader.loadSync(DISCOVERY_PROTO_PATH)).discovery;

const healthMonitorClient =require('./healthMonitorClient');
const labTestClient = require('./labTestclient')
const chatClient = new consultationChatProto.ChatService('localhost:50052', grpc.credentials.createInsecure());
const discoveryClient = new discoveryProto.DiscoveryService('localhost:50050', grpc.credentials.createInsecure());


const consultationChat = (callback) => {
  
  const call = chatClient.ConsultationChat();

  call.on('data', (response) => {
    console.log('Received from Doctor:', response.doctor_message);
    callback(response);
  });

  call.on('end', () => {
    console.log('Chat session ended');
  });

  call.on('error', (error) => {
    console.error('Chat error:', error);
  });

  const sendUserMessage = (userMessage) => {
    if (userMessage && call) {
      call.write({ patient_message: userMessage });
    }
  };

  return sendUserMessage;
};

const fetchVitals = (patientId, callback) => {
  healthMonitorClient.fetchVitals(patientId)
    .then(response => {
      callback(response);
    })
    .catch(err => {
      console.error("Error fetching vitals:", err);
      callback(null);
    });
};


const streamHeartRate = (callback) => {
  healthMonitorClient.streamHeartRate()
    .then(response => {
      callback(response);
    })
    .catch(err => {
      console.error("Error streaming heart rate:", err);
      callback(null);
    });
};

// Stream lab results 
const streamLabResults = (patientId, callback) => {
  
  labTestClient.streamLabResults(patientId)
    .then((results) => {
      console.log("Lab results received:", results);
      callback(results);
    })
    .catch((err) => {
      console.error("Error streaming lab results:", err);
      callback(null);
    });
};

const discoverService = (serviceName, callback) => {
  discoveryClient.DiscoveryService({
    serviceName: serviceName
  }, (err, response) => {
    if (err) {
      console.log("error discovering service", err);
      callback(null);
    } else {
      callback(response);
    }
  });
};

module.exports = {
  discoverService,
  fetchVitals,
  streamHeartRate,
  streamLabResults,
  consultationChat
};
 