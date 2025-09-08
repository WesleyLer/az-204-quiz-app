# Azure App Service Deployment Guide

## Prerequisites

Before deploying to Azure App Service, ensure you have:

- [ ] Azure subscription with active billing
- [ ] Azure CLI installed locally (`az --version` to verify)
- [ ] Node.js 16+ installed locally
- [ ] Git installed and configured
- [ ] GitHub account for repository hosting
- [ ] Code pushed to GitHub repository

## 📋 GitHub Repository Setup

### Step 1: Create GitHub Repository

1. **Go to GitHub.com** and create a new repository named `az-204-quiz-app`
2. **Make it public** (or private if you prefer)
3. **Do not initialize** with README, .gitignore, or license (we have our own)

### Step 2: Push Your Local Code

```bash
# Navigate to your project directory
cd /path/to/az-204-quiz-app

# Initialize git (if not already done)
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: AZ-204 quiz app Phase 1 complete"

# Add GitHub remote (replace [YOUR-USERNAME])
git remote add origin https://github.com/[YOUR-USERNAME]/az-204-quiz-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify Repository Structure

Ensure your GitHub repository has this structure:
```
az-204-quiz-app/
├── backend/
│   ├── package.json
│   ├── server.js
│   └── questions.json
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
├── README.md
├── DEPLOYMENT.md
└── claude_az204_quiz_phase1_prompt.md
```

## Deployment Options

We'll cover deployment using both Azure CLI and Azure Portal:

### Methods Available:
1. **Azure CLI** - Command-line deployment (covered below)
2. **Azure Portal** - GUI-based deployment (also covered below)

### Architecture Options:
1. **Single App Service** - Both backend and frontend in one app
2. **Separate App Services** - Backend API and frontend as separate apps (recommended)

---

# 🖥️ Azure Portal Deployment Guide

## Option A: Single App Service via Azure Portal

### Step 1: Create Resource Group

1. **Navigate to Azure Portal** (https://portal.azure.com)
2. **Click "Resource groups"** in the left sidebar
3. **Click "+ Create"**
4. **Fill in details:**
   - Subscription: Select your subscription
   - Resource group: `rg-az204-quiz`
   - Region: `East US`
5. **Click "Review + create"** → **"Create"**

### Step 2: Create App Service Plan

1. **Search for "App Service plans"** in the top search bar
2. **Click "+ Create"**
3. **Configure basics:**
   - Subscription: Your subscription
   - Resource Group: `rg-az204-quiz`
   - Name: `asp-az204-quiz`
   - Operating System: `Linux`
   - Region: `East US`
   - Pricing Tier: `Basic B1` (click "Change size" if needed)
4. **Click "Review + create"** → **"Create"**

### Step 3: Create Web App

1. **Search for "App Services"** in the top search bar
2. **Click "+ Create"** → **"Web App"**
3. **Configure basics:**
   - Subscription: Your subscription
   - Resource Group: `rg-az204-quiz`
   - Name: `az204-quiz-app-[YOUR-UNIQUE-SUFFIX]` (must be globally unique)
   - Publish: `Code`
   - Runtime stack: `Node 18 LTS`
   - Operating System: `Linux`
   - Region: `East US`
   - App Service Plan: `asp-az204-quiz`
4. **Click "Review + create"** → **"Create"**

### Step 4: Configure Application Settings

1. **Navigate to your Web App** in the portal
2. **Go to "Configuration"** in the left sidebar
3. **Click "New application setting"** and add:
   - Name: `NODE_ENV`
   - Value: `production`
4. **Click "OK"** → **"Save"**
5. **Go to "General settings"** tab
6. **Set Startup Command:** `npm run deploy && npm start`
7. **Click "Save"**

### Step 5: Deploy Your Code

**Method 1: GitHub Deployment (Recommended)**

1. **Push your code to GitHub first:**
   ```bash
   # Navigate to your project root
   cd /path/to/az-204-quiz-app
   
   # Create the unified package.json (see CLI section)
   # Initialize git and commit
   git init
   git add .
   git commit -m "Initial commit for AZ-204 quiz app"
   
   # Add GitHub remote (replace with your repo)
   git remote add origin https://github.com/[YOUR-USERNAME]/az-204-quiz-app.git
   git branch -M main
   git push -u origin main
   ```

2. **In your Web App, go to "Deployment Center"**
3. **Select "GitHub"** → **"Authorize"** (sign in to GitHub)
4. **Select your repository:** `[YOUR-USERNAME]/az-204-quiz-app`
5. **Select branch:** `main`
6. **Build provider:** Choose "App Service Kudu build server"
7. **Click "Save"** - automatic deployment will begin

**Method 2: GitHub Actions (Advanced)**

1. **In Deployment Center, select "GitHub Actions"**
2. **Configure workflow:**
   - Repository: `[YOUR-USERNAME]/az-204-quiz-app`
   - Branch: `main`
   - Runtime: `Node.js`
3. **This creates `.github/workflows/main.yml` automatically**
4. **Commit and push** - CI/CD pipeline will run

**Method 3: Local Git Deployment**

1. **In your Web App, go to "Deployment Center"**
2. **Select "Local Git"** → **"Continue"**
3. **Select "App Service Kudu build server"** → **"Continue"** → **"Finish"**
4. **Note the Git URL** provided
5. **Go to "Deployment credentials"** and set up credentials

**In your local terminal:**
```bash
# After pushing to GitHub, also add Azure remote for direct deploy
git remote add azure [GIT-URL-FROM-PORTAL]
git push azure main
```

**Method 4: ZIP Deploy**

1. **Create production build locally:**
   ```bash
   # In project root, create unified package.json
   npm run install-backend
   npm run install-frontend  
   npm run build-frontend
   ```

2. **Create ZIP file** of entire project
3. **In Azure Portal, go to Web App → "Advanced Tools"** → **"Go"**
4. **Navigate to "Tools" → "ZIP Push Deploy"**
5. **Drag your ZIP file** to deploy

---

## Option B: Separate App Services via Azure Portal

### Backend API Deployment

#### Step 1: Create Backend Web App

1. **Follow Steps 1-2 from Option A** (Resource Group and App Service Plan already created)
2. **Create new Web App:**
   - Name: `az204-quiz-api-[YOUR-UNIQUE-SUFFIX]`
   - Runtime: `Node 18 LTS`
   - Use existing App Service Plan: `asp-az204-quiz`
3. **Configure Application Settings:**
   - `NODE_ENV` = `production`
   - Startup Command: `npm start`

#### Step 2: Deploy Backend Code

**Method 1: GitHub (Recommended)**
1. **In Backend Web App → "Deployment Center"**
2. **Select "GitHub"** → **Authorize**
3. **Select repository:** `[YOUR-USERNAME]/az-204-quiz-app`
4. **Branch:** `main`
5. **Root folder:** `/backend` (important for separate deployment)
6. **Build provider:** App Service Kudu build server
7. **Click "Save"**

**Method 2: GitHub Actions with Path Filtering**
```yaml
# .github/workflows/backend-deploy.yml (auto-generated, then modify)
on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]  # Only deploy when backend changes
```

**Method 3: Local Git**
1. **Create separate git repo for backend only:**
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Backend deployment"
   ```
