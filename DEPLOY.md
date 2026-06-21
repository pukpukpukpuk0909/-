# Развёртывание на своём сервере (без Vercel)

Приложение — Next.js. Собирается в `standalone`-режиме, поэтому для запуска
нужен только Node.js (или Docker). Vercel больше не используется.

## Вариант 1. Docker (рекомендуется)

```bash
# на сервере, в папке проекта
docker build -t colorblind-test .
docker run -d --name colorblind -p 80:3000 --restart unless-stopped colorblind-test
```

Сайт будет доступен на 80 порту сервера.

## Вариант 2. Напрямую через Node.js

```bash
npm ci
npm run build
node .next/standalone/server.js   # слушает порт 3000 (PORT=80 для 80-го)
```

Чтобы процесс жил после выхода — используйте pm2 или systemd:

```bash
npm i -g pm2
PORT=3000 pm2 start .next/standalone/server.js --name colorblind
pm2 save && pm2 startup
```

## Nginx (проксирование 80 → 3000) + домен

```nginx
server {
    listen 80;
    server_name colorblindness.online;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

HTTPS-сертификат: `sudo certbot --nginx -d colorblindness.online`.

## Домен

Перенаправьте A-запись домена `colorblindness.online` на IP вашего сервера
(в настройках DNS у регистратора домена), убрав указание на Vercel.
