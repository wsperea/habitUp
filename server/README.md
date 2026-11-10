# HabitUp · Servidor (paso 1)

Requisitos: Node 18+ y MongoDB corriendo en tu computador.

    cd server
    npm install
    copy .env.example .env        (Windows)   |   cp .env.example .env
    npm run import:dry            valida tus JSON sin tocar la base de datos
    npm run import                importa a MongoDB (se puede repetir sin duplicar)
    npm start                     http://localhost:3000   (sitio + API)
    npm test                      pruebas automáticas (no necesitan MongoDB)

Comprobar: http://localhost:3000/api/health