2. **Follow Local Git setup in portal**
3. **Push to Azure remote**

#### Step 3: Configure CORS

1. **In Backend Web App → "CORS"**
2. **Add Allowed Origin:** `https://az204-quiz-web-[YOUR-UNIQUE-SUFFIX].azurewebsites.net`
3. **Uncheck "Enable Access-Control-Allow-Credentials"**
4. **Click "Save"**

### Frontend Deployment

#### Step 1: Create Frontend Web App

1. **Create another Web App:**
   - Name: `az204-quiz-web-[YOUR-UNIQUE-SUFFIX]`
   - Runtime: `Node 18 LTS`
   - Use existing plan: `asp-az204-quiz`

#### Step 2: Configure Environment Variables

1. **In Frontend Web App → "Configuration"**
2. **Add Application Setting:**
   - Name: `REACT_APP_API_URL`
   - Value: `https://az204-quiz-api-[YOUR-UNIQUE-SUFFIX].azurewebsites.net`

#### Step 3: Deploy Frontend

**Method 1: GitHub (Recommended)**
1. **In Frontend Web App → "Deployment Center"**
2. **Select "GitHub"** → **Authorize** 
3. **Select repository:** `[YOUR-USERNAME]/az-204-quiz-app`
4. **Branch:** `main`
5. **Root folder:** `/frontend`
6. **Build provider:** App Service Kudu build server (will run `npm run build`)
7. **Click "Save"**

**Method 2: GitHub Actions**
```yaml
# .github/workflows/frontend-deploy.yml
on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]
```

**Method 3: Manual Build and Deploy**
```bash
# In frontend directory
cd frontend
npm install
npm run build

# Create ZIP of build folder contents  
zip -r build.zip build/*
```
1. **Upload via Kudu** (Advanced Tools → ZIP Push Deploy)
2. **Or configure Deployment Center** with Local Git

---

## Option C: Azure Static Web Apps (Portal Method)

### Create Static Web App for Frontend

