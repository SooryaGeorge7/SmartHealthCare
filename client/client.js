const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const chatProto = protoLoader.loadSync(path.join(__dirname, '../proto/consultationchat.proto'));
const chatPackage = grpc.loadPackageDefinition(chatProto).chat;
const chatClient = new chatPackage.ChatService('localhost:50052', grpc.credentials.createInsecure());

// const HEALTHMONITOR_PROTO_PATH = path.join(__dirname, '../proto/healthmonitor.proto');
// const LABTEST_PROTO_PATH = path.join(__dirname, '../proto/labtest.proto');
//const CONSULTATIONCHAT_PROTO_PATH = path.join(__dirname, '../proto/consultationchat.proto');
//const DISCOVERY_PROTO_PATH = path.join(__dirname, '../proto/discovery.proto');

// const healthMonitorProto = grpc.loadPackageDefinition(protoLoader.loadSync(HEALTHMONITOR_PROTO_PATH)).healthmonitor;
// const labTestProto = grpc.loadPackageDefinition(protoLoader.loadSync(LABTEST_PROTO_PATH)).labtest;
//const consultationChatProto = grpc.loadPackageDefinition(protoLoader.loadSync(CONSULTATIONCHAT_PROTO_PATH)).consultationchat;
//const discoveryProto = grpc.loadPackageDefinition(protoLoader.loadSync(DISCOVERY_PROTO_PATH)).discovery;

const healthMonitorClient =require('./healthMonitorClient');
const labTestClient = require('./labTestclient')
//const chatClient = new consultationChatProto.ChatService('localhost:50052', grpc.credentials.createInsecure());
//const discoveryClient = new discoveryProto.DiscoveryService('localhost:50050', grpc.credentials.createInsecure());


const discoveryProto = protoLoader.loadSync(path.join(__dirname, '../proto/discovery.proto'));
const discoveryPackage = grpc.loadPackageDefinition(discoveryProto).discovery;
const discoveryClient = new discoveryPackage.DiscoveryService('localhost:50050', grpc.credentials.createInsecure());


const consultationChat = (callback) => {
  
  const call = chatClient.ConsultationChat();

  call.on('data', (response) => {
    console.log('Received from Doctor:', response);
    callback(response.response);
  });

  call.on('end', () => {
    console.log('Chat session ended');
  });

  call.on('error', (error) => {
    console.error('Chat error:', error);
  });

  const sendUserMessage = (message) => {
    if (message && call) {
      console.log(`Sending message to doctor: ${message}`);
      call.write({  message });
    } else {
      console.error('User message is empty or undefined');
    }
  };

  return sendUserMessage;
};

const fetchVitals = (patientid, callback) => {
  healthMonitorClient.fetchVitals(patientid)
    .then(response => {
      console.log("fetch vitals in client",response);
      callback(response);
    })
    .catch(err => {
      console.error("Error fetching vitals in client:", err);
      callback(null);
    });
};


const streamHeartRate = (callback) => {
  healthMonitorClient.streamHeartRate()
    .then(response => {
      console.log("heartratesummary in client",response);
      callback(response);
    })
    .catch(err => {
      console.error("Error streaming heart rate:", err);
      callback(null);
    });
};

// Stream lab results 
const streamLabResults = (patientid, callback) => {
  console.log("patient id in client",patientid)
  labTestClient.streamLabResults(patientid)
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
  discoveryClient.DiscoverService({
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
 