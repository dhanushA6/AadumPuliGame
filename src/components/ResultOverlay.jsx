import React from 'react';
import '../styles/TigerAndGoats.css';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0, 0, 0, 0.3)',       // softer background
  backdropFilter: 'blur(8px)',            // main glass effect
  WebkitBackdropFilter: 'blur(8px)',      // Safari support
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

function ResultOverlay({ result, onClose, TigerImg, GoatImg, tigerScore, goatScore, computerPlaysAs }) {
  let message = null;
  let images = null;
  let showProbabilities = false;
  console.log("CP",computerPlaysAs)
  if (result === 0) {
    message = <>ஆடுகள் பலி<br />வென்றது புலி!</>;
    images = <img src={TigerImg} alt="Tiger" className="result-overlay-img" />;
  } else if (result === 1) {
    message = <>புலிகளின் காடு<br />வென்றது ஆடு!</>;
    images = <img src={GoatImg} alt="Goat" className="result-overlay-img" />;
  } else if (result === 2) {
    message = <>வெற்றியுமில்லை!<br />தோல்வியுமில்லை!</>;
    images = (
      <>
        <img src={TigerImg} alt="Tiger" className="result-overlay-img" />
        <img src={GoatImg} alt="Goat" className="result-overlay-img" />
      </>
    );
  } else {
    message = <>நேரம் முடிந்தது!</>;
    images = (
      <>
        <img src={TigerImg} alt="Tiger" className="result-overlay-img" />
        <img src={GoatImg} alt="Goat" className="result-overlay-img" />
      </>
    );
    showProbabilities = true;
  }

  const calculateProbabilities = () => {
    const totalScore = Math.abs(tigerScore) + Math.abs(goatScore);
    if (totalScore === 0) return { tiger: 50, goat: 50 };

    const tigerProb = Math.round((Math.abs(tigerScore) / totalScore) * 100);
    const goatProb = 100 - tigerProb;

    return { tiger: tigerProb, goat: goatProb };
  };

  const probabilities = calculateProbabilities();

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div className="result-overlay-box">
        <div style={{ marginBottom: '1rem' }}>{images}</div>
        <h2 className="result-overlay-title">{message}</h2>

        {showProbabilities && (
          <div className="result-overlay-prob-bar">
            <div className="result-overlay-prob-item">
              <img src={TigerImg} alt="Tiger" className="result-overlay-prob-img" />
              <div className="result-overlay-prob-tiger">{probabilities.tiger}%</div>
              <div className="result-overlay-prob-label">
                {computerPlaysAs === 0 ? <>கணினியின்<br />வெற்றிவாய்ப்பு</> : <>உன்<br />வெற்றிவாய்ப்பு</>}
              </div>
            </div>
            <div className="result-overlay-prob-divider"></div>
            <div className="result-overlay-prob-item">
              <img src={GoatImg} alt="Goat" className="result-overlay-prob-img" />
              <div className="result-overlay-prob-goat">{probabilities.goat}%</div>
              <div className="result-overlay-prob-label">
                {computerPlaysAs === 0 ? <>உன்<br />வெற்றிவாய்ப்பு</> : <>கணினியின்<br />வெற்றிவாய்ப்பு</>}
              </div>
            </div>
          </div>
        )}

        {/* <button onClick={onClose} className="result-overlay-btn">மீண்டும் விளையாடு</button> */}
      </div>
    </div>
  );
}

export default ResultOverlay;