1. **Search "Static Web Apps"** in Azure Portal
2. **Click "+ Create"**
3. **Configure:**
   - Subscription: Your subscription
   - Resource Group: `rg-az204-quiz`
   - Name: `swa-az204-quiz-frontend`
   - Plan type: `Free`
   - Region: `East US 2`
   - **Deployment source: `GitHub`** (sign in to authorize)
   - **Organization:** Your GitHub username
   - **Repository:** `az-204-quiz-app`
   - **Branch:** `main`
   - Build Details:
     - **App location:** `/frontend`
     - **API location:** (leave empty - using separate backend)
     - **Output location:** `build`
4. **Click "Review + create"** → **"Create"**

### Configure Static Web App

1. **After deployment, go to "Configuration"**
2. **Add Environment Variable:**
   - Name: `REACT_APP_API_URL`
   - Value: `https://az204-quiz-api-[YOUR-UNIQUE-SUFFIX].azurewebsites.net`

### GitHub Actions Integration

**Automatic Setup:**
- Static Web Apps automatically creates `.github/workflows/azure-static-web-apps-[name].yml`
- Workflow triggers on push to `main` branch
- Builds and deploys frontend automatically
- No manual intervention needed after initial setup

---

# 🔧 Portal-Based Configuration and Management

## Application Insights Setup (Portal)

### Create Application Insights

1. **Search "Application Insights"** in portal
2. **Click "+ Create"**
3. **Configure:**
   - Resource Group: `rg-az204-quiz`
   - Name: `ai-az204-quiz`
   - Region: `East US`
   - Resource Mode: `Classic`
4. **Click "Review + create"** → **"Create"**

### Connect to Web App

1. **Go to your Web App → "Application Insights"**
2. **Click "Turn on Application Insights"**
3. **Select existing resource:** `ai-az204-quiz`
4. **Click "Apply"**

## Monitoring and Logs (Portal)

### View Application Logs

1. **Go to Web App → "Log stream"** (real-time logs)
2. **Or "Logs"** under Monitoring section for querying

### Configure Diagnostic Settings

1. **Go to Web App → "Diagnostic settings"**
2. **Add diagnostic setting:**
   - Name: `webapp-logs`
   - Select log categories needed
   - Send to Log Analytics workspace

## Scaling Configuration (Portal)

### Manual Scaling

1. **Go to Web App → "Scale up (App Service plan)"**
2. **Choose pricing tier** (B1, S1, P1v2, etc.)
3. **Click "Apply"**

### Auto Scaling

1. **Go to Web App → "Scale out (App Service plan)"**
2. **Enable autoscale**
3. **Configure rules:**
   - Scale out when CPU > 70%
   - Scale in when CPU < 30%
   - Min instances: 1, Max: 3

## Security Configuration (Portal)

### Enable HTTPS Only

1. **Go to Web App → "TLS/SSL settings"**
2. **Set "HTTPS Only" to "On"**

### Configure Authentication (Future Phase)

1. **Go to Web App → "Authentication"**
2. **Add identity provider** (Microsoft, Google, etc.)

---

# 🚀 Deployment Verification (Portal Methods)

## Health Checks

### Backend API Testing

1. **Go to Backend Web App → "Overview"**
2. **Click the URL** to open: `https://az204-quiz-api-[YOUR-SUFFIX].azurewebsites.net`
3. **Test endpoints:**
   - `/api/health`
   - `/api/questions/random`

### Frontend Testing

1. **Go to Frontend Web App → "Overview"**
2. **Click the URL** to test the React application
3. **Verify all functionality works end-to-end**

## Troubleshooting via Portal

### View Real-time Logs

1. **Web App → "Log stream"**
2. **Watch for errors during deployment and runtime**

### Check Deployment History

1. **Web App → "Deployment Center" → "Logs"**
2. **Review deployment status and error messages**

### Resource Metrics

1. **Web App → "Metrics"**
2. **Monitor CPU, Memory, Response Time, HTTP errors**

---

# 🧹 Resource Cleanup (Portal)

## Delete Resources

1. **Navigate to "Resource groups"**
2. **Select `rg-az204-quiz`**
3. **Click "Delete resource group"**
4. **Type the resource group name to confirm**
5. **Click "Delete"**

---

# 📋 Portal vs CLI Comparison

| Task | Portal Method | CLI Method |
|------|--------------|------------|
| **Learning Curve** | Visual, intuitive | Requires command knowledge |
| **Speed** | Slower for repetitive tasks | Faster for automation |
| **Automation** | Manual steps each time | Scriptable and repeatable |
| **Troubleshooting** | Rich visual information | Text-based output |
| **Best For** | Learning, one-time setups | Production, CI/CD, scripting |

