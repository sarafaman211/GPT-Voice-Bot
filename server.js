const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const dotEnv = require("dotenv")

dotEnv.config({ path: "./.env" })

// Configure Google Cloud Speech-to-Text and Text-to-Speech clients
const speechClient = new speech.SpeechClient();
const textToSpeechClient = new textToSpeech.TextToSpeechClient();

// Serve the web application
app.use(express.static('public'));

// Socket.io event handling
io.on('connection', (socket) => {
  // When the client sends a voice recording
  socket.on('voice', async (audioData) => {
    try {
      // Convert the audio to text using Google Cloud Speech-to-Text
      const [response] = await speechClient.recognize({
        audio: {
          content: audioData,
        },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
        },
      });
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join('');

      // Pass the transcribed text to GPT for generating a response
      const gptResponse = await generateGptResponse(transcription);

      // Convert the GPT response to audio using Google Cloud Text-to-Speech
      const audioBuffer = await generateSpeech(gptResponse);

      // Emit the audio response to the client
      socket.emit('audio', audioBuffer);
    } catch (error) {
      console.error('Error:', error);
    }
  });
});

// Generate a response using GPT (replace with your GPT integration code)
async function generateGptResponse(query) {
  // Code to integrate with GPT and generate a response
  // Replace this with your own implementation
  const response = 'This is a sample response from GPT.';
  return response;
}

// Generate speech from text using Google Cloud Text-to-Speech
async function generateSpeech(text) {
  const request = {
    input: { text },
    voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const [response] = await textToSpeechClient.synthesizeSpeech(request);
  return response.audioContent;
}

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});