import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/index.css';

/* --- TEMPORARY ADMIN SEED SCRIPT ---
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from './firebaseRTDB'; // Ensure this points to your RTDB config

async function createAdmin() {
  const email = "admin@edulink.com";
  const password = "adminpassword123"; // Must be at least 6 chars

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create Admin Profile in Realtime Database
    await set(ref(db, 'users/' + user.uid), {
      name: "Super Admin",
      email: email,
      role: "admin",
      createdAt: new Date().toISOString()
    });

    console.log("✅ ADMIN ACCOUNT CREATED SUCCESSFULLY");
    console.log("Email:", email);
    console.log("Password:", password);
    alert(`Admin Created!\nEmail: ${email}\nPassword: ${password}`);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("⚠️ Admin account already exists.");
    } else {
      console.error("❌ Error creating admin:", error);
    }
  }
}

// Uncomment the line below to run it ONCE, then comment it out again
// createAdmin(); 
// -----------------------------------*/

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>

);