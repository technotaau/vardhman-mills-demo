# 🚂 Railway Deployment Guide - Vardhman Mills

## Prerequisites
- GitHub repository (already done ✅)
- Railway account (create at https://railway.app)
- Railway CLI installed on your local machine

## Step-by-Step Deployment

### 1️⃣ Install Railway CLI (On Your Local Machine)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Verify installation
railway --version
```

### 2️⃣ Login to Railway

```bash
# Login (opens browser for authentication)
railway login

# Link your project to Railway
railway init
```

Follow the prompts:
- Choose "Empty Project" or "Create new project"
- Name it: `vardhman-mills-demo`

### 3️⃣ Set Up MongoDB Database

**Option A: Railway MongoDB (Recommended)**
```bash
# Add MongoDB plugin to your project
railway add mongodb

# Get the connection string
railway variables
# Look for MONGO_URL or create one
```

**Option B: MongoDB Atlas (Free Tier)**
1. Go to https://cloud.mongodb.com
2. Create free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/vardhman-mills`

### 4️⃣ Deploy Backend Service

```bash
# Navigate to backend directory
cd backend

# Create Railway service for backend
railway up

# This will:
# - Detect Node.js app
# - Install dependencies
# - Build the app
# - Deploy it
```

**Set Backend Environment Variables:**
```bash
# Set variables one by one
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set MONGODB_URI=<your-mongodb-connection-string>
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set JWT_EXPIRES_IN=90d
railway variables set JWT_COOKIE_EXPIRES_IN=90

# Optional (for full functionality)
railway variables set CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
railway variables set CLOUDINARY_API_KEY=<your-cloudinary-key>
railway variables set CLOUDINARY_API_SECRET=<your-cloudinary-secret>
railway variables set RAZORPAY_KEY_ID=<your-razorpay-key>
railway variables set RAZORPAY_KEY_SECRET=<your-razorpay-secret>
```

**Get Backend URL:**
```bash
railway domain
# Copy this URL - you'll need it for frontend
# Example: backend-production-xxxx.up.railway.app
```

### 5️⃣ Deploy Frontend Service

```bash
# Navigate to frontend directory
cd ../frontend

# Create Railway service for frontend
railway up
```

**Set Frontend Environment Variables:**
```bash
# Replace <backend-url> with your actual backend URL from step 4
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_APP_NAME="Vardhman Mills"
railway variables set NEXT_PUBLIC_APP_URL=https://<frontend-url>.up.railway.app
railway variables set NEXT_PUBLIC_API_URL=https://<backend-url>.up.railway.app/api/v1
railway variables set NEXTAUTH_URL=https://<frontend-url>.up.railway.app
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Optional (for full functionality)
railway variables set NEXT_PUBLIC_RAZORPAY_KEY_ID=<your-razorpay-key>
railway variables set GOOGLE_CLIENT_ID=<your-google-client-id>
railway variables set GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

**Generate Custom Domain (Optional):**
```bash
railway domain
# This gives you a Railway subdomain
# Or add your custom domain
```

### 6️⃣ Update Backend CORS Settings

After getting frontend URL, update backend:
```bash
cd ../backend
railway variables set FRONTEND_URL=https://<frontend-url>.up.railway.app
```

### 7️⃣ Verify Deployment

```bash
# Check backend logs
cd backend
railway logs

# Check frontend logs
cd ../frontend
railway logs

# Open your app
railway open
```

## 🔄 Alternative: Deploy via Railway Web UI

If CLI doesn't work, use Railway dashboard:

1. **Go to**: https://railway.app/new
2. **Click**: "Deploy from GitHub repo"
3. **Select**: Your `vardhman-mills-demo` repository
4. **Create 3 services**:
   - MongoDB (from template)
   - Backend (root directory: `/backend`)
   - Frontend (root directory: `/frontend`)
5. **Set environment variables** in each service's "Variables" tab
6. **Deploy**: Railway auto-deploys on each commit

## 📝 Environment Variables Quick Reference

### Backend Required:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<mongodb-connection-string>
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=90d
FRONTEND_URL=<your-frontend-url>
```

### Frontend Required:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=<your-backend-url>/api/v1
NEXTAUTH_URL=<your-frontend-url>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

## 🎯 After Deployment

Your app will be live at:
- **Frontend**: `https://<project-name>-frontend.up.railway.app`
- **Backend**: `https://<project-name>-backend.up.railway.app`
- **API Docs**: `https://<project-name>-backend.up.railway.app/api/v1/docs`

## 🔧 Troubleshooting

### Build Fails
```bash
railway logs --build
```

### App Crashes
```bash
railway logs
```

### Environment Variable Issues
```bash
railway variables
```

### Redeploy
```bash
railway up --detach
```

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month (enough for demos)
- **Usage**: ~$0.01/hour per service when active
- **Sleep**: Services sleep after 30 min inactivity (free tier)

## 🚀 One-Command Deploy Script

Create this script for future deployments:

```bash
#!/bin/bash
# deploy.sh

echo "🚂 Deploying Backend..."
cd backend && railway up --detach

echo "🎨 Deploying Frontend..."
cd ../frontend && railway up --detach

echo "✅ Deployment complete!"
echo "Check status: railway status"
```

Run: `chmod +x deploy.sh && ./deploy.sh`

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

## ✅ Deployment Checklist

- [ ] Railway CLI installed
- [ ] Railway account created
- [ ] MongoDB database set up
- [ ] Backend deployed with env vars
- [ ] Frontend deployed with env vars
- [ ] CORS configured
- [ ] Custom domain (optional)
- [ ] App tested and working

---

**Ready to deploy?** Run the commands above from your local machine!
