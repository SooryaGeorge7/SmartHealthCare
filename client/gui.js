//imported modules
const express = require('express');
const path = require('path');
const client = require('./client');  

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static('public'));

// variable to store chat messages 
let chatMessages = [];

//get request that bring over patientid query from ejs
app.get('/', (req, res) => {
  const patientid = req.query.patientid;
  let errorMessage = null;

  if (patientid) {
      // Discover healthMonitor service first using discovery service
      client.discoverService('HealthMonitorService', (HealthMonitorService) => {
        if (!HealthMonitorService) {
            res.send("Health Monitor Service not found.");
            return;
        }

        //Fetch patient's vitals using patient id(simple RPC)
        client.fetchVitals(patientid,HealthMonitorService.address, (vitals) => {
          if (vitals) {
            console.log("vitals in gui:",vitals);
          } else {
            errorMessage = `No vitals found for Patient ID in gui`;
          }
          
          // Stream heart rate data(client streaming rpc)
            client.streamHeartRate(HealthMonitorService.address,(summary) => {
             console.log("heartRateSummaryData:",summary);
             if (!summary) {
              errorMessage = `No heart rate summary available`;
          
            }

            // Discover labTestService after fetching vitals using discover service
            client.discoverService('LabTestService', (LabTestService) => {
              if (!LabTestService) {
                res.send("Lab Test Service not found.");
                return;
              }

              //stream lab test results(server streaming rpc)
              client.streamLabResults(patientid,LabTestService.address, (result) => {
                if (!result || result.length===0) {
                  console.log("Lab Test Results:", result);
                  errorMessage = `No labresults available`;
                }
         
                // render home page with all retrieved data
                res.render('index', {
                 patientid: patientid,
                 vitals,
                 summary,
                 result,  
                 chatMessages: chatMessages,
                 errorMessage: errorMessage
                });
              });
            });
          });
       });
    });
  } else {
    // if no patient id is provided, no results will show
    res.render('index', {
      patientid: '',
      vitals: null,
      summary: null,
      result: [],
      chatMessages: chatMessages,
      errorMessage: null
    });
  }
});

// post request for consultation chat service(bidirectional rpc)
app.post('/send-chat', (req, res) => {
  const message = req.body.message;
  const patientid = req.body.patientid;

  console.log("Sending message to gRPC:", message); 
  chatMessages.push({ sender: 'User', message: message });
  
  //discovery chat service using server discovery 
  client.discoverService('ChatService', (ChatService) => {
    if (!ChatService) {
      res.send("Chat Monitor Service not found.");
      return;
    }
    
    //sends and recieves messages 
    const sendMessage = client.consultationChat(ChatService.address,(response) => {
      console.log("Received doctor response:", response);
      chatMessages.push({ sender: 'Doctor', message: response });

      //allows for reloading of page with latest message without losing patient details already retrieved
      if (patientid) {
        res.redirect(`/?patientid=${patientid}`);
      } else {
        res.redirect('/');
      }
    });
    
    // sends message to the chat service
    sendMessage(message);
  });
});

// shows the port where the client is running
app.listen(port, () => {
  console.log(`Client is running on http://localhost:${port}`);
});