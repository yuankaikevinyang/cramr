require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mailjet = require('node-mailjet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
const mailjetClient = mailjet.apiConnect(
    process.env.MJ_API_KEY,
    process.env.MJ_API_SECRET
);

app.post('/send-2fa', async (req, res) => {
    const {email, name, code} = req.body;

    // how do I import the code from the Cramr frontend to the backend server
    
    const request = {
        Messages: [
            {
                From: {
                    Email: "tylervo.2002@gmail.com", //replace with our own created domain or something other than my email account if we have one.
                    Name: "Cramr Team" 
                },
                To: [
                    {
                        Email: email,
                        Name: name
                    },
                ],
                Subject: "Your One Time Passcode",
                TextPart: `Hello ${name}},\n\nYou have tried to log in and your One Time Passcode is ${code}. If you did not request a One Time Password, please change your password as soon as possible.\n\nThank you,\nThe Cramr Team`
            }
        ]
    }

    try {
        const result = await mailjetClient.post('send', {version: 'v3.1'}).request(request);
        console.log("Email sent", result.body);
        return res.status(200).json({success: true, code});
    }
    catch (err) {
        console.error("Error sending email", err);
        return res.status(500).json({success: false, message: "Failed to send email."})
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});