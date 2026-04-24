# Smart Canteen Deployment

## Best choice

For this project, the simplest reliable setup is:

- Frontend: Vercel
- Backend: Render

Why:

- Vercel is very smooth for Vite React apps.
- Render supports FastAPI well.
- This split is easier than trying to force both parts onto one platform.

## Before deploying

The frontend now reads the backend URL from an environment variable:

- `VITE_API_BASE`

Example:

```env
VITE_API_BASE=https://your-backend-url/api
```

The backend also needs:

- `GROQ_API_KEY`

## Deploy backend on Render

1. Push this repo to GitHub.
2. Go to Render and create a new `Web Service`.
3. Connect your GitHub repo.
4. Use these settings:

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000`

5. Add environment variable:

- `GROQ_API_KEY=your_key_here`

6. Deploy and copy the Render backend URL.

Example backend URL:

- `https://smartcanteen-api.onrender.com`

## Deploy frontend on Vercel

1. Go to Vercel and import the same GitHub repo.
2. Set the root directory to `frontend`.
3. Add environment variable:

- `VITE_API_BASE=https://your-render-backend-url/api`

4. Deploy.

## Important note

The backend currently uses local in-memory data for orders and local Chroma persistence.
On cloud hosting, some of that data may reset when the service restarts unless you later move it to a database or persistent disk.

For a hackathon demo, this setup is usually fine.

## One-platform alternative

If you want fewer dashboards, Railway is also a good option for the backend and sometimes for the whole app, but Vercel + Render is usually easier for this repo.
