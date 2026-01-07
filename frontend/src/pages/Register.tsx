import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Заполни все поля');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    try {
      await register(email, password);
      alert('Регистрация успешна! Теперь войди.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    }
  };

  return (
    <div className="page">
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '360px' }}>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Пароль (минимум 6 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Зарегистрироваться
        </button>
      </form>
      <p className="form-switch">
        Уже есть аккаунт? <Link to="/login">Войди</Link>
      </p>
      <Link to="/" className="btn-link" style={{ marginTop: '20px' }}>← Назад</Link>
    </div>
  );
}

export default Register;