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
