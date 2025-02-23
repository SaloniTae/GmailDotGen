const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a schema for tracking used emails
const emailSchema = new mongoose.Schema({
    email: String,
});

const UsedEmail = mongoose.model('UsedEmail', emailSchema);

// Load the email variations from the .txt file
const emailFile = fs.readFileSync(path.join(__dirname, 'gmail_dot_trick_variations.txt'), 'utf-8');
const allEmails = emailFile.split('\n').map(email => email.trim()).filter(email => email);

// Endpoint to get a new email
app.get('/generate-email', async (req, res) => {
    try {
        // Fetch all used emails from MongoDB
        const usedEmails = await UsedEmail.find().select('email -_id');
        const usedEmailSet = new Set(usedEmails.map(e => e.email));

        // Filter out used emails
        const availableEmails = allEmails.filter(email => !usedEmailSet.has(email));

        if (availableEmails.length === 0) {
            return res.status(400).json({ error: 'No more emails available!' });
        }

        // Pick a random email
        const randomIndex = Math.floor(Math.random() * availableEmails.length);
        const newEmail = availableEmails[randomIndex];

        // Save the new email as used in MongoDB
        await UsedEmail.create({ email: newEmail });

        // Return the new email
        res.json({ email: newEmail });
    } catch (error) {
        console.error('Error generating email:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve static files from the "public" directory
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
