import React from 'react';
import '../App.css';
import TigerImg from '../images/Tiger.png';
import GoatImg from '../images/Goat.png';

const overlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyles = {
  background: "url('https://www.transparenttextures.com/patterns/wood-pattern.png'), linear-gradient(135deg, #f8e7c1 60%, #c19a6b 100%)",
  backgroundSize: 'cover',
  border: '4px solid #b8860b',
  borderRadius: '18px',
  boxShadow: '0 6px 20px rgba(80, 50, 20, 0.2), 0 2px 8px #b8860b',
  padding: '1.5rem',
  textAlign: 'center',
  minWidth: '300px',
  maxWidth: '90vw',
  position: 'relative',
};

const optionRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2rem',
  margin: '1.2rem 0',
  cursor: 'pointer',
};

const labelStyle = {
  fontWeight: 'bold',
  fontSize: '1rem',
  color: '#a67c2e',
  marginTop: '0.3rem',
};

const getImageStyle = (selected, isSelected) => ({
  width: 65,
  height: 65,
  borderRadius: '50%',
  border: `3px solid ${isSelected ? '#ffd700' : '#b8860b'}`,
  background: '#fffbe6',
  boxShadow: isSelected ? '0 0 8px 3px #ffd700aa' : 'none',
  transition: 'transform 0.2s, box-shadow 0.2s',
  transform: isSelected ? 'scale(1.07)' : 'scale(1.0)',
});

export default function ComputerTypeOverlay({ selectedType, setSelectedType, onStart }) {
  return (
    <div style={overlayStyles}>
      <div style={modalStyles}>
        <h2 style={{
          color: '#a67c2e',
          fontFamily: 'Georgia, serif',
          textShadow: '0 1px 0 #fffbe6, 0 1px 6px #b8860b33',
          letterSpacing: '1px',
          marginBottom: '1.5rem',
          fontSize: '1.4rem'
        }}>
          யார் நீ?
        </h2>

        {/* Player as Goats */}
        <div
          style={optionRow}
          onClick={() => setSelectedType(0)}
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={GoatImg}
              alt="நீ (ஆடு)"
              style={getImageStyle(selectedType, selectedType === 0)}
            />
            <div style={labelStyle}>நீ (ஆடு)</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#b8860b' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <img
              src={TigerImg}
              alt="கணினி (புலி)"
              style={{
                width: 65,
                height: 65,
                borderRadius: '50%',
                border: '3px solid #b8860b',
                background: '#fffbe6'
              }}
            />
            <div style={labelStyle}>கணினி (புலி)</div>
          </div>
        </div>

        {/* Player as Tigers */}
        <div
          style={optionRow}
          onClick={() => setSelectedType(1)}
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={TigerImg}
              alt="நீ (புலி)"
              style={getImageStyle(selectedType, selectedType === 1)}
            />
            <div style={labelStyle}>நீ (புலி)</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#b8860b' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <img
              src={GoatImg}
              alt="கணினி (ஆடு)"
              style={{
                width: 65,
                height: 65,
                borderRadius: '50%',
                border: '3px solid #b8860b',
                background: '#fffbe6'
              }}
            />
            <div style={labelStyle}>கணினி (ஆடு)</div>
          </div>
        </div>

        <button
          onClick={onStart}
          style={{
            padding: '0.5rem 1.8rem',
            background: 'linear-gradient(90deg, #ffe082 60%, #ffb300 100%)',
            color: '#7c5a1a',
            border: '2px solid #b8860b',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '1.8rem',
            boxShadow: '0 2px 6px #b8860b44',
            transition: 'background 0.2s, transform 0.2s'
          }}
        >
          ஆடலாம் வா!
        </button>
      </div>
    </div>
  );
}
