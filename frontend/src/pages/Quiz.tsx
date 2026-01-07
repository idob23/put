import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculate } from '../api';
import type { UserData, CalculateResult } from '../api';

interface QuizProps {
  user: { email: string; token: string } | null;
  onResult: (result: CalculateResult) => void;
}

const questions = [
  {
    id: 'age',
    question: 'Сколько тебе лет?',
    type: 'number',
    hint: 'Введи свой возраст',
    info: 'Возраст — основа для расчёта оставшегося времени жизни'
  },
  {
    id: 'gender',
    question: 'Твой пол?',
    type: 'choice',
    options: [
      { value: 'male', label: 'Мужской' },
      { value: 'female', label: 'Женский' }
    ],
    info: 'В России средняя продолжительность жизни мужчин 73 года, женщин — 78 лет'
  },
  {
    id: 'smoking',
    question: 'Куришь?',
    type: 'choice',
    options: [
      { value: true, label: 'Да' },
      { value: false, label: 'Нет' }
    ],
    info: 'Курение сокращает жизнь в среднем на 5-10 лет и повышает риск рака и сердечно-сосудистых заболеваний'
  },
  {
    id: 'alcohol',
    question: 'Алкоголь?',
    type: 'choice',
    options: [
      { value: 'never', label: 'Не пью' },
      { value: 'sometimes', label: 'Иногда' },
      { value: 'often', label: 'Часто' }
    ],
    info: 'Регулярное употребление алкоголя негативно влияет на печень, сердце и нервную систему (-3 года), даже умеренное имеет небольшое влияние (-1 год)'
  },
  {
    id: 'sport',
    question: 'Занимаешься спортом?',
    type: 'choice',
    options: [
      { value: 'never', label: 'Нет' },
      { value: 'sometimes', label: 'Иногда' },
      { value: 'regular', label: 'Регулярно' }
    ],
    info: 'Регулярная физическая активность продлевает жизнь на 3+ года, укрепляет сердце и снижает риск болезней'
  },
  {
    id: 'chronic_diseases',
    question: 'Есть хронические болезни?',
    type: 'choice',
    options: [
      { value: true, label: 'Да' },
      { value: false, label: 'Нет' }
    ],
    info: 'Хронические заболевания требуют постоянного контроля и в среднем сокращают жизнь на 4 года'
  },
  {
    id: 'health_score',
    question: 'Как оцениваешь своё здоровье?',
    type: 'number',
    hint: 'От 1 (плохо) до 10 (отлично)',
    info: 'Самооценка здоровья коррелирует с реальным состоянием. Каждый балл выше 5 добавляет 0.5 года, ниже — вычитает'
  },
  {
    id: 'income',
    question: 'Доход в месяц?',
    type: 'number',
    hint: 'В рублях',
    info: 'Твой ежемесячный доход до вычета расходов'
  },
  {
    id: 'expenses',
    question: 'Расходы в месяц?',
    type: 'number',
    hint: 'В рублях',
    info: 'Сколько тратишь в месяц. Разница между доходом и расходами — это твои накопления'
  },
  {
    id: 'savings',
    question: 'Накопления сейчас?',
    type: 'number',
    hint: 'В рублях',
    info: 'Твои текущие сбережения — стартовый капитал для расчёта пенсионных накоплений'
  },
  {
    id: 'retirement_age',
    question: 'Во сколько лет хочешь перестать работать?',
    type: 'number',
    hint: 'Желаемый возраст выхода на пенсию',
    info: 'Возраст, когда планируешь выйти на пенсию. Официально: мужчины 65, женщины 60 лет'
  },
  {
    id: 'desired_pension',
    question: 'Сколько хочешь получать на пенсии?',
    type: 'number',
    hint: 'Рублей в месяц',
    info: 'Желаемый уровень дохода на пенсии. Поможем рассчитать, сколько нужно откладывать для этой цели'
  }
];

function Quiz({ user, onResult }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  const q = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const selectOption = (value: any) => {
    setAnswers({ ...answers, [q.id]: value });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers({ ...answers, [q.id]: parseInt(e.target.value) || 0 });
  };

  const nextQuestion = async () => {
    if (answers[q.id] === undefined) {
      alert('Выбери ответ');
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Отправляем данные
      const payload: UserData = {
        age: answers.age,
        gender: answers.gender,
        smoking: answers.smoking,
        alcohol: answers.alcohol,
        sport: answers.sport,
        chronic_diseases: answers.chronic_diseases,
        health_score: answers.health_score,
        income: answers.income,
        expenses: answers.expenses,
        savings: answers.savings,
        retirement_age: answers.retirement_age,
        desired_pension: answers.desired_pension,
        token: user?.token
      };

      try {
        const result = await calculate(payload);
        onResult(result);
        navigate('/result');
      } catch (error) {
        alert('Ошибка расчёта');
      }
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <div className="page">
      <div className="progress-bar" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="progress" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="question">
        <h3>{q.question}</h3>

        {q.info && (
          <div style={{
            fontSize: '14px',
            color: '#666',
            background: '#f0f8ff',
            padding: '10px 15px',
            borderRadius: '6px',
            marginBottom: '20px',
            borderLeft: '3px solid #4a90e2'
          }}>
            💡 {q.info}
          </div>
        )}

        {q.type === 'choice' && (
          <div className="options">
            {q.options?.map((opt) => (
              <div
                key={String(opt.value)}
                className={`option ${answers[q.id] === opt.value ? 'selected' : ''}`}
                onClick={() => selectOption(opt.value)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}

        {q.type === 'number' && (
          <div className="input-group">
            <input
              type="number"
              value={answers[q.id] || ''}
              onChange={handleInputChange}
              placeholder="0"
            />
            <p className="input-hint">{q.hint}</p>
          </div>
        )}
      </div>

      <div className="nav-buttons">
        {currentQuestion > 0 && (
          <button onClick={prevQuestion} className="btn-secondary">
            Назад
          </button>
        )}
        <button onClick={nextQuestion} className="btn-primary">
          {currentQuestion === questions.length - 1 ? 'Узнать результат' : 'Далее'}
        </button>
      </div>
    </div>
  );
}

export default Quiz;