<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d7f24c44-dbae-41f0-9a24-95ef16fea5db

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` or `.env` to your Gemini API key
3. Run the app:
   `npm run dev`

The dev command starts an Express server on port `3000`, mounts the Vite app in middleware mode, and exposes the AI backend at `/api/ai/*`.

## Deploy Without Google Cloud Billing

Firebase Hosting is static, so it cannot run the Express API without a billed backend such as Cloud Run or Firebase Functions.
For a no-card deployment, set a browser-exposed Gemini key before building:

```sh
VITE_GEMINI_API_KEY=your_gemini_api_key npm run build
firebase deploy --only hosting
```

You can also put `VITE_GEMINI_API_KEY=...` in `.env` and then run `npm run build`.

Important: `VITE_GEMINI_API_KEY` is public in the deployed JavaScript bundle. Use this only for personal demos or low-risk apps, restrict the key as much as Google AI Studio allows, and monitor usage.

## Deploy to Firebase Hosting + Cloud Run

If you later add billing, deploy the API to Cloud Run:

```sh
gcloud run deploy tradenexus-ai-sales-agent \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="$GEMINI_API_KEY"
```

Then build and deploy Hosting:

```sh
npm run build
firebase deploy --only hosting
```

After deployment, `https://<your-site>.web.app/api/health` should return `{"ok":true}`.
