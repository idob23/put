from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Разрешаем запросы с frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserData(BaseModel):
    age: int
    gender: str  # male / female
    smoking: bool
    alcohol: str  # never / sometimes / often
    sport: str  # never / sometimes / regular
    chronic_diseases: bool
    health_score: int  # 1-10
    income: int
    expenses: int
    savings: int
    retirement_age: int
    desired_pension: int

@app.post("/calculate")
def calculate(data: UserData):
    # Расчёт оставшихся лет жизни
    base_life = 73 if data.gender == "male" else 78
    
    # Корректировки
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
    
    # Корректировка по самооценке здоровья
    health_adjustment = (data.health_score - 5) * 0.5
    base_life += health_adjustment
    
    years_left = max(1, base_life - data.age)
    months_left = years_left * 12
    weeks_left = years_left * 52
    days_left = years_left * 365
    active_days = int(days_left * 0.5)  # примерно половина — активные
    
    # Расчёт финансов
    monthly_savings = data.income - data.expenses
    years_to_retirement = max(0, data.retirement_age - data.age)
    
    # Накопления к пенсии (простой расчёт без процентов)
    savings_at_retirement = data.savings + (monthly_savings * 12 * years_to_retirement)
    
    # Сколько лет на пенсии
    pension_years = max(1, base_life - data.retirement_age)
    
    # Пенсия в месяц (накопления / месяцы пенсии) + государственная (~15000)
    state_pension = 15000
    monthly_pension = (savings_at_retirement / (pension_years * 12)) + state_pension
    
    # Разрыв
    gap = data.desired_pension - monthly_pension
    needed_monthly_savings = 0
    if gap > 0 and years_to_retirement > 0:
        needed_monthly_savings = (gap * pension_years * 12) / (years_to_retirement * 12)
    
    return {
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)