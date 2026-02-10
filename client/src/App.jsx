import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [gameState, setGameState] = useState({
    caseData: null,
    history: [],
    loading: false,
    error: null,
    phase: 'intro', // intro, investigation, trial, outcome
    collectedEvidence: [],
    reputation: 0,
    time: 6
  });

  // Load history on mount
  useEffect(() => {
    fetch('/api/cases/history')
      .then(res => res.json())
      .then(data => setGameState(prev => ({ ...prev, history: data })))
      .catch(err => console.error("Failed to load history", err));
  }, []);

  const startNewCase = async () => {
    setGameState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/cases/generate', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate case');
      const data = await res.json();

      setGameState(prev => ({
        ...prev,
        caseData: data,
        loading: false,
        phase: 'investigation',
        collectedEvidence: [],
        time: 6
      }));
    } catch (err) {
      setGameState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const handleInvestigate = (evidence) => {
    if (gameState.time <= 0) return;

    setGameState(prev => ({
      ...prev,
      collectedEvidence: [...prev.collectedEvidence, evidence],
      time: prev.time - 1
    }));

    alert(`You discovered: ${evidence.name}\n\n${evidence.description}`);
  };

  const proceedToTrial = () => {
    setGameState(prev => ({ ...prev, phase: 'trial' }));
  };

  if (gameState.loading) {
    return (
      <div className="container">
        <h1>Arcane Advocate</h1>
        <div className="panel loading">
          <p>Summoning the spirits of justice...</p>
          <p className="text-sm text-secondary">Generating procedural case details via Gemini AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1>Arcane Advocate</h1>
        <div>
          <span className="text-secondary">Reputation: </span>
          <strong>{gameState.reputation}</strong>
        </div>
      </header>

      {gameState.error && (
        <div className="panel" style={{ borderColor: 'var(--danger-color)' }}>
          <h3 style={{ color: 'var(--danger-color)' }}>Error</h3>
          <p>{gameState.error}</p>
          <button onClick={startNewCase}>Try Again</button>
        </div>
      )}

      {!gameState.caseData && !gameState.loading && !gameState.error && (
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2>Welcome, Counselor.</h2>
          <p>The court of the arcane awaits your defense.</p>
          <p className="text-secondary">Cases Solved: {gameState.history.length}</p>
          <button onClick={startNewCase} className="mt-4">Accept New Case</button>
        </div>
      )}

      {gameState.caseData && gameState.phase === 'investigation' && (
        <>
          <div className="panel">
            <h2 className="tagline">"{gameState.caseData.tagline}"</h2>
            <h3>{gameState.caseData.caseTitle}</h3>
            <p>{gameState.caseData.factPattern}</p>
            <div className="flex gap-4 mt-4">
              <div>
                <strong>Judge:</strong> {gameState.caseData.judge.name}
              </div>
              <div>
                <strong>Prosecutor:</strong> {gameState.caseData.prosecutor.name}
              </div>
            </div>
          </div>

          <div className="panel">
            <h3>Investigation Phase</h3>
            <p>Time Remaining: <strong>{gameState.time} hours</strong></p>

            <div className="flex gap-4 mt-4" style={{ flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const pool = gameState.caseData.evidence.filter(e => !gameState.collectedEvidence.find(c => c.id === e.id));
                  if (pool.length === 0) { alert("No more evidence to find."); return; }
                  const found = pool[Math.floor(Math.random() * pool.length)];
                  handleInvestigate(found);
                }}
                disabled={gameState.time <= 0}
              >
                Search Crime Scene
              </button>

              <button
                onClick={() => {
                  const w = gameState.caseData.witnesses[Math.floor(Math.random() * gameState.caseData.witnesses.length)];
                  if (gameState.time > 0) {
                    setGameState(prev => ({ ...prev, time: prev.time - 1 }));
                    alert(`Witness ${w.name} says:\n"${w.testimony}"`);
                  }
                }}
                disabled={gameState.time <= 0}
              >
                Interview Witness
              </button>

              <button onClick={proceedToTrial} style={{ marginLeft: 'auto', backgroundColor: 'var(--success-color)' }}>
                Proceed to Trial
              </button>
            </div>
          </div>

          {gameState.collectedEvidence.length > 0 && (
            <div className="panel">
              <h3>Evidence Bag</h3>
              <ul>
                {gameState.collectedEvidence.map(e => (
                  <li key={e.id}><strong>{e.name}</strong>: {e.description}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {gameState.caseData && gameState.phase === 'trial' && (
        <div className="panel">
          <h3>Trial Session</h3>
          <p>The prosecutor {gameState.caseData.prosecutor.name} makes their opening statement.</p>
          <p>You must present your evidence.</p>

          <div className="flex gap-4 mt-4" style={{ flexWrap: 'wrap' }}>
            {gameState.collectedEvidence.map(e => (
              <button key={e.id} onClick={() => {
                alert(`You presented ${e.name}! The judge is considering it.`);
                // Simple resolution for now
                setGameState(prev => ({ ...prev, phase: 'outcome', reputation: prev.reputation + 1 }));
              }}>
                Present {e.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState.phase === 'outcome' && (
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2>Verdict Delivered</h2>
          <p>The trial has concluded.</p>
          <button onClick={startNewCase}>Next Case</button>
        </div>
      )}

    </div>
  );
}

export default App;
