# 🍎 Gem Rush — Match-3 на деньги

Мобильный мультиплеерный match-3 где все играют на одном поле. Первый до 1000 очков забирает деньги.

---

## 🚀 Быстрый старт (3 минуты)

### 1. Открыть проект в Cursor

```bash
# Скачай папку gem-rush-project и открой в Cursor:
# File → Open Folder → выбери gem-rush-project
```

### 2. Установить зависимости

Открой терминал в Cursor (`Ctrl+~` или `Cmd+~`) и выполни:

```bash
npm install
```

### 3. Запустить локально

```bash
npm run dev
```

Откроется `http://localhost:3000` — играй!

---

## 🌍 Деплой на Vercel (бесплатно, 2 минуты)

### Вариант A — Через CLI (самый быстрый)

```bash
# Установить Vercel CLI (один раз)
npm i -g vercel

# Задеплоить
vercel

# Следуй инструкциям:
# - Set up and deploy? → Y
# - Which scope? → выбери свой аккаунт
# - Link to existing project? → N
# - Project name? → gem-rush
# - Directory? → ./
# - Override settings? → N

# Готово! Получишь URL типа gem-rush-xxx.vercel.app

# Для продакшен-деплоя:
vercel --prod
```

### Вариант B — Через GitHub + Vercel Dashboard

1. Создай репозиторий на GitHub
2. Запуши проект:
   ```bash
   git init
   git add .
   git commit -m "Gem Rush v1.0"
   git remote add origin https://github.com/ТВОЙ_ЮЗЕР/gem-rush.git
   git push -u origin main
   ```
3. Зайди на [vercel.com](https://vercel.com), подключи GitHub
4. Import → выбери gem-rush → Deploy
5. Каждый `git push` будет автоматически деплоить

### Вариант C — Netlify

```bash
npm run build
npx netlify deploy --dir=dist --prod
```

---

## 📱 PWA (установка как приложение)

Чтобы игроки могли «установить» игру на телефон:

1. Добавь `public/manifest.json`:
```json
{
  "name": "Gem Rush",
  "short_name": "GemRush",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#FFD54F",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

2. Добавь в `index.html` в `<head>`:
```html
<link rel="manifest" href="/manifest.json" />
```

---

## 📂 Структура проекта

```
gem-rush-project/
├── index.html          # Entry HTML с мета-тегами для мобильных
├── package.json        # Зависимости и скрипты
├── vite.config.js      # Конфиг Vite
├── vercel.json         # Конфиг деплоя Vercel
├── .gitignore
├── public/
│   └── favicon.svg     # Иконка вкладки
└── src/
    ├── main.jsx        # React entry point
    └── App.jsx         # ← ВСЯ ИГРА ЗДЕСЬ (один файл)
```

---

## 🎮 Что есть сейчас

- ✅ Canvas рендеринг 60fps с анимациями свапа и падения
- ✅ 6 уникальных казино-фруктов (вишни, апельсин, лимон, виноград, 7, колокол)
- ✅ Спецфрукты: 💣 Бомба (3×3), ⚡ Молния (крест), 🌈 Радуга (цвет)
- ✅ AI-боты с приоритизацией ходов
- ✅ Звуковой движок (Web Audio API)
- ✅ Тактильная обратная связь (вибрация)
- ✅ Прогресс-бар с milestone-маркерами (250/500/750)
- ✅ Подсказки при первом появлении спецфруктов
- ✅ Серия побед (streak)
- ✅ Кнопка реванша с пульсацией
- ✅ Мотивирующий экран проигрыша («не хватило X очков»)

---

## 🛣️ Roadmap к продакшену с реальными деньгами

### Фаза 1 — MVP бэкенд (2-3 недели)

```
Стек: Node.js + Socket.IO + PostgreSQL + Redis
```

Что нужно:
- [ ] WebSocket сервер для реального мультиплеера
- [ ] Серверная валидация ходов (анти-чит)
- [ ] Матчмейкинг по ставке
- [ ] Аккаунты (email/телефон + OAuth)
- [ ] Баланс кошелька (депозит/вывод)
- [ ] История игр и транзакций

### Фаза 2 — Платежи (1-2 недели)

Варианты:
- **Stripe** — для карт, международный
- **ЮKassa / Тинькофф** — для РФ
- **TON / USDT** — крипто (проще с лицензированием)

Что нужно:
- [ ] Депозит средств на баланс
- [ ] Вывод выигрыша
- [ ] Комиссия (рейк) — уже рассчитан в коде

### Фаза 3 — Юридическое (параллельно)

⚠️ **Важно**: игры на деньги = регулируемая деятельность

Варианты:
- **Skill-based gaming** лицензия (Мальта, Кюрасао, Гибралтар)
- **Турнирная модель** — во многих юрисдикциях не требует gambling-лицензии если это skill-based
- **Крипто** — через DAO/смарт-контракты

### Фаза 4 — Масштабирование

- [ ] Лиги и рейтинг (ELO)
- [ ] Battle Pass / дневные квесты
- [ ] Реферальная система
- [ ] Турниры с большими призовыми
- [ ] Аналитика и A/B тесты

---

## 🔧 Полезные команды Cursor

```bash
npm run dev        # Запуск в режиме разработки
npm run build      # Сборка для продакшена
npm run preview    # Превью собранной версии
vercel             # Деплой
vercel --prod      # Продакшен деплой
```

---

## 💡 Советы по работе с Cursor

1. **AI помощник** — выдели код в `App.jsx` и нажми `Cmd+K` чтобы попросить Cursor модифицировать
2. **Автокомплит** — Cursor подскажет React хуки и Canvas API
3. **Терминал** — `Ctrl+~` для быстрого доступа
4. **Git** — встроенный Source Control для коммитов

---

Сделано с 🍎 в Claude × Cursor
