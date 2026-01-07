import sqlite3
import hashlib
import secrets

DB_PATH = "users.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            result TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

def hash_password(password: str, salt: str = None) -> tuple:
    if salt is None:
        salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return password_hash, salt

def create_user(email: str, password: str) -> bool:
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        password_hash, salt = hash_password(password)
        c.execute("INSERT INTO users (email, password_hash, salt) VALUES (?, ?, ?)", 
                  (email, password_hash, salt))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False

def verify_user(email: str, password: str) -> dict | None:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, email, password_hash, salt FROM users WHERE email = ?", (email,))
    row = c.fetchone()
    conn.close()
    
    if row:
        password_hash, _ = hash_password(password, row[3])
        if password_hash == row[2]:
            return {"id": row[0], "email": row[1]}
    return None

def save_user_data(user_id: int, data: str, result: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO user_data (user_id, data, result) VALUES (?, ?, ?)",
              (user_id, data, result))
    conn.commit()
    conn.close()

def get_user_history(user_id: int) -> list:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT data, result, created_at FROM user_data WHERE user_id = ? ORDER BY created_at DESC",
              (user_id,))
    rows = c.fetchall()
    conn.close()
    return rows

# Инициализация при импорте
init_db()
