const express = require('express');
const router = express.Router();
const { generateCase } = require('../services/gemini');
const { getGameData, addCaseToHistory } = require('../utils/storage');

// POST /api/cases/generate
router.post('/generate', async (req, res) => {
    try {
        const gameData = await getGameData();

        // Construct a brief history summary for context
        const historySummary = gameData.cases
            .slice(-3) // Only keep last 3 to save tokens
            .map((c, i) => `Case: ${c.caseTitle} — Outcome: ${c.outcome || "Unknown"}`)
            .join("\n");

        console.log("Generating case with history context...");
        const newCase = await generateCase(historySummary);

        // We don't save the case to history immediately; 
        // usually we save it when the player *starts* or *completes* it.
        // For now, let's auto-save it as "Started" to ensure persistence logic works.
        // In a real game, you might want to wait until completion.

        // Let's add an ID and timestamp
        newCase.id = Date.now().toString();
        newCase.timestamp = Date.now();
        newCase.status = 'active';

        await addCaseToHistory(newCase);

        res.json(newCase);
    } catch (err) {
        console.error("Route Error:", err);
        res.status(500).json({ error: err.message || "Failed to generate case" });
    }
});

// GET /api/cases/history
router.get('/history', async (req, res) => {
    try {
        const data = await getGameData();
        res.json(data.cases);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

module.exports = router;
