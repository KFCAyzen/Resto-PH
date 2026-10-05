import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import '../AdminLogin.css';

function messageErreur(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Identifiants incorrects. Veuillez réessayer.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
    case 'auth/network-request-failed':
      return 'Connexion internet indisponible. Vérifiez votre réseau.';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.';
    default:
      return 'Connexion impossible pour le moment. Veuillez réessayer.';
  }
}

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // En cas de succès, ProtectedAdminRoute affiche le back office via onAuthStateChanged
  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pwd);
    } catch (err) {
      setError(messageErreur((err as { code?: string }).code));
      setSubmitting(false);
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
              autoComplete="username"
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
              autoComplete="current-password"
              required
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              <span aria-hidden="true">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
