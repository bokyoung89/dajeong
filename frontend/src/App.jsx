import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Page1 from "./Page1";
import Page2 from "./Page2";
import MyPage from "./MyPage";
import LoginPage from "./LoginPage";
import { AuthProvider } from "./AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Page1 />} />
          <Route path="/result" element={<Page2 />} />
          <Route path="/myPage" element={<MyPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;