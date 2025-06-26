import React from 'react';
import '../styles/TigerAndGoats.css';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

function ResultOverlay({ result, onClose, TigerImg, GoatImg, tigerScore, goatScore }) {
  let message = '';
  let images = null;
  let showProbabilities = false;

  if (result === 0) {
    message = 'Tigers Win!';
    images = <img src={TigerImg} alt="Tiger" className="result-overlay-img" />;
  } else if (result === 1) {
    message = 'Goats Win!';
    images = <img src={GoatImg} alt="Goat" className="result-overlay-img" />;
  } else if (result === 2) {
    message = 'Draw!';
    images = <><img src={TigerImg} alt="Tiger" className="result-overlay-img" /><img src={GoatImg} alt="Goat" className="result-overlay-img" /></>;
  }
   else {
    message = 'Time Out!';
    images = <><img src={TigerImg} alt="Tiger" className="result-overlay-img" /><img src={GoatImg} alt="Goat" className="result-overlay-img" /></>;
    showProbabilities = true;
  }

  // Calculate win probabilities based on scores
  const calculateProbabilities = () => {
    const totalScore = Math.abs(tigerScore) + Math.abs(goatScore);
    if (totalScore === 0) return { tiger: 50, goat: 50 };
    
    const tigerProb = Math.round((Math.abs(tigerScore) / totalScore) * 100);
    const goatProb = 100 - tigerProb;
    
    return { tiger: tigerProb, goat: goatProb };
  };

  const probabilities = calculateProbabilities();

  return (
    <div style={overlayStyle}>
      <div className="result-overlay-box">
        <div style={{ marginBottom: '1rem' }}>{images}</div>
        <h2 className="result-overlay-title">{message}</h2>
        
        {showProbabilities && (
          <div className="result-overlay-prob-bar">
            <div className="result-overlay-prob-item">
              <img src={TigerImg} alt="Tiger" className="result-overlay-prob-img" />
              <div className="result-overlay-prob-tiger">{probabilities.tiger}%</div>
              <div className="result-overlay-prob-label">Tiger Advantage</div>
            </div>
            <div className="result-overlay-prob-divider"></div>
            <div className="result-overlay-prob-item">
              <img src={GoatImg} alt="Goat" className="result-overlay-prob-img" />
              <div className="result-overlay-prob-goat">{probabilities.goat}%</div>
              <div className="result-overlay-prob-label">Goat Advantage</div>
            </div>
          </div>
        )}

        <button onClick={onClose} className="result-overlay-btn">Close</button>
      </div>
    </div>
  );
}

export default ResultOverlay; 