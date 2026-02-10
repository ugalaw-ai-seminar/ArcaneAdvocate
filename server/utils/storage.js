const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/game_data.json');

// Ensure data file exists with default structure
const ensureDataFile = async () => {
    try {
        if (!await fs.pathExists(DATA_FILE)) {
            await fs.outputJson(DATA_FILE, { cases: [], settings: {} }, { spaces: 2 });
        }
    } catch (err) {
        console.error('Error ensuring data file:', err);
    }
};

const getGameData = async () => {
    await ensureDataFile();
    try {
        return await fs.readJson(DATA_FILE);
    } catch (err) {
        console.error('Error reading game data:', err);
        return { cases: [], settings: {} };
    }
};

const saveGameData = async (data) => {
    try {
        await fs.writeJson(DATA_FILE, data, { spaces: 2 });
        return true;
    } catch (err) {
        console.error('Error saving game data:', err);
        return false;
    }
};

const addCaseToHistory = async (caseData) => {
    const data = await getGameData();
    // Add timestamp if not present
    if (!caseData.timestamp) caseData.timestamp = Date.now();
    data.cases.push(caseData);
    await saveGameData(data);
};

module.exports = {
    getGameData,
    saveGameData,
    addCaseToHistory
};
