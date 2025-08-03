import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { userDataContext } from "./context/UserContext";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Customize from "./pages/Customize";
import Customize2 from "./pages/Customize2";
import Home from "./pages/Home";

function App() {
  const { userData } = useContext(userDataContext);

  // ⏳ Show loader until session check is done
  if (userData === undefined) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <Routes>
      {/* 🏠 Home Page */}
      <Route
        path="/"
        element={
          userData?.assistantImage && userData?.assistantName
            ? <Home />
            : <Navigate to="/customize" />
        }
      />

      {/* 📝 Sign Up */}
      <Route
        path="/signup"
        element={!userData ? <SignUp /> : <Navigate to="/" />}
      />

      {/* 🔐 Sign In */}
      <Route
        path="/signin"
        element={!userData ? <SignIn /> : <Navigate to="/" />}
      />

      {/* 🎨 Customize Image */}
      <Route
        path="/customize"
        element={userData ? <Customize /> : <Navigate to="/signup" />}
      />

      {/* ✍️ Customize Name */}
      <Route
        path="/customize2"
        element={userData ? <Customize2 /> : <Navigate to="/signup" />}
      />
    </Routes>
  );
}

export default App;