## When to Use Each

**Use Azure Portal when:**
- Learning Azure services for the first time
- Need visual confirmation of configurations
- Troubleshooting complex issues
- Setting up monitoring and alerts

**Use Azure CLI when:**
- Automating deployments
- Setting up CI/CD pipelines
- Managing multiple environments
- Scripting repetitive tasks

---

# 💻 Azure CLI Deployment Guide

## Option 1: Single App Service Deployment

### Step 1: Prepare the Application

1. **Create a unified package.json in the root directory:**

```bash
cd /path/to/az-204-quiz-app
```

Create `package.json`:
```json
{
  "name": "az204-quiz-app",
  "version": "1.0.0",
  "scripts": {
    "install-backend": "cd backend && npm install",
    "install-frontend": "cd frontend && npm install",
    "build-frontend": "cd frontend && npm run build",
    "start": "cd backend && npm start",
    "deploy": "npm run install-backend && npm run install-frontend && npm run build-frontend"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

2. **Update backend to serve frontend static files:**

Add to `backend/server.js` (after existing routes):
```javascript
// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}
```

### Step 2: Azure CLI Login and Resource Creation

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-az204-quiz --location "East US"

# Create App Service plan
az appservice plan create \
  --name asp-az204-quiz \
  --resource-group rg-az204-quiz \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group rg-az204-quiz \
  --plan asp-az204-quiz \
  --name az204-quiz-app-[YOUR-UNIQUE-SUFFIX] \
  --runtime "NODE|18-lts"
```

### Step 3: Configure Environment Variables

```bash
# Set Node environment
az webapp config appsettings set \
  --resource-group rg-az204-quiz \
  --name az204-quiz-app-[YOUR-UNIQUE-SUFFIX] \
  --settings NODE_ENV=production

# Set startup command
az webapp config set \
  --resource-group rg-az204-quiz \
  --name az204-quiz-app-[YOUR-UNIQUE-SUFFIX] \
  --startup-file "npm run deploy && npm start"
```

### Step 4: Setup GitHub Deployment

```bash
# Configure GitHub deployment
az webapp deployment source config \
  --resource-group rg-az204-quiz \
  --name az204-quiz-app-[YOUR-UNIQUE-SUFFIX] \
  --repo-url https://github.com/[YOUR-USERNAME]/az-204-quiz-app \
  --branch main \
  --manual-integration
```

---

## Option 2: Separate App Services (Recommended)

### Backend API Deployment

#### Step 1: Create Backend App Service

```bash
# Create API App Service
az webapp create \
  --resource-group rg-az204-quiz \
  --plan asp-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX] \
  --runtime "NODE|18-lts"

# Configure API settings
az webapp config appsettings set \
  --resource-group rg-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX] \
  --settings NODE_ENV=production

# Set startup command
az webapp config set \
  --resource-group rg-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX] \
  --startup-file "npm start"
```

#### Step 2: Deploy Backend Code

**Option A: GitHub Integration (Recommended)**
```bash
# Configure GitHub deployment with subfolder
az webapp deployment source config \
  --resource-group rg-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX] \
  --repo-url https://github.com/[YOUR-USERNAME]/az-204-quiz-app \
  --branch main \
  --manual-integration

# Note: You'll need to configure the build to use /backend subfolder
# This can be done via the portal's Deployment Center for more control
```

**Option B: Local Git Deployment**
```bash
# Navigate to backend directory
cd backend

# Initialize git if not already done
git init
git add .
git commit -m "Initial backend commit"

# Deploy to Azure (using Local Git)
az webapp deployment source config-local-git \
  --resource-group rg-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX]

# Get deployment credentials
az webapp deployment list-publishing-credentials \
  --resource-group rg-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX]

# Add Azure remote and push
git remote add azure [DEPLOYMENT-URL-FROM-ABOVE]
git push azure main
```

#### Step 3: Enable CORS for Frontend

```bash
az webapp cors add \
  --resource-group rg-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX] \
  --allowed-origins "https://az204-quiz-web-[YOUR-UNIQUE-SUFFIX].azurewebsites.net"
```

### Frontend Deployment

#### Step 1: Create Frontend App Service

```bash
# Create frontend App Service (Static Web Apps recommended for production)
az webapp create \
  --resource-group rg-az204-quiz \
  --plan asp-az204-quiz \
  --name az204-quiz-web-[YOUR-UNIQUE-SUFFIX] \
  --runtime "NODE|18-lts"
```

