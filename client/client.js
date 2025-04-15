//import modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

//loads consultation chat grpc client
const chatProto = protoLoader.loadSync(path.join(__dirname, '../proto/consultationchat.proto'));
const chatPackage = grpc.loadPackageDefinition(chatProto).chat;
const chatClient = new chatPackage.ChatService('localhost:50052', grpc.credentials.createInsecure());

//import other service clients which are connected to server files to send and recieve data
const healthMonitorClient =require('./healthMonitorClient');
const labTestClient = require('./labTestclient');

// load disovery grpc client
const discoveryProto = protoLoader.loadSync(path.join(__dirname, '../proto/discovery.proto'));
const discoveryPackage = grpc.loadPackageDefinition(discoveryProto).discovery;
const discoveryClient = new discoveryPackage.DiscoveryService('localhost:50050', grpc.credentials.createInsecure());

//function for api authentication
const createMetadata = () => {
  return {
    'api-key': process.env.API_KEY
  };
};

// Bidirectional chat that sends messages after getting replies by using chat grpc service
const consultationChat = (callback) => {
  const call = chatClient.ConsultationChat({}, {metadata: createMetadata()});
  console.log(" Chat session started. Waiting for doctor response  from service.js");
  // handle response from doctor(in this project- this comes from chat service)
  call.on('data', (response) => {
    console.log('Received from Doctor:', response.response);
    callback(response.response);
  });

  //chat ends
  call.on('end', () => {
    console.log('Chat session ended');
  });

  //handles errors during chat
  call.on('error', (error) => {
    console.error('Chat error:', error);
  });

  //function that allows sending message to 'doctor'(in this case the chat service)
  const sendUserMessage = (message) => {
    if (message && call) {
      console.log(`Sending message to doctor: ${message.message}`);
      call.write({  message });
    } else {
      console.error('User message is empty or undefined');
    }
  };

  return sendUserMessage;
};

//simple rpc - fetch vitals client functionality
// uses healthMonitorClient.js to requests patient vital signs from server by sending patient id, and sends results/error back to gui
const fetchVitals = (patientid, callback) => {
  healthMonitorClient.fetchVitals(patientid, {metadata: createMetadata()})
    .then(response => {
      console.log("fetch vitals in client",response);
      callback(response);
    })
    .catch(err => {
      console.error("Error fetching vitals in client:", err);
      callback(null);
    });
};

// client side streaming rpc- stream heart rate 
//uses healthMonitorClient.js to send heart rate data to recieve updates on patient's heart summary to be sent back to gui
const streamHeartRate = (callback) => {
  healthMonitorClient.streamHeartRate({}, {metadata: createMetadata()})
    .then(response => {
      console.log("heartratesummary in client",response);
      callback(response);
    })
    .catch(err => {
      console.error("Error streaming heart rate:", err);
      callback(null);
    });
};

//uses labTestclient.js to recieve Stream lab results - server streaming rpc, streams lab results from lab result service which is then sent back to gui
const streamLabResults = (patientid, callback) => {
  console.log("patient id in client",patientid)
  labTestClient.streamLabResults(patientid, {metadata: createMetadata()})
    .then((results) => {
      console.log("Lab results received:", results);
      callback(results);
    })
    .catch((err) => {
      console.error("Error streaming lab results:", err);
      callback(null);
    });
};

// this discovers services dynamically by their name
const discoverService = (serviceName, callback) => {
  console.log(`Discovering service: ${serviceName}`);
  discoveryClient.DiscoverService({
    serviceName: serviceName
  },{ metadata: createMetadata() }, (err, response) => {
    if (err) {
      console.log("error discovering service", err);
      callback(null);
    } else {
      console.log(`Service "${serviceName}" found at address: ${response.address}`);
      callback(response);
    }
  });
};

//export functions
module.exports = {
  discoverService,
  fetchVitals,
  streamHeartRate,
  streamLabResults,
  consultationChat
};
 