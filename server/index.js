require('dotenv').config({ path: '../.env' }); // Look for .env in root
// Fallback if looking in server directory
if (!process.env.GEMINI_API_KEY) {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const caseRoutes = require('./routes/cases');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/cases', caseRoutes);

// Serve static files from React build (client/dist) in production
// implementation_plan.md says: deployment strategy involves building client.
// We will serve the client from here.
const CLIENT_BUILD_PATH = path.join(__dirname, '../client/dist');
app.use(express.static(CLIENT_BUILD_PATH));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    // Check if we have a build
    const indexHtml = path.join(CLIENT_BUILD_PATH, 'index.html');
    try {
        // If file exists, serve it
        // We rely on express.static for the logic, this catch-all is just for SPA
        res.sendFile(indexHtml);
    } catch (e) {
        res.send('API Server Running. Client not built yet. Run "npm run build" in client directory.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Gemini Key Present: ${!!process.env.GEMINI_API_KEY}`);
});
