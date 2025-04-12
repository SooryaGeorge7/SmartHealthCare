const express = require('express');
const path = require('path');
const client = require('./client');  

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static('public'));
let chatMessages = [];

app.get('/', (req, res) => {
  const patientid = req.query.patientid;
  
  
  let errorMessage = null;

  if (patientid) {
    client.fetchVitals(patientid, (vitals) => {
      if (vitals) {
        console.log("vitals",vitals);
      } else {
        errorMessage = `No vitals found for Patient ID in gui: ${patientid}`;
      }
      // Stream heart rate data
      client.streamHeartRate((summary) => {
        console.log("heartRateSummaryData:",summary);
        if (!summary) {
          res.send("no summary found.");
          
      }
        client.streamLabResults(patientid, (labResults) => {
          labTestResults = labResults;

         
          res.render('index', {
            patientid: patientid,
            vitals,
            summary,
            labTestResults: labTestResults,  
            chatMessages: chatMessages,
            errorMessage: errorMessage
          });
        });
      });
    });
  } else {

    res.render('index', {
      patientid: '',
      vitals: null,
      summary: null,
      labTestResults: [],
      chatMessages: chatMessages,
      errorMessage: null
    });
  }
});

app.post('/send-chat', (req, res) => {
  const message = req.body.message;
  console.log("Sending message to gRPC:", message); 
  chatMessages.push({ sender: 'User', message: message });


  const sendMessage = client.consultationChat((response) => {
    console.log("Received doctor response:", response);
    chatMessages.push({ sender: 'Doctor', message: response });

    res.redirect('/');
  });

  sendMessage(message);
});

app.listen(port, () => {
  console.log(`Client is running on http://localhost:${port}`);
});