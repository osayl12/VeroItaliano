# 🍕 Vero Italiano

Website for **Vero Italiano**, an Italian pizzeria in Maghar.
The site is in **Hebrew (default) and Arabic**, fully RTL. Orders come in by phone or WhatsApp.

## ✨ Features

**Public site**
- Hero section with live **Open now / Closed** status (Israel time)
- 🔥 **Deals** section: picture, price, old price, and a **live countdown**. A deal shows up at its start time and disappears when it ends.
- 🍕 Menu by category, with photos, ingredients, a **"How we make it"** text, prices and sale badges
- 💬 WhatsApp ordering: a button on every item, plus a cart that sends the whole order as one WhatsApp message
- 📞 Click-to-call, a floating WhatsApp button, opening hours table and Google Maps location
- 🌐 Hebrew / Arabic switch; the visitor's choice is remembered

**Owner admin panel** (`/admin`, owner only)
- 🔥 Deals: picture, title, description, price, start time, and a duration in **hours / days / until a date**; link deals to menu items
- 🍕 Menu: add, edit and delete items with photos, prices, sale price, and Hebrew + Arabic text
- 🕐 Opening hours per day, including closing after midnight, plus a **temporarily closed** switch with a message
- ⚙️ Settings: phone, WhatsApp number and greeting, address, Google Maps embed, Instagram, tagline, change password

## 🧱 Stack

React (Vite) · Node.js / Express · MongoDB (Mongoose) · JWT + bcrypt · Multer uploads · Docker Compose + Nginx

```
VeroItaliano/
├── client/            React app (public site + /admin)
│   ├── public/        put logo.png here
│   └── src/
├── server/            Express API
│   └── src/ (models, routes, middleware, seed.js)
├── docker-compose.yml
└── .env.example
```

## 🚀 Run locally (Windows / PowerShell)

1. **Create `.env`** in the project root:
   ```powershell
   copy .env.example .env
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Paste the printed value as `JWT_SECRET`, then set `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

2. **Start MongoDB** (with Docker Desktop):
   ```powershell
   docker run -d --name vi-mongo -p 27017:27017 -v vi-mongo-data:/data/db mongo:7
   ```

3. **Start the backend** (first terminal):
   ```powershell
   cd server
   npm install
   npm run dev
   ```
   The first time it runs, it creates the admin user and an example menu.

4. **Start the frontend** (second terminal):
   ```powershell
   cd client
   npm install
   npm run dev
   ```

5. Open http://localhost:5173 for the site and http://localhost:5173/admin for the admin panel.

## 🐳 Deploy (Oracle)

Production runs on a small Oracle Cloud Ubuntu server, behind the shared **Caddy** reverse proxy in `~/carconnect`. Caddy has a block for `veroitaliano.duckdns.org`, handles HTTPS, and forwards to the `client` container (nginx), which serves the site and proxies `/api` and `/uploads` to `server`.

The server never builds anything. Images are built on the PC and pulled from Docker Hub:

1. **On the PC** (from the repo folder), build and push both images. `..\vero-images.yml` lives outside the repo and only adds the `image:` names:
   ```powershell
   docker compose -f docker-compose.yml -f ..\vero-images.yml build
   docker compose -f docker-compose.yml -f ..\vero-images.yml push
   ```
2. **On the server**, pull and restart:
   ```bash
   cd ~/VeroItaliano && docker compose pull && docker compose up -d --no-build
   ```

Server-only settings stay on the server, never in the repo: `docker-compose.server.yml` (project name, image names, container name) and `.env` (`COMPOSE_FILE`, `WEB_PORT` bound to localhost, `TRUST_PROXY=2`, secrets). Uploaded images are kept in the `uploads` Docker volume; the data is in MongoDB Atlas.

### 🤖 CI/CD (GitHub Actions)

Every push to `main` (except docs-only changes) runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml): it builds both images for `linux/amd64`, pushes `:latest` and `:<commit>` to Docker Hub, then SSHes to the server, which runs the update command above. It can also be started by hand from the **Actions** tab.

**One-time setup**

1. **Deploy key** (on the PC, a new key used only for deploys):
   ```powershell
   ssh-keygen -t ed25519 -f $HOME\.ssh\vero_deploy -N '""' -C "github-deploy"
   ```
2. **On the server**, add the public key (`vero_deploy.pub`) to `~/.ssh/authorized_keys` as **one line**, locked to the update command:
   ```
   command="cd ~/VeroItaliano && docker compose pull -q && docker compose up -d --no-build && docker image prune -f",no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty ssh-ed25519 AAAA... github-deploy
   ```
   Even if the key leaks, it can only run that command.
3. **Docker Hub:** Account settings → Personal access tokens → new token with **Read & Write**.
4. **GitHub:** repo → Settings → Secrets and variables → Actions → add `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SSH_HOST`, `SSH_USER`, `SSH_KEY` (the whole private key file `vero_deploy`) and `SSH_KNOWN_HOSTS` (the output of `ssh-keyscan -t ed25519 <server>`).

**Rollback:** on the server, set the image tags in `docker-compose.server.yml` to an older `:<commit>` and run `docker compose up -d --no-build`.

## 📝 Notes

- **Logo:** save the logo as `client/public/logo.png`. Until then, a text logo is shown.
- **Menu:** the starting menu is the shop's real menu and prices (from his ordering app), with his real product photos (`server/seed-images`). To load it again into an existing database:
  ```powershell
  cd server; npm run seed -- --reset
  ```
  ⚠️ `--reset` deletes the current menu and deals. Arabic names are translations that the owner should check.
- **Not available now:** in `/admin` → Menu, untick "available now" to grey an item out without hiding it. "Featured pizza" picks the pizza for the landing page.
- **Map:** in Google Maps, go to Share → Embed a map → Copy HTML, then paste it in Admin → Settings.
- **WhatsApp number** uses international format without `+`.
- **Editing `.env`:** use VS Code (it saves UTF-8). Don't append to it with `>>` in Windows PowerShell 5: that writes UTF-16 and `docker compose` fails with `unexpected character "\x00"`.
- **Admin login** is limited to 10 attempts every 15 minutes. There is no sign-up page; the only account is the one created from `.env`.
