import { Link } from 'react-router-dom';

interface HeaderProps {
  user: { email: string; token: string } | null;
  onLogout: () => void;
}

function Header({ user, onLogout }: HeaderProps) {
  return (
    <header>
      <Link to="/" className="logo">Путь</Link>
      <div className="auth-buttons">
        {user ? (
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <button onClick={onLogout} className="btn-link">Выйти</button>
          </div>
        ) : (
          <>
            <Link to="/login" className="btn-link">Войти</Link>
            <Link to="/register" className="btn-secondary">Регистрация</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