#### Step 2: Configure Frontend Environment

Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://az204-quiz-api-[YOUR-UNIQUE-SUFFIX].azurewebsites.net
```

#### Step 3: Deploy Frontend

**Option A: GitHub Integration (Recommended)**
```bash
# Configure GitHub deployment for frontend
az webapp deployment source config \
  --resource-group rg-az204-quiz \
  --name az204-quiz-web-[YOUR-UNIQUE-SUFFIX] \
  --repo-url https://github.com/[YOUR-USERNAME]/az-204-quiz-app \
  --branch main \
  --manual-integration

# Note: Configure subfolder /frontend in portal's Deployment Center
```

**Option B: Manual Build and ZIP Deploy**
```bash
# Navigate to frontend directory
cd ../frontend

# Set production API URL
echo "REACT_APP_API_URL=https://az204-quiz-api-[YOUR-UNIQUE-SUFFIX].azurewebsites.net" > .env.production

# Build production bundle
npm install
npm run build

# Deploy using zip deployment
zip -r build.zip build/*

az webapp deployment source config-zip \
  --resource-group rg-az204-quiz \
  --name az204-quiz-web-[YOUR-UNIQUE-SUFFIX] \
  --src build.zip
```

---

## Alternative: Azure Static Web Apps (Recommended for Frontend)

For better performance and cost optimization, use Azure Static Web Apps for the frontend:

```bash
# Create Static Web App with GitHub integration
az staticwebapp create \
  --name az204-quiz-frontend \
  --resource-group rg-az204-quiz \
  --source https://github.com/[YOUR-USERNAME]/az-204-quiz-app \
  --branch main \
  --app-location "/frontend" \
  --output-location "build" \
  --location "East US 2"

# Configure environment variable
az staticwebapp appsettings set \
  --name az204-quiz-frontend \
  --setting-names REACT_APP_API_URL=https://az204-quiz-api-[YOUR-UNIQUE-SUFFIX].azurewebsites.net
```

**Benefits of Static Web Apps:**
- Automatic GitHub Actions integration
- Free tier with generous limits
- Built-in CDN and SSL
- Optimized for React/SPA applications

---

## Post-Deployment Verification

### Test API Endpoints

```bash
# Test backend health
curl https://az204-quiz-api-[YOUR-UNIQUE-SUFFIX].azurewebsites.net/api/health

# Test questions endpoint
curl https://az204-quiz-api-[YOUR-UNIQUE-SUFFIX].azurewebsites.net/api/questions

# Test random question
curl https://az204-quiz-api-[YOUR-UNIQUE-SUFFIX].azurewebsites.net/api/questions/random
```

### Test Frontend Application

Visit: `https://az204-quiz-web-[YOUR-UNIQUE-SUFFIX].azurewebsites.net`

Verify:
- [ ] Page loads without errors
- [ ] Questions display correctly
- [ ] Answer submission works
- [ ] Next question functionality works
- [ ] Statistics update properly

---

## Monitoring and Troubleshooting

### Enable Application Insights

```bash
# Create Application Insights resource
az extension add --name application-insights

az monitor app-insights component create \
  --app az204-quiz-insights \
  --location "East US" \
  --resource-group rg-az204-quiz \
  --kind web

# Get instrumentation key
az monitor app-insights component show \
  --app az204-quiz-insights \
  --resource-group rg-az204-quiz \
  --query instrumentationKey -o tsv

# Configure app to use Application Insights
az webapp config appsettings set \
  --resource-group rg-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX] \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=[INSTRUMENTATION-KEY]
```

### View Logs

```bash
# Stream backend logs
az webapp log tail \
  --resource-group rg-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX]

# Download logs
az webapp log download \
  --resource-group rg-az204-quiz \
  --name az204-quiz-api-[YOUR-UNIQUE-SUFFIX]
```

### Common Issues and Solutions

1. **CORS Errors**: Ensure frontend URL is added to backend CORS configuration
2. **Build Failures**: Check Node.js version compatibility and dependency versions
3. **API Not Found**: Verify API URL in frontend environment variables
4. **Slow Loading**: Consider using CDN or optimizing bundle size

---

## Cleanup Resources

When done testing:

```bash
# Delete the entire resource group
az group delete --name rg-az204-quiz --yes --no-wait
```

---

## Cost Optimization Tips

1. **Use B1 tier for development** (upgradable later)
2. **Consider Static Web Apps** for frontend (often free tier eligible)
3. **Set auto-stop rules** for development environments
4. **Monitor usage** with Azure Cost Management

## Next Steps for Phase 2

- Add Azure SQL Database integration
- Implement user authentication with Azure AD B2C
- Add Application Insights for advanced monitoring
- Implement CI/CD with Azure DevOps or GitHub Actions