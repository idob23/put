import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>Узнай сколько тебе осталось</h1>
      <p className="subtitle">И хватит ли денег на жизнь которую ты хочешь</p>
      <button onClick={() => navigate('/quiz')} className="btn-primary">
        Рассчитать бесплатно
      </button>
    </div>
  );
}

export default Home;