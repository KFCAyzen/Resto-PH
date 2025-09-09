import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';
import './AdminLogin.css'; 

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState<string | null>(null);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pwd);
      alert("Connexion réussie !");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Déconnexion réussie !");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Administration</h1>
          <p>Paulina Hôtel - Back Office</p>
        </div>
        
        <form onSubmit={login} className="admin-login-form">
          <div className="input-group">
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@paulinahotel.com"
              type="email"
              required
              className="form-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="••••••••"
              type="password"
              required
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <p>Identifiants incorrects. Veuillez réessayer.</p>
            </div>
          )}

          <button type="submit" className="login-btn">
            Se connecter
          </button>
          
          <button type="button" onClick={handleLogout} className="logout-btn">
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
