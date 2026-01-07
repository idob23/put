import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from jose import jwt
import json
from dotenv import load_dotenv

from database import create_user, verify_user, save_user_data, get_user_history

# Загружаем переменные из .env
load_dotenv()

app = FastAPI()

# JWT настройки из переменных окружения
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "30"))

# Проверка что SECRET_KEY установлен
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY не установлен! Создайте .env файл.")

# CORS - указываем конкретные домены
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://put-life.ru,https://www.put-life.ru").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# Модели с валидацией
class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenData(BaseModel):
    token: str

class UserData(BaseModel):
    age: int = Field(ge=1, le=150)
    gender: str
    smoking: bool
    alcohol: str
    sport: str
    chronic_diseases: bool
    health_score: int = Field(ge=1, le=10)
    income: int = Field(ge=0, le=100000000)
    expenses: int = Field(ge=0, le=100000000)
    savings: int = Field(ge=0, le=10000000000)
    retirement_age: int = Field(ge=1, le=150)
    desired_pension: int = Field(ge=0, le=100000000)
    token: str = None

# Функции
def create_token(user_id: int, email: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    data = {"user_id": user_id, "email": email, "exp": expire}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        return None

# Эндпоинты авторизации
@app.post("/register")
def register(user: UserRegister):
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть минимум 6 символов")
    
    if create_user(user.email, user.password):
        return {"success": True, "message": "Регистрация успешна"}
    else:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

@app.post("/login")
def login(user: UserLogin):
    verified = verify_user(user.email, user.password)
    if verified:
        token = create_token(verified["id"], verified["email"])
        return {"success": True, "token": token, "email": verified["email"]}
    else:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

@app.post("/verify-token")
def verify_token_endpoint(data: TokenData):
    payload = verify_token(data.token)
    if payload:
        return {"valid": True, "email": payload["email"]}
    else:
        raise HTTPException(status_code=401, detail="Невалидный токен")

# Основной расчёт
@app.post("/calculate")
def calculate(data: UserData):
    # Расчёт оставшихся лет жизни
    base_life = 73 if data.gender == "male" else 78
    initial_life = base_life

    # Объяснения влияния факторов
    factors = []
    factors.append({
        "name": "Базовая продолжительность",
        "value": f"{initial_life} лет",
        "description": f"Средняя продолжительность жизни для {'мужчин' if data.gender == 'male' else 'женщин'} в России"
    })

    if data.smoking:
        base_life -= 5
        factors.append({
            "name": "Курение",
            "value": "-5 лет",
            "description": "Курение сокращает продолжительность жизни в среднем на 5-10 лет из-за риска рака и сердечно-сосудистых заболеваний"
        })

    if data.alcohol == "often":
        base_life -= 3
        factors.append({
            "name": "Частое употребление алкоголя",
            "value": "-3 года",
            "description": "Регулярное употребление алкоголя негативно влияет на печень, сердце и нервную систему"
        })
    elif data.alcohol == "sometimes":
        base_life -= 1
        factors.append({
            "name": "Умеренное употребление алкоголя",
            "value": "-1 год",
            "description": "Даже умеренное употребление алкоголя имеет небольшое негативное влияние на здоровье"
        })

    if data.sport == "regular":
        base_life += 3
        factors.append({
            "name": "Регулярные занятия спортом",
            "value": "+3 года",
            "description": "Регулярная физическая активность укрепляет сердце, снижает риск многих заболеваний"
        })
    elif data.sport == "sometimes":
        base_life += 1
        factors.append({
            "name": "Периодические занятия спортом",
            "value": "+1 год",
            "description": "Даже нерегулярная физическая активность положительно влияет на здоровье"
        })

    if data.chronic_diseases:
        base_life -= 4
        factors.append({
            "name": "Хронические заболевания",
            "value": "-4 года",
            "description": "Хронические болезни требуют постоянного контроля и снижают общую продолжительность жизни"
        })

    health_adjustment = (data.health_score - 5) * 0.5
    if health_adjustment != 0:
        base_life += health_adjustment
        factors.append({
            "name": "Общее состояние здоровья",
            "value": f"{'+' if health_adjustment > 0 else ''}{round(health_adjustment, 1)} лет",
            "description": f"Твоя самооценка здоровья ({data.health_score}/10) {'выше' if health_adjustment > 0 else 'ниже'} среднего"
        })

    years_left = max(1, base_life - data.age)
    months_left = years_left * 12
    weeks_left = years_left * 52
    days_left = years_left * 365
    active_days = int(days_left * 0.5)

    factors.append({
        "name": "Итоговая продолжительность",
        "value": f"{round(base_life, 1)} лет",
        "description": f"С учётом всех факторов, ожидаемый возраст: {round(base_life, 1)} лет. Осталось примерно {round(years_left, 1)} лет"
    })

    # Финансовые расчёты
    monthly_savings = data.income - data.expenses
    years_to_retirement = max(0, data.retirement_age - data.age)
    savings_at_retirement = data.savings + (monthly_savings * 12 * years_to_retirement)
    pension_years = max(1, base_life - data.retirement_age)
    state_pension = 15000
    monthly_pension = (savings_at_retirement / (pension_years * 12)) + state_pension

    financial_breakdown = []
    financial_breakdown.append({
        "name": "Ежемесячные накопления",
        "value": f"{monthly_savings:,} ₽",
        "description": f"Доход {data.income:,} ₽ - Расходы {data.expenses:,} ₽ = {monthly_savings:,} ₽/мес"
    })

    financial_breakdown.append({
        "name": "Время до пенсии",
        "value": f"{years_to_retirement} лет",
        "description": f"С {data.age} до {data.retirement_age} лет осталось {years_to_retirement} лет работы"
    })

    financial_breakdown.append({
        "name": "Накопления к пенсии",
        "value": f"{savings_at_retirement:,} ₽",
        "description": f"Текущие накопления {data.savings:,} ₽ + ({monthly_savings:,} ₽/мес × 12 × {years_to_retirement} лет)"
    })

    financial_breakdown.append({
        "name": "Пенсионный период",
        "value": f"{round(pension_years, 1)} лет",
        "description": f"С {data.retirement_age} до {round(base_life, 1)} лет — период на пенсии"
    })

    financial_breakdown.append({
        "name": "Пенсия от накоплений",
        "value": f"{int(savings_at_retirement / (pension_years * 12)):,} ₽/мес",
        "description": f"Накопления {savings_at_retirement:,} ₽ распределённые на {round(pension_years, 1)} лет"
    })

    financial_breakdown.append({
        "name": "Государственная пенсия",
        "value": f"{state_pension:,} ₽/мес",
        "description": "Примерная средняя пенсия по России (может отличаться)"
    })

    gap = data.desired_pension - monthly_pension
    needed_monthly_savings = 0
    if gap > 0 and years_to_retirement > 0:
        needed_monthly_savings = (gap * pension_years * 12) / (years_to_retirement * 12)
        financial_breakdown.append({
            "name": "Недостаток пенсии",
            "value": f"{int(gap):,} ₽/мес",
            "description": f"Хочешь {data.desired_pension:,} ₽/мес, получишь {int(monthly_pension):,} ₽/мес. Разница: {int(gap):,} ₽/мес"
        })
        financial_breakdown.append({
            "name": "Нужно откладывать дополнительно",
            "value": f"{int(needed_monthly_savings):,} ₽/мес",
            "description": f"Чтобы покрыть разницу в {int(gap):,} ₽/мес на {round(pension_years, 1)} лет пенсии"
        })

    # Генерация персонализированных рекомендаций
    health_recommendations = []
    financial_recommendations = []

    # Рекомендации по здоровью
    if data.smoking:
        health_recommendations.append({
            "priority": "high",
            "title": "Бросить курить",
            "impact": "+5 лет жизни",
            "description": "Отказ от курения — самое важное решение для здоровья",
            "actions": [
                "Посети врача для консультации",
                "Рассмотри никотинозаместительную терапию",
                "Найди группу поддержки или приложение для отслеживания"
            ]
        })

    if data.sport == "never" or data.sport == "sometimes":
        health_recommendations.append({
            "priority": "high" if data.sport == "never" else "medium",
            "title": "Больше физической активности",
            "impact": f"+{3 if data.sport == 'never' else 2} года жизни",
            "description": "Регулярные тренировки значительно улучшают здоровье и продлевают жизнь",
            "actions": [
                "Начни с 30 минут ходьбы 5 раз в неделю",
                "Запишись в спортзал или на групповые занятия",
                "Найди спортивного партнёра для мотивации"
            ]
        })

    if data.alcohol in ["sometimes", "often"]:
        health_recommendations.append({
            "priority": "high" if data.alcohol == "often" else "medium",
            "title": "Сократить употребление алкоголя",
            "impact": f"+{3 if data.alcohol == 'often' else 1} год жизни",
            "description": "Снижение употребления алкоголя улучшает здоровье печени и сердца",
            "actions": [
                "Установи лимит: не более 2 порций в неделю",
                "Замени алкоголь безалкогольными напитками на встречах",
                "Отслеживай потребление в приложении"
            ]
        })

    if data.health_score < 7:
        health_recommendations.append({
            "priority": "medium",
            "title": "Улучшить общее состояние здоровья",
            "impact": f"+{(7 - data.health_score) * 0.5:.1f} года",
            "description": "Комплексный подход к здоровью даст значительный эффект",
            "actions": [
                "Пройди полное медицинское обследование",
                "Наладь режим сна (7-8 часов)",
                "Улучши питание: больше овощей, меньше переработанной еды"
            ]
        })

    # Финансовые рекомендации
    if gap > 0:
        financial_recommendations.append({
            "priority": "high",
            "title": f"Увеличить накопления на {int(needed_monthly_savings):,} ₽/мес",
            "impact": f"Достигнешь цели {data.desired_pension:,} ₽/мес на пенсии",
            "description": f"Чтобы получать желаемую пенсию, нужно откладывать больше",
            "actions": [
                f"Оптимизируй расходы: найди {int(needed_monthly_savings):,} ₽ для сбережений",
                "Автоматизируй накопления — настрой автоплатёж в день зарплаты",
                "Инвестируй в ИИС (индивидуальный инвестиционный счёт) для налогового вычета"
            ]
        })

    if monthly_savings > 0 and monthly_savings < data.income * 0.2:
        financial_recommendations.append({
            "priority": "medium",
            "title": "Увеличить долю сбережений",
            "impact": "Быстрее достигнешь финансовых целей",
            "description": f"Сейчас откладываешь {int(monthly_savings / data.income * 100)}%, рекомендуется 20%",
            "actions": [
                f"Стремись откладывать {int(data.income * 0.2):,} ₽/мес (20% дохода)",
                "Используй правило 50/30/20: 50% на нужды, 30% на желания, 20% на сбережения",
                "Отслеживай расходы в приложении (например, Дзен-мани, Wallet)"
            ]
        })

    if years_to_retirement > 5:
        financial_recommendations.append({
            "priority": "high",
            "title": "Начать инвестировать",
            "impact": "Прибыль 7-10% годовых vs 4-6% вклад",
            "description": f"До пенсии {years_to_retirement} лет — время работает на тебя",
            "actions": [
                "Открой брокерский счёт (Тинькофф, Сбер, ВТБ)",
                "Начни с ETF на индекс Мосбиржи или S&P 500",
                "Инвестируй регулярно, независимо от рынка (усреднение)"
            ]
        })

    result = {
        "time": {
            "years": round(years_left, 1),
            "months": int(months_left),
            "weeks": int(weeks_left),
            "days": int(days_left),
            "active_days": active_days
        },
        "money": {
            "savings_at_retirement": int(savings_at_retirement),
            "monthly_pension": int(monthly_pension),
            "desired_pension": data.desired_pension,
            "gap": int(max(0, gap)),
            "needed_monthly_savings": int(max(0, needed_monthly_savings))
        },
        "explanations": {
            "health_factors": factors,
            "financial_breakdown": financial_breakdown
        },
        "recommendations": {
            "health": health_recommendations,
            "financial": financial_recommendations,
            "is_premium": False  # Пока бесплатно, потом сделаем paywall
        }
    }
    
    # Сохраняем если пользователь авторизован
    if data.token:
        payload = verify_token(data.token)
        if payload:
            save_user_data(
                payload["user_id"],
                json.dumps(data.dict()),
                json.dumps(result)
            )
    
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
