import React, { useEffect, useState, useRef } from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import './App.css'
import "./index.css";
import HomePage from './pages/HomePage';
import ReactDOM from "react-dom/client";
import TigersAndGoats from "./components/TigersAndGoats";
import { preloadImages, preloadSounds } from "./utils/preloadAssets";

const App = () => {
 
  const [userID, setUserID] = useState(51);
  const [levelValue, setLevelValue] = useState(4); 
  // const [mode, setMode] = useState('freeplay');
  const [error, setError] = useState(null);

  useEffect(() => {
    preloadImages();
    preloadSounds();
  }, []);

  useEffect(() => {
    const handlePostMessage = (event) => {
      if (event.data && event.data.userID && event.data.levelValue) {
        const { userID, levelValue } = event.data;
        setUserID(userID);
        setLevelValue(levelValue);
        // setMode(mode);
        console.log("Received userID:", userID, "levelValue:", levelValue);
      } else {
        console.warn("Invalid message received:", event.data);
      }
    };

    window.addEventListener("message", handlePostMessage);

    return () => {
      window.removeEventListener("message", handlePostMessage);
    };
  }, []); 
  

  return (
    <Router
      basename={process.env.PUBLIC_URL}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
      <Route path="/" element={<HomePage />} />
        <Route
          path="/game"
          element={
            <TigersAndGoats
              userID={userID}
              level={levelValue}
              difficulty={
                levelValue <= 5 ? 'easy' :
                levelValue <= 8 ? 'medium' :
                'hard'
              }
            />
          }
        />
      </Routes>
    </Router>
  );
};

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Failed to find the root element");

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);

export default App;
