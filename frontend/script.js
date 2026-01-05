const API_URL = 'http://localhost:8000';

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

let currentQuestion = 0;
let answers = {};

function startQuiz() {
    document.getElementById('hero').classList.add('hidden');
    document.getElementById('quiz').classList.remove('hidden');
    showQuestion();
}

function showQuestion() {
    const q = questions[currentQuestion];
    const container = document.getElementById('question-container');
    
    // Update progress
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    document.getElementById('progress').style.width = progress + '%';
    
    // Show/hide prev button
    document.getElementById('btn-prev').classList.toggle('hidden', currentQuestion === 0);
    
    // Change button text on last question
    document.getElementById('btn-next').textContent = 
        currentQuestion === questions.length - 1 ? 'Узнать результат' : 'Далее';
    
    let html = `<div class="question"><h3>${q.question}</h3>`;
    
    if (q.type === 'choice') {
        html += '<div class="options">';
        q.options.forEach(opt => {
            const selected = answers[q.id] === opt.value ? 'selected' : '';
            html += `<div class="option ${selected}" onclick="selectOption('${q.id}', ${JSON.stringify(opt.value).replace(/"/g, '&quot;')})">${opt.label}</div>`;
        });
        html += '</div>';
    } else if (q.type === 'number') {
        const value = answers[q.id] || '';
        html += `<div class="input-group">
            <input type="number" id="input-${q.id}" value="${value}" placeholder="0">
            <p class="input-hint">${q.hint}</p>
        </div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Focus input if number type
    if (q.type === 'number') {
        document.getElementById(`input-${q.id}`).focus();
    }
}

function selectOption(id, value) {
    answers[id] = value;
    document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
}

function nextQuestion() {
    const q = questions[currentQuestion];
    
    // Save answer if number input
    if (q.type === 'number') {
        const input = document.getElementById(`input-${q.id}`);
        answers[q.id] = parseInt(input.value) || 0;
    }
    
    // Validate
    if (answers[q.id] === undefined) {
        alert('Выбери ответ');
        return;
    }
    
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        calculate();
    }
}

function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion();
    }
}

async function calculate() {
    document.getElementById('quiz').classList.add('hidden');
    
    try {
        const response = await fetch(`${API_URL}/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(answers)
        });
        
        const data = await response.json();
        showResult(data);
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка расчёта. Проверь что сервер запущен.');
    }
}

function showResult(data) {
    document.getElementById('result').classList.remove('hidden');
    
    // Time
    document.getElementById('years-left').textContent = data.time.years;
    document.getElementById('months-left').textContent = data.time.months.toLocaleString();
    document.getElementById('days-left').textContent = data.time.days.toLocaleString();
    document.getElementById('active-days').textContent = data.time.active_days.toLocaleString();
    
    // Money
    document.getElementById('savings-retirement').textContent = data.money.savings_at_retirement.toLocaleString();
    document.getElementById('monthly-pension').textContent = data.money.monthly_pension.toLocaleString();
    document.getElementById('desired').textContent = data.money.desired_pension.toLocaleString();
    document.getElementById('gap').textContent = data.money.gap.toLocaleString();
    document.getElementById('needed').textContent = data.money.needed_monthly_savings.toLocaleString();
    
    // Hide gap block if no gap
    if (data.money.gap <= 0) {
        document.getElementById('gap-block').classList.add('hidden');
    }
}

function restart() {
    currentQuestion = 0;
    answers = {};
    document.getElementById('result').classList.add('hidden');
    document.getElementById('hero').classList.remove('hidden');
}