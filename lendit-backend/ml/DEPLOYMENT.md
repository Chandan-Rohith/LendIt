# LendIt ML Service - Separate Deployment Guide

This document explains how to deploy the LendIt ML service as a **separate Render service** alongside the main backend.

## Architecture

```
┌─────────────────────────────────────┐
│   Render Frontend (React)            │
│   VITE_API_URL=backend.onrender.com  │
└────────────────────┬────────────────┘
                     │ API calls
                     ▼
┌─────────────────────────────────────┐
│   Render Backend (Spring Boot)       │
│   ML_INFERENCE_ENDPOINT=ml.onrender. │
└────────────────────┬────────────────┘
                     │ Risk score requests
                     ▼
┌─────────────────────────────────────┐
│   Render ML Service (Flask)          │
│   POST /api/ml/risk-score            │
└─────────────────────────────────────┘
```

## Step 1: Prepare ML Service Repository

The ML service is in `lendit-backend/ml/` and includes:
- `app.py` - Flask API wrapper (handles HTTP requests)
- `requirements.txt` - Python dependencies (Flask, gunicorn, ML libs)
- `Procfile` - Render deployment configuration
- `infer.py` - Existing inference logic (unchanged)
- `config.yaml` - Shared feature configuration

**Files automatically created/updated:**
- ✅ `app.py` - Flask HTTP wrapper
- ✅ `requirements.txt` - Updated with Flask, flask-cors, gunicorn
- ✅ `Procfile` - Gunicorn startup configuration

## Step 2: Create Render Service for ML

1. **Go to Render dashboard** → Create New → Web Service
2. **Connect your GitHub repo** (same repo with `lendit-backend/`)
3. **Configure:**
   - **Name:** `lendit-ml` (or similar)
   - **Root Directory:** `lendit-backend/ml` (IMPORTANT!)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** Use default (Render auto-reads Procfile)
   - **Plan:** Free or Starter (depends on usage)

4. **Environment Variables:**
   ```
   PORT=5000
   LENDIT_ML_DB_URL=<same AIVEN_MySQL URL as backend>
   ```

5. **Deploy** and note the URL: `https://lendit-ml-abc123.onrender.com`

## Step 3: Update Backend Service

On your **Render Backend Service**, add/update:

```
ML_INFERENCE_ENABLED=true
ML_INFERENCE_ENDPOINT=https://lendit-ml-abc123.onrender.com
```

Replace `lendit-ml-abc123.onrender.com` with your actual ML service URL.

## Step 4: How It Works

### Risk Score Request Flow

1. **Backend receives booking request**
   ```
   POST /api/bookings
   ```

2. **RiskScoreService.calculateRiskScore()** is triggered
   ```java
   // Tries in order:
   // 1. HTTP call to ML_INFERENCE_ENDPOINT
   // 2. Local Python subprocess (if endpoint fails)
   // 3. Rule-based computation (if ML unavailable)
   ```

3. **HTTP Request to ML Service:**
   ```
   POST https://lendit-ml-abc123.onrender.com/api/ml/risk-score
   Content-Type: application/json

   {
     "avg_rating": 4.5,
     "review_count": 10,
     "avg_damage": 0.3,
     "avg_experience": 2.1
   }
   ```

4. **ML Service Response:**
   ```json
   {
     "output": {
       "risk_score": 35.42,
       "risk_classification": "LOW"
     }
   }
   ```

5. **Backend stores result** and returns booking confirmation

### Fallback Behavior

If ML service is down:
- Backend automatically falls back to rule-based scoring
- No failures, graceful degradation ✅
- Risk score still calculated and stored

## Step 5: Health Checks

Test the ML service health:

```bash
# From your local machine
curl https://lendit-ml-abc123.onrender.com/health

# Expected response
{"status": "ok", "service": "lendit-ml"}
```

## Step 6: Monitoring

Check Render logs for:
- **Status 200 responses** → ML working fine
- **Errors in logs** → Fix and redeploy
- **Cold start delays** → Normal for free tier, improves over time

## Troubleshooting

### ML endpoint returning 500 errors
```
Check Render ML service logs for:
- Missing Python dependencies (pip install -r requirements.txt?)
- malformed infer.py imports
- Missing config.yaml

Fix in ml/ and redeploy
```

### Backend not finding ML service
```
1. Verify ML_INFERENCE_ENDPOINT is set correctly on backend service
2. Check ML service is running (curl /health)
3. Verify network connectivity (both services in same region?)
4. Check backend logs for RestClientException
```

### Feature mismatches between ML and infer.py
```
Keep config.yaml in sync with feature extraction
Both Python and Java read same feature order:
- avg_rating
- review_count
- avg_damage
- avg_experience
```

## Optional: Run ML Locally for Testing

```bash
cd lendit-backend/ml
pip install -r requirements.txt
python app.py
```

Then test:
```bash
curl -X POST http://localhost:5000/api/ml/risk-score \
  -H "Content-Type: application/json" \
  -d '{"avg_rating": 4.5, "review_count": 10, "avg_damage": 0.3, "avg_experience": 2.1}'
```

## Rollback Strategy

If ML service has issues:

1. **Keep `ML_INFERENCE_ENABLED=true`** (to use fallback)
   - Backend will try ML first
   - Falls back to Python subprocess (if available)
   - Falls back to rule-based scoring

2. **Or temporarily disable:**
   ```
   ML_INFERENCE_ENABLED=false
   ```
   - Uses rule-based scoring only
   - No ML calls, no failures

3. **Meanwhile, fix ML service** and redeploy

## Cost Estimate (Render)

| Component | Plan | Cost/month |
|-----------|------|-----------|
| Backend | Standard (2GB RAM) | ~$7 |
| ML Service | Starter (512MB RAM) | ~$7 |
| **Total** | | **~$14** |

Free tier ML service might spin down after 15 mins of inactivity → slower first request after idle time.

---

## Summary

✅ ML is now deployed as separate HTTP service
✅ Backend gracefully falls back if ML is down
✅ Scalable and independent from main backend
✅ Easy to update/fix ML without redeploying backend

**Next Steps:**
1. Create ML service on Render (point to `lendit-backend/ml/`)
2. Set `ML_INFERENCE_ENDPOINT` on backend service
3. Test health endpoint
4. Monitor logs after first deployment
