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
    hint: 'Введи свой возраст'
  },
  {
    id: 'gender',
    question: 'Твой пол?',
    type: 'choice',
    options: [
      { value: 'male', label: 'Мужской' },
      { value: 'female', label: 'Женский' }
    ]
  },
  {
    id: 'smoking',
    question: 'Куришь?',
    type: 'choice',
    options: [
      { value: true, label: 'Да' },
      { value: false, label: 'Нет' }
    ]
  },
  {
    id: 'alcohol',
    question: 'Алкоголь?',
    type: 'choice',
    options: [
      { value: 'never', label: 'Не пью' },
      { value: 'sometimes', label: 'Иногда' },
      { value: 'often', label: 'Часто' }
    ]
  },
  {
    id: 'sport',
    question: 'Занимаешься спортом?',
    type: 'choice',
    options: [
      { value: 'never', label: 'Нет' },
      { value: 'sometimes', label: 'Иногда' },
      { value: 'regular', label: 'Регулярно' }
    ]
  },
  {
    id: 'chronic_diseases',
    question: 'Есть хронические болезни?',
    type: 'choice',
    options: [
      { value: true, label: 'Да' },
      { value: false, label: 'Нет' }
    ]
  },
  {
    id: 'health_score',
    question: 'Как оцениваешь своё здоровье?',
    type: 'number',
    hint: 'От 1 (плохо) до 10 (отлично)'
  },
  {
    id: 'income',
    question: 'Доход в месяц?',
    type: 'number',
    hint: 'В рублях'
  },
  {
    id: 'expenses',
    question: 'Расходы в месяц?',
    type: 'number',
    hint: 'В рублях'
  },
  {
    id: 'savings',
    question: 'Накопления сейчас?',
    type: 'number',
    hint: 'В рублях'
  },
  {
    id: 'retirement_age',
    question: 'Во сколько лет хочешь перестать работать?',
    type: 'number',
    hint: 'Желаемый возраст выхода на пенсию'
  },
  {
    id: 'desired_pension',
    question: 'Сколько хочешь получать на пенсии?',
    type: 'number',
    hint: 'Рублей в месяц'
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