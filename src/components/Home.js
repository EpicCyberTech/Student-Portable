import React from "react";

export default function Home({ user, onLogout }) {
  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h1>Welcome, {user.email}</h1>
      <p>You are successfully logged in to Student Portal 🎓</p>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}
