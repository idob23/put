import { Link } from 'react-router-dom';
import type { CalculateResult } from '../api';

interface ResultProps {
  result: CalculateResult | null;
  user: { email: string; token: string } | null;
}

function Result({ result, user }: ResultProps) {
  if (!result) {
    return (
      <div className="page">
        <h2>Нет данных</h2>
        <Link to="/quiz" className="btn-primary">Пройти тест</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Твой путь</h2>

      <div className="result-block" style={{ width: '100%' }}>
        <h3>⏱ Время</h3>
        <div className="time-grid">
          <div className="time-item">
            <span className="number">{result.time.years}</span>
            <span className="label">лет</span>
          </div>
          <div className="time-item">
            <span className="number">{result.time.months.toLocaleString()}</span>
            <span className="label">месяцев</span>
          </div>
          <div className="time-item">
            <span className="number">{result.time.days.toLocaleString()}</span>
            <span className="label">дней</span>
          </div>
        </div>
        <p className="note">
          Из них активных здоровых дней: <strong>{result.time.active_days.toLocaleString()}</strong>
        </p>
      </div>

      <div className="result-block" style={{ width: '100%' }}>
        <h3>💰 Деньги</h3>
        <p>Если ничего не менять:</p>
        <ul>
          <li>К пенсии накопишь: <strong>{result.money.savings_at_retirement.toLocaleString()} ₽</strong></li>
          <li>Пенсия будет: <strong>{result.money.monthly_pension.toLocaleString()} ₽/мес</strong></li>
        </ul>
      </div>

      {result.money.gap > 0 && (
        <div className="result-block" style={{ width: '100%' }}>
          <h3>📊 Реальность</h3>
          <p>Ты хочешь <strong>{result.money.desired_pension.toLocaleString()} ₽/мес</strong> на пенсии</p>
          <p>Разрыв: <strong>{result.money.gap.toLocaleString()} ₽/мес</strong></p>
          <p>Нужно откладывать: <strong>{result.money.needed_monthly_savings.toLocaleString()} ₽/мес</strong></p>
        </div>
      )}

      {!user && (
        <div className="result-block save-prompt" style={{ width: '100%' }}>
          <p>💾 <Link to="/register">Зарегистрируйся</Link> чтобы сохранить результат</p>
        </div>
      )}

      <Link to="/" className="btn-secondary" style={{ marginTop: '20px' }}>
        Пересчитать
      </Link>
    </div>
  );
}

export default Result;