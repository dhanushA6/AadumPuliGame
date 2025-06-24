
import React, { useEffect, useState, useRef } from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import axios from "axios";
import "./index.css";
import ReactDOM from "react-dom/client";
import TigersAndGoats from "./components/TigersAndGoats";

const App = () => {


  return (
    <Router
      basename={process.env.PUBLIC_URL}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
       
        <Route
          path="/"
          element={
            <TigersAndGoats/>
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
