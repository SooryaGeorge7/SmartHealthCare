// import modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

//load discovery proto
const PROTO_PATH = path.join(__dirname,'../proto/discovery.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const discoveryProto = grpc.loadPackageDefinition(packageDefinition).discovery;

// service registry contains names to their designated port
const services = {
  "HealthMonitorService": "localhost:50051",
  "ChatService":"localhost:50052",
  "LabTestService":"localhost:50053"
};

//this checks if incoming metadata contains valid API key
const checkApiKey = (call, callback) => {
  const metadata = call.metadata.get('api-key');

  if (metadata && metadata[0] === process.env.API_KEY) {
    callback(null, { success: true });
    console.log("api sucessful");
  } else {
    console.error("Api key  failed.");
    callback({
      code: grpc.status.UNAUTHENTICATED,
      details: 'Invalid API Key'
    });
  }
};

//discovery service logic for checking services exist with their corresponding port
const discoverService = (call,callback) =>{
  checkApiKey(call, (err) => {
    if (err) {
      return callback(err);
    }
  const serviceName = call.request.serviceName;
  console.log("Discovery request recieved for service");

  const address = services[serviceName];
  if(address){
    console.log("Service is running");
    callback(null, {address});
  }else{
    console.error("Service not found");
    callback({
      
      code : grpc.status.NOT_FOUND,
      details:"service not found"
    });
  }
});
};

const server= new grpc.Server();

//register discoveryservice in grpc server
server.addService(discoveryProto.DiscoveryService.service,{
  DiscoverService : discoverService
});

//binds server to localhost on port 50050
server.bindAsync('127.0.0.1:50050', grpc.ServerCredentials.createInsecure(), ()=>{
  console.log('DiscoveryService is running on port 50050');
  server.start();

});