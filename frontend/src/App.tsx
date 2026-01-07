import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import { verifyToken } from './api';
import type { CalculateResult } from './api';
import './styles/global.css';

function App() {
  const [user, setUser] = useState<{ email: string; token: string } | null>(null);
  const [result, setResult] = useState<CalculateResult | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    if (token && email) {
      verifyToken(token)
        .then((data) => {
          if (data.valid) {
            setUser({ token, email });
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('email');
        });
    }
  }, []);

  const handleLogin = (email: string, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    setUser({ email, token });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
  };

  const handleResult = (data: CalculateResult) => {
    setResult(data);
  };

  return (
    <BrowserRouter>
      <div className="container">
        <Header user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quiz" element={<Quiz user={user} onResult={handleResult} />} />
          <Route path="/result" element={<Result result={result} user={user} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;