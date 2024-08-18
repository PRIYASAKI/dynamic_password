const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Use in-memory store for simplicity; use a database in production
const passwordStore = {}; 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function generatePassword() {
    const length = 12;
    const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerCase = "abcdefghijklmnopqrstuvwxyz";
    const number = "0123456789";
    const allChars = upperCase + lowerCase + number;
    let password = "";
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += number[Math.floor(Math.random() * number.length)];
    
    while (password.length < length) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return password;
}

app.post('/generate-password', (req, res) => {
    const { email } = req.body;
    const password = generatePassword();
    
    // Store the password in memory with a simple key based on email
    passwordStore[email] = password;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Generated Password',
        text: `Here is your generated password: ${password}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Failed to send email: ' + error.toString());
        }
        console.log('Email sent:', info.response);
        res.status(200).send('Email sent. Please check your inbox for the password.');
    });
});

app.post('/verify-password', (req, res) => {
    const { email, password } = req.body;
    if (passwordStore[email] === password) {
        res.redirect('/hello-world');
    } else {
        res.status(400).send('Incorrect password');
    }
});

app.get('/hello-world', (req, res) => {
    res.send('<h1>Hello, World!</h1>');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
