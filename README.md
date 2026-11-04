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

## 🐳 Deploy (Oracle Cloud Ubuntu)

```bash
git clone https://github.com/osayl12/VeroItaliano.git
cd VeroItaliano
cp .env.example .env && nano .env      # set a strong ADMIN_PASSWORD and JWT_SECRET
docker compose up -d --build
```

The site runs on port 80 (set `WEB_PORT` to change it). Open the port in the Oracle VCN security list and in `ufw`. MongoDB data and uploaded images are kept in Docker volumes.

## 📝 Notes

- **Logo:** save the logo as `client/public/logo.png`. Until then, a text logo is shown.
- **Menu:** the starting menu is the shop's real menu and prices (from his ordering app), with his real product photos (`server/seed-images`). To load it again into an existing database:
  ```powershell
  cd server; npm run seed -- --reset
  ```
  ⚠️ `--reset` deletes the current menu and deals. Arabic names are translations that the owner should check.
- **Not available now:** in `/admin` → Menu, untick "available now" to grey an item out without hiding it. "Featured pizza" picks the pizza for the landing page.
- **Map:** in Google Maps, go to Share → Embed a map → Copy HTML, then paste it in Admin → Settings.
- **WhatsApp number** uses international format without `+`: `972509780855`.
- **Admin login** is limited to 10 attempts every 15 minutes. There is no sign-up page; the only account is the one created from `.env`.
