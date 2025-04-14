const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');


const PROTO_PATH = path.join(__dirname,'../proto/discovery.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const discoveryProto = grpc.loadPackageDefinition(packageDefinition).discovery;


const services = {
  "HealthMonitorService": "localhost:50051",
  "ChatService":"localhost:50052",
  "LabTestService":"localhost:50053"
};

const checkApiKey = (call, callback) => {
  const metadata = call.metadata.get('api-key');

  if (metadata && metadata[0] === process.env.API_KEY) {
    callback(null, { success: true });
    console.log("api sucessful");
  } else {
    callback({
      code: grpc.status.UNAUTHENTICATED,
      details: 'Invalid API Key'
    });
  }
};

const discoverService = (call,callback) =>{
  checkApiKey(call, (err) => {
    if (err) {
      return callback(err);
    }
  const serviceName = call.request.serviceName;
  const address = services[serviceName];
  if(address){
    callback(null, {address});
  }else{
    callback({
      code : grpc.status.NOT_FOUND,
      details:"service not found"
    });
  }
});
};

const server= new grpc.Server();
server.addService(discoveryProto.DiscoveryService.service,{
  DiscoverService : discoverService
});

server.bindAsync('127.0.0.1:50050', grpc.ServerCredentials.createInsecure(), ()=>{
  console.log('DiscoveryService is running');
  server.start();

});