import React from 'react';
import '../App.css';

const overlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyles = {
  background: '#fff',
  padding: '2rem',
  borderRadius: '10px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
  minWidth: '300px',
  textAlign: 'center',
};

export default function ComputerTypeOverlay({ selectedType, setSelectedType, onStart }) {
  return (
    <div style={overlayStyles}>
      <div style={modalStyles}>
        <h2>Choose Computer Type</h2>
        <div style={{ margin: '1rem 0' }}>
          <label style={{ display: 'block', margin: '0.5rem 0' }}>
            <input
              type="radio"
              value={0}
              checked={selectedType === 0}
              onChange={() => setSelectedType(0)}
            />
            Computer as Tigers
          </label>
          <label style={{ display: 'block', margin: '0.5rem 0' }}>
            <input
              type="radio"
              value={1}
              checked={selectedType === 1}
              onChange={() => setSelectedType(1)}
            />
            Computer as Goats
          </label>
          <label style={{ display: 'block', margin: '0.5rem 0' }}>
            <input
              type="radio"
              value={2}
              checked={selectedType === 2}
              onChange={() => setSelectedType(2)}
            />
            Computer vs Computer
          </label>
        </div>
        <button onClick={onStart} style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}>
          Start
        </button>
      </div>
    </div>
  );
} 