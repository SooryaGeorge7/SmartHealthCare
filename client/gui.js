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
  const patientId = req.query.patientId;
  let vitals = null;
  let heartRateSummary = null;
  let labTestResults = [];  
  let errorMessage = null;

  if (patientId) {
    client.fetchVitals(patientId, (vitalsData) => {
      if (vitalsData) {
        vitals = vitalsData;
      } else {
        errorMessage = `No vitals found for Patient ID: ${patientId}`;
      }

      // Stream heart rate data
      client.streamHeartRate((heartRateSummaryData) => {
        heartRateSummary = heartRateSummaryData;

        
        client.streamLabResults(patientId, (labResults) => {
          labTestResults = labResults;

         
          res.render('index', {
            patientId: patientId,
            vitals: vitals,
            heartRateSummary: heartRateSummary,
            labTestResults: labTestResults,  
            chatMessages: chatMessages,
            errorMessage: errorMessage
          });
        });
      });
    });
  } else {

    res.render('index', {
      patientId: '',
      vitals: null,
      heartRateSummary: null,
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