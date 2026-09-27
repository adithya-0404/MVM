# Multi-Vendor Marketplace (MVM) — MERN + ML Stack

A full-stack multi-vendor marketplace with AI/ML-powered features including product recommendations, sentiment analysis, fraud detection, dynamic pricing, and demand forecasting.

---

## Architecture

```
Browser (React + Redux)
       │  HTTPS
       ▼
Express Backend API (Node.js)   ←── MongoDB Atlas
       │  HTTP / internal
       ▼
FastAPI ML Service (Python)
```

| Service  | Technology | Port (local) |
|----------|-----------|-------------|
| Frontend | React + Vite + TailwindCSS | 5173 |
| Backend  | Express.js + Mongoose | 5000 |
| ML Service | FastAPI + scikit-learn + Prophet | 8000 |
| Database | MongoDB Atlas (cloud) | — |
| Images   | Cloudinary | — |
| Payments | PhonePe | — |

---

## ML Features

- **Sentiment Analysis** — VADER sentiment on product reviews
- **Product Recommendations** — TF-IDF content + collaborative filtering
- **ML Search Ranking** — TF-IDF ranked search results
- **Fraud Detection** — Isolation Forest anomaly detection
- **Dynamic Pricing** — Demand/supply-based price suggestions
- **Demand Forecasting** — Facebook Prophet 7-day forecast

---

## Running Locally

### Prerequisites
- Node.js v20+
- Python 3.12+
- npm 10+

### 1. Clone and install

```bash
# Backend
cd server
npm install
# Copy environment file and fill in your values
cp .env.example .env

# Frontend
cd ../client
npm install

# ML Service
cd ../ml-service
pip install -r requirements.txt
```

### 2. Start all services (Windows)

```bat
start-all.bat
```

Or individually:

```powershell
# ML Service (Terminal 1)
cd ml-service
uvicorn main:app --reload --port 8000

# Backend (Terminal 2)
cd server
npm run dev

# Frontend (Terminal 3)
cd client
npm run dev
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- ML Service: http://localhost:8000
- API Health: http://localhost:5000/api/health

---

## Running with Docker

```bash
# Copy and fill the environment file
cp server/.env.example server/.env
# Edit server/.env with your real credentials

# Build and start backend + ML service
docker-compose up --build

# Frontend (served separately — see Deployment section)
```

---

## Deployment

### Recommended Architecture

| Service | Recommended Platform |
|---------|---------------------|
| Frontend | Vercel / Netlify |
| Backend | Render / Railway / Fly.io |
| ML Service | Render (Docker) / Railway / Fly.io |
| Database | MongoDB Atlas |

### Environment Variables

**Backend (`server/.env`)**

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Set to `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret (≥64 chars) |
| `CLIENT_URL` | Comma-separated frontend URL(s) |
| `SERVER_URL` | Public URL of this backend |
| `ML_SERVICE_URL` | Internal/public URL of the ML service |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `PHONEPE_HOST` | PhonePe API host |
| `PHONEPE_MERCHANT_ID` | PhonePe merchant ID |
| `PHONEPE_SALT_KEY` | PhonePe salt key |
| `PHONEPE_SALT_INDEX` | PhonePe salt index (default: 1) |

**ML Service**

| Variable | Description |
|----------|-------------|
| `HOST` | Bind host (default: `0.0.0.0`) |
| `PORT` | Bind port (default: `8000`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

### Deploy on Render

**ML Service:**
1. Create a new Web Service → Connect repository
2. Root Directory: `ml-service`
3. Runtime: Docker
4. Set env vars: `ALLOWED_ORIGINS=https://your-backend.onrender.com,https://your-frontend.vercel.app`

**Backend:**
1. Create a new Web Service → Connect repository
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Set all env vars from the table above
6. Set `ML_SERVICE_URL` to the ML service Render URL

**Frontend:**
1. Deploy to Vercel — connect repository, set Root Directory to `client`
2. No env vars needed (Vite proxies via API relative URLs in dev; in prod all API calls go to same backend domain or set `VITE_API_URL` if splitting)

---

## Production Checklist

- [ ] All secrets rotated from dev values
- [ ] `NODE_ENV=production` set on backend
- [ ] `CLIENT_URL` set to real frontend domain
- [ ] `SERVER_URL` set to real backend domain  
- [ ] `ML_SERVICE_URL` points to deployed ML service (not localhost)
- [ ] `ALLOWED_ORIGINS` on ML service includes backend URL
- [ ] PhonePe credentials switched to production (not sandbox)
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Health checks verified: `/api/health` (backend), `/health` (ML)

---

## Admin Account

Create an admin user by registering normally, then manually update the `role` field to `"admin"` in MongoDB Atlas:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```
