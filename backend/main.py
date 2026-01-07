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
    
    if data.smoking:
        base_life -= 5
    if data.alcohol == "often":
        base_life -= 3
    elif data.alcohol == "sometimes":
        base_life -= 1
    if data.sport == "regular":
        base_life += 3
    elif data.sport == "sometimes":
        base_life += 1
    if data.chronic_diseases:
        base_life -= 4
    
    health_adjustment = (data.health_score - 5) * 0.5
    base_life += health_adjustment
    
    years_left = max(1, base_life - data.age)
    months_left = years_left * 12
    weeks_left = years_left * 52
    days_left = years_left * 365
    active_days = int(days_left * 0.5)
    
    monthly_savings = data.income - data.expenses
    years_to_retirement = max(0, data.retirement_age - data.age)
    savings_at_retirement = data.savings + (monthly_savings * 12 * years_to_retirement)
    pension_years = max(1, base_life - data.retirement_age)
    state_pension = 15000
    monthly_pension = (savings_at_retirement / (pension_years * 12)) + state_pension
    
    gap = data.desired_pension - monthly_pension
    needed_monthly_savings = 0
    if gap > 0 and years_to_retirement > 0:
        needed_monthly_savings = (gap * pension_years * 12) / (years_to_retirement * 12)
    
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
