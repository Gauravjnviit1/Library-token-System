const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(bodyParser.json());

const students = []; // Replace with database integration
const gridStatus = Array.from({ length: 100 }, (_, i) => ({ gridLocation: i + 1, occupied: false })); // Initialize 100 grids

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

app.post('/request-token', (req, res) => {
    const { rollNo, email } = req.body;
    const token = uuidv4();
    
    // Save to database
    students.push({ rollNo, email, token });
    
    // Send email
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Library Token',
        text: `Your library token is: ${token}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email sent: ' + info.response);
    });

    res.status(200).send('Token sent to your email.');
});

app.post('/submit-bag', (req, res) => {
    const { rollNo, email } = req.body;
    
    // Find an available grid
    const availableGrid = gridStatus.find(grid => !grid.occupied);
    
    if (!availableGrid) {
        return res.status(400).send('No available grids.');
    }
    
    // Save to database
    const student = students.find(s => s.rollNo === rollNo && s.email === email);
    if (student) {
        const { token } = student;
        
        // Record bag submission
        const bagSubmissions = [{ rollNo, email, token, gridLocation: availableGrid.gridLocation, timestamp: new Date() }];
        availableGrid.occupied = true; // Mark the grid as occupied
        
        // Send email
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Bag Submission Confirmation',
            text: `Your bag has been submitted with token number: ${token} at grid location: ${availableGrid.gridLocation}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Email sent: ' + info.response);
        });

        res.status(200).send('Bag submission recorded and email sent.');
    } else {
        res.status(400).send('Student not found.');
    }
});

app.post('/retrieve-bag', (req, res) => {
    const { rollNo, token } = req.body;
    
    // Find the bag submission
    const bagSubmission = bagSubmissions.find(sub => sub.rollNo === rollNo && sub.token === token);
    
    if (bagSubmission) {
        // Mark the grid as available
        const grid = gridStatus.find(grid => grid.gridLocation === bagSubmission.gridLocation);
        grid.occupied = false;
        
        // Send email
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: bagSubmission.email,
            subject: 'Bag Retrieval Confirmation',
            text: `Your bag has been retrieved from grid location: ${bagSubmission.gridLocation}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Email sent: ' + info.response);
        });

        res.status(200).send('Bag retrieval recorded and email sent.');
    } else {
        res.status(400).send('Bag submission not found.');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
