# WeatherMemes

Развлекательное fullstack-приложение: показывает текущую погоду и подбирает мем по погодным условиям.

## Что реализовано

- Поиск погоды по городу и по геолокации (OpenWeatherMap)
- Категоризация погоды: `hot`, `cold`, `rain`, `snow`, `wind`, `cloudy`, `clear`
- Отображение карточки погоды (город/страна, иконка, температура, ветер, влажность, давление)
- Мемы по категории погоды
- Лайки/дизлайки с защитой от накрутки (один голос на мем от пользователя)
- Регистрация и авторизация пользователей
- Добавление мемов:
  - по URL
  - загрузкой изображения с устройства (конвертация в data URL)
- Share card: копирование изображения карточки (мем + погодная информация) в буфер обмена
- Локализация интерфейса: русский/английский, переключение с сохранением выбора

## Технологии

- Frontend: React 19, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- База данных: SQLite (`better-sqlite3`)
- Weather API: OpenWeatherMap

## Запуск

### Быстрый запуск из корня (рекомендуется)

```bash
npm install
npm run seed
npm run dev
```

Это поднимет одновременно backend и frontend.

### Полезные команды из корня

```bash
npm run dev           # backend + frontend вместе
npm run dev:backend   # только backend
npm run dev:frontend  # только frontend
npm run seed          # заполнить БД мемами
npm run build         # сборка backend и frontend
npm run start         # запуск backend из dist
```

### Ручной запуск по отдельности

#### 1) Backend

```bash
cd backend
npm install
```

Создайте `.env` на основе `.env.example` и задайте ключ:

```env
OWM_API_KEY=your_api_key
PORT=3001
```

Заполнить базу мемами и запустить сервер:

```bash
npm run seed
npm run dev
```

#### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение: `http://localhost:5173`  
API проксируется на backend: `http://localhost:3001`

## API (актуально)

- `GET /api/weather?city={city}&lang={ru|en}`
- `GET /api/weather?lat={lat}&lon={lon}&lang={ru|en}`
- `GET /api/memes?category={category}`
- `POST /api/memes` (Bearer token)
- `POST /api/memes/:id/vote` (Bearer token)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `POST /api/auth/logout` (Bearer token)

## Примечания перед сдачей

- Убедитесь, что установлен OpenWeatherMap API key
- Прогоните сборку и smoke-check:

```bash
npm run build
```

- Проверить сценарии:
  - регистрация/логин/автовход после перезагрузки
  - поиск погоды по городу и геолокации
  - переключение RU/EN
  - лайк/дизлайк без повторного голоса одним пользователем
  - добавление мема URL/файл и очистка формы
  - share card (копирование изображения в буфер)
