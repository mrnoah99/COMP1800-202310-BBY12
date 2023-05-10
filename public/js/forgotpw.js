const form = document.querySelector('form');
const emailInput = document.getElementById('email');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const email = emailInput.value;
  
  try {
    // Send a request to your server to check if the email exists in your MongoDB database
    const response = await fetch('/forgotpw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // If the email exists, show a success message
      alert(data.message);
    } else {
      // If the email does not exist, show an error message
      alert(data.error);
    }
    
  } catch (error) {
    console.error(error);
  }
});

const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

router.post('/forgotpw', async (req, res) => {
  const email = req.body.email;
  
  try {
    const client = await MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const users = db.collection('users');
    
    // Check if the email exists in MongoDB
    const user = await users.findOne({ email });
    
    if (user) {
      // If the email exists, send a success message to the client
      res.status(200).json({ message: 'Password reset email sent!' });
    } else {
      // If the email does not exist, send an error message to the client
      res.status(404).json({ error: 'This email address is not registered.' });
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

module.exports = router;

async function resetPassword(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;

  const response = await fetch("/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
    }),
  });

  const result = await response.json();

  if (result.success) {
    alert("password link has been sent.");
  } else {
    alert("There's no e-mail address.");
  }
}

const form = document.querySelector("form");
form.addEventListener("submit", resetPassword);
