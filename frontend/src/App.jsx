import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Page1 from "./Page1";
import Page2 from "./Page2";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Page1 />} />
        <Route path="/result" element={<Page2 />} />
      </Routes>
    </Router>
  );
}

export default App;