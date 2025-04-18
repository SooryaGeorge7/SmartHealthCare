Domain:SmartHealthCare 
Name: Remote Health Dashboard


npm install @grpc/grpc-js
npm install @grpc/proto-loader
npm install ejs
npm install express
npm install dotenv

cd server
node discoveryService.js
node consultationChatService.js
node healthMonitorService.js
node labTestService.js

cd client
node gui.js

open in browser localhost:3000