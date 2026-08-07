# Полное руководство по сборке Minecraft лаунчера

## Содержание

1. [Обзор проекта](#обзор-проекта)
2. [Требования к системе](#требования-к-системе)
3. [Сборка C-версии лаунчера](#сборка-c-версии-лаунчера)
4. [Сборка GUI-версии (Electron + React)](#сборка-gui-версии-electron--react)
5. [Настройка CurseForge API](#настройка-curseforge-api)
6. [Устранение проблем](#устранение-проблем)

---

## Обзор проекта

Tiny MC Launcher - это кроссплатформенный лаунчер Minecraft с двумя версиями:

### C-версия (консольная)
- Легковесная, написана на чистом C
- Работает на Windows, Linux, macOS, BSD
- Минимальные зависимости
- Полное управление через командную строку

### GUI-версия (графическая)
- Современный интерфейс на Electron + React + Redux Toolkit
- Material-UI компоненты с анимациями
- Поддержка темной/светлой темы
- Интеграция с CurseForge API
- Управление модами и профилями
- Визуализация прогресса загрузки

---

## Требования к системе

### Для C-версии:
- **Компилятор**: GCC или Clang
- **Зависимости**:
  - Windows: WinHTTP API (встроена в систему)
  - Linux/macOS/BSD: libcurl, zlib

### Для GUI-версии:
- **Node.js**: версии 18.x или выше
- **npm**: версии 9.x или выше
- **Оперативная память**: минимум 2 ГБ для сборки
- **Место на диске**: минимум 500 МБ

---

## Сборка C-версии лаунчера

### Windows / ReactOS

```bash
# 32-битная сборка
gcc -m32 tiny_mc.c cJSON.c -o mc.exe -lkernel32 -luser32 -ladvapi32 -lwinhttp -static -mconsole

# 64-битная сборка
gcc tiny_mc.c cJSON.c -o mc.exe -lkernel32 -luser32 -ladvapi32 -lwinhttp -static
```

### Linux

```bash
gcc tiny_mc.c cJSON.c -o mc -lcurl -lz
```

### macOS

```bash
clang tiny_mc.c cJSON.c -o mc -lcurl -lz
```

### BSD

```bash
clang tiny_mc.c cJSON.c -o mc -lcurl -lz
```

### Быстрый запуск

```bash
# Показать помощь
./mc -help

# Быстрый старт с настройками по умолчанию
./mc -s

# Интерактивный запуск
./mc -start
```

---

## Сборка GUI-версии (Electron + React)

### Шаг 1: Установка зависимостей

Перейдите в директорию GUI и установите все зависимости:

```bash
cd gui
npm run install-deps
```

Или вручную:

```bash
cd gui
npm install
```

### Шаг 2: Режим разработки

Для запуска в режиме разработки с горячей перезагрузкой:

```bash
npm run electron:dev
```

Эта команда:
1. Запускает Vite dev сервер на порту 5173
2. Автоматически открывает Electron приложение
3. Включает DevTools для отладки
4. Обновляет интерфейс при изменении кода

### Шаг 3: Продакшн сборка

#### Сборка для Windows

```bash
npm run electron:build
```

После сборки исполняемые файлы будут находиться в:
- `gui/dist/win-unpacked/` - портативная версия
- `gui/dist/Tiny MC Launcher Setup X.X.X.exe` - NSIS установщик

#### Настройки сборки (electron-builder)

В файле `package.json` настроены следующие параметры:

```json
{
  "build": {
    "appId": "com.tinymclauncher.app",
    "productName": "Tiny MC Launcher",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "main.js",
      "preload.js"
    ],
    "win": {
      "target": ["portable", "nsis"],
      "icon": "public/icon.ico"
    },
    "portable": {
      "artifactName": "${productName} Portable ${version}.exe"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "artifactName": "${productName} Setup ${version}.exe"
    }
  }
}
```

### Шаг 4: Доступные npm скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск только Vite dev сервера |
| `npm run build` | Сборка React приложения в production режиме |
| `npm run electron:dev` | Запуск Electron + Vite в режиме разработки |
| `npm run electron:build` | Полная сборка приложения для Windows |
| `npm run install-deps` | Установка всех зависимостей |

---

## Настройка CurseForge API

### Получение API ключа

1. Перейдите на https://console.curseforge.com/
2. Зарегистрируйтесь или войдите в аккаунт
3. Создайте новый API key
4. Скопируйте ключ

### Настройка в лаунчере

1. Откройте лаунчер
2. Перейдите в **Настройки** (иконка шестеренки)
3. Найдите секцию **"CurseForge API"**
4. Вставьте ваш API ключ в поле ввода
5. Нажмите **"Проверить"** для валидации
6. Сохраните настройки

### Статусы API ключа

- ✅ **Зеленый** - ключ действителен
- ❌ **Красный** - неверный ключ
- ⚠️ **Желтый** - превышен лимит запросов
- 🔴 **Серый** - ошибка подключения

---

## Структура проекта GUI

```
gui/
├── main.js                 # Electron main process
├── preload.js              # Bridge между main и renderer
├── package.json            # Зависимости и скрипты
├── vite.config.js          # Конфигурация Vite
├── renderer/
│   └── index.html          # HTML шаблон
├── public/
│   └── icon.ico            # Иконка приложения
└── src/
    ├── main.jsx            # Точка входа React
    ├── App.jsx             # Главный компонент
    ├── store.js            # Redux store конфигурация
    ├── launcherSlice.js    # Redux slice для лаунчера
    ├── uiSlice.js          # Redux slice для UI
    ├── statsSlice.js       # Redux slice для статистики
    ├── modsSlice.js        # Redux slice для модов
    ├── components/
    │   ├── Mods.jsx        # Компонент управления модами
    │   └── ...
    ├── services/
    │   └── curseforgeApi.js # CurseForge API клиент
    └── dialogs/
        ├── AccountsDialog.jsx
        ├── SettingsDialog.jsx
        └── ModsDialog.jsx
```

---

## Устранение проблем

### Ошибка: "No space left on device"

```bash
# Очистить node_modules
rm -rf gui/node_modules

# Очистить кэш npm
npm cache clean --force

# Переустановить зависимости
cd gui
npm install
```

### Ошибка: "Cannot find module"

```bash
# Удалить node_modules и package-lock.json
rm -rf gui/node_modules gui/package-lock.json

# Переустановить
cd gui
npm install
```

### Ошибка: "Rendered more hooks than during the previous render"

Убедитесь, что все хуки в React компонентах объявлены **до** любых условных операторов `return`.

### Ошибка: "IPC handler already registered"

Проверьте, что в `main.js` нет дублирующихся обработчиков для одного канала IPC.

### Ошибка: "404 Not Found" при загрузке интерфейса

Убедитесь, что пути в `main.js` правильные:
- Development: `http://localhost:5173/renderer/index.html`
- Production: `path.join(__dirname, 'dist', 'renderer', 'index.html')`

### Ошибка: "Invalid API key" от CurseForge

1. Проверьте правильность ключа
2. Убедитесь, что ключ активирован на https://console.curseforge.com/
3. Проверьте лимиты запросов (200 запросов в минуту)

### Приложение не запускается после сборки

```bash
# Очистить dist директорию
rm -rf gui/dist

# Собрать заново
cd gui
npm run electron:build
```

---

## Дополнительные ресурсы

- [Документация Electron](https://www.electronjs.org/docs)
- [Документация React](https://react.dev/)
- [Документация Redux Toolkit](https://redux-toolkit.js.org/)
- [Документация Material-UI](https://mui.com/)
- [Документация CurseForge API](https://docs.curseforge.com/)

---

## Лицензия

MIT License  
Copyright (c) 2026 qwq672
