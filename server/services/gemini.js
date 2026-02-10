const fetch = global.fetch; // Node 18+

const GEMINI_MODEL = "models/gemini-2.5-pro";

const SYSTEM_PROMPT = `
You are the narrative engine for a roguelike legal drama game called "Arcane Advocate".

CORE CONCEPT:
The player is a defense attorney for magical creatures. Your goal is to generate procedural legal cases.

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown. No commentary.

JSON STRUCTURE:
{
  "tagline": "Short evocative tagline",
  "caseTitle": "Title of the case",
  "factPattern": "4-6 sentences describing the crime",
  "judge": { "name": "Name", "personality": "Personality description" },
  "prosecutor": { "name": "Name", "style": "Prosecution style" },
  "witnesses": [
    { "name": "Name", "role": "Role", "personality": "Personality", "pressureTolerance": "low|medium|high", "testimony": "Initial statement" }
  ],
  "evidence": [
    { "id": "unique_id", "name": "Name", "description": "Visual description", "credibility": "low|medium|high", "unlocks": "id_of_unlocked_evidence_or_null" }
  ],
  "legalTheories": ["Theory 1", "Theory 2"],
  "moralDilemma": "Optional moral choice description or null"
}
`;

const generateCase = async (historySummary = "") => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }

    const fullPrompt = `
${SYSTEM_PROMPT}

PREVIOUS CASES (for continuity):
${historySummary || "None. This is the first case."}

Generate the next case.
`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]) {
            throw new Error("Gemini returned no candidates.");
        }

        let text = data.candidates[0].content.parts[0].text;

        // Clean markdown
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // Find JSON block
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("No JSON found in response.");
        }

        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini Service Error:", error);
        throw error;
    }
};

module.exports = { generateCase };
