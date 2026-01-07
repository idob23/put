import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CalculateResult } from '../api';

interface ResultProps {
  result: CalculateResult | null;
  user: { email: string; token: string } | null;
}

function Result({ result, user }: ResultProps) {
  const [showHealthDetails, setShowHealthDetails] = useState(false);
  const [showMoneyDetails, setShowMoneyDetails] = useState(false);

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

        {result.explanations?.health_factors && (
          <>
            <button
              onClick={() => setShowHealthDetails(!showHealthDetails)}
              style={{
                marginTop: '15px',
                padding: '10px 18px',
                background: '#f0f0f0',
                border: '1px solid #999',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e0e0e0'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f0f0f0'}
            >
              {showHealthDetails ? '▼ Скрыть детали расчёта' : '▶ Показать детали расчёта'}
            </button>

            {showHealthDetails && (
              <div style={{ marginTop: '15px', fontSize: '14px', lineHeight: '1.6' }}>
                {result.explanations.health_factors.map((factor, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '12px',
                      padding: '12px',
                      background: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      borderLeft: index === result.explanations!.health_factors.length - 1 ? '4px solid #28a745' : '4px solid #007bff'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>
                      {factor.name}: {factor.value}
                    </div>
                    <div style={{ color: '#666', fontSize: '13px' }}>{factor.description}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="result-block" style={{ width: '100%' }}>
        <h3>💰 Деньги</h3>
        <p>Если ничего не менять:</p>
        <ul>
          <li>К пенсии накопишь: <strong>{result.money.savings_at_retirement.toLocaleString()} ₽</strong></li>
          <li>Пенсия будет: <strong>{result.money.monthly_pension.toLocaleString()} ₽/мес</strong></li>
        </ul>

        {result.explanations?.financial_breakdown && (
          <>
            <button
              onClick={() => setShowMoneyDetails(!showMoneyDetails)}
              style={{
                marginTop: '15px',
                padding: '10px 18px',
                background: '#f0f0f0',
                border: '1px solid #999',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e0e0e0'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f0f0f0'}
            >
              {showMoneyDetails ? '▼ Скрыть детали расчёта' : '▶ Показать детали расчёта'}
            </button>

            {showMoneyDetails && (
              <div style={{ marginTop: '15px', fontSize: '14px', lineHeight: '1.6' }}>
                {result.explanations.financial_breakdown.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '12px',
                      padding: '12px',
                      background: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      borderLeft: '4px solid #ffc107'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>
                      {item.name}: {item.value}
                    </div>
                    <div style={{ color: '#666', fontSize: '13px' }}>{item.description}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
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