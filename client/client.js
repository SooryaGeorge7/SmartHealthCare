const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const HEALTHMONITOR_PROTO_PATH = path.join(__dirname, '../proto/healthmonitor.proto');
const LABTEST_PROTO_PATH = path.join(__dirname, '../proto/labtest.proto');
const CONSULTATIONCHAT_PROTO_PATH = path.join(__dirname, '../proto/consultationchat.proto');
const DISCOVERY_PROTO_PATH = path.join(__dirname, '../proto/discovery.proto');

const healthMonitorProto = grpc.loadPackageDefinition(protoLoader.loadSync(HEALTHMONITOR_PROTO_PATH)).healthmonitor;
const labTestProto = grpc.loadPackageDefinition(protoLoader.loadSync(LABTEST_PROTO_PATH)).labtest;
const consultationChatProto = grpc.loadPackageDefinition(protoLoader.loadSync(CONSULTATIONCHAT_PROTO_PATH)).consultationchat;
const discoveryProto = grpc.loadPackageDefinition(protoLoader.loadSync(DISCOVERY_PROTO_PATH)).discovery;

const healthMonitorClient = new healthMonitorProto.HealthMonitorservice('localhost:50051', grpc.credentials.createInsecure());
const labTestClient = new labTestProto.LabTestService('localhost:50053', grpc.credentials.createInsecure());
const chatClient = new consultationChatProto.Chatservice('localhost:50052', grpc.credentials.createInsecure());
const discoveryClient = new discoveryProto.DiscoveryService('localhost:50050', grpc.credentials.createInsecure());



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
  discoverService
};
 