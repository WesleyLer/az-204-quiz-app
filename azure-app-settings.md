# Azure App Service Configuration

## Required Application Settings for Backend App Service

In your backend Azure App Service, add these application settings:

```bash
# Required settings
NODE_ENV=production
WEBSITE_NODE_DEFAULT_VERSION=~18
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Performance settings
WEBSITE_DYNAMIC_CACHE=0
WEBSITE_LOCAL_CACHE_OPTION=Never
```

## Required Application Settings for Frontend App Service

In your frontend Azure App Service, add these application settings:

```bash
# Required settings  
NODE_ENV=production
WEBSITE_NODE_DEFAULT_VERSION=~18
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
SCM_DO_BUILD_DURING_DEPLOYMENT=true

# React environment variable (replace with your actual backend URL)
REACT_APP_API_URL=https://your-backend-app.azurewebsites.net

# Performance settings
WEBSITE_DYNAMIC_CACHE=0
WEBSITE_LOCAL_CACHE_OPTION=Never
```

## Deployment Configuration

### Option 1: Deploy from GitHub (Recommended)

1. **Backend App Service:**
   - Source: GitHub
   - Repository: your-repo
   - Branch: main
   - **IMPORTANT**: Set build path to `/backend` in Deployment Center settings

2. **Frontend App Service:**
   - Source: GitHub  
   - Repository: your-repo
   - Branch: main
   - **IMPORTANT**: Set build path to `/frontend` in Deployment Center settings

### Option 2: Deploy using Local Git

If using local git deployment, you'll need to push each folder separately:

```bash
# For backend
cd backend
git init
git add .
git commit -m "Backend deployment"
git remote add azure [backend-git-url]
git push azure main

# For frontend  
cd ../frontend
git init
git add .
git commit -m "Frontend deployment"  
git remote add azure [frontend-git-url]
git push azure main
```

## Troubleshooting

### If you still get EACCES errors:
1. Make sure all deployment files are committed to your repo
2. In Azure Portal, go to App Service → Configuration → General Settings
3. Set **Startup Command** to: `node server.js` (for backend) or leave empty (for frontend)

### If you still get strip-ansi 404 errors:
1. Clear npm cache: Add application setting `NPM_CONFIG_CACHE=/tmp/.npm`
2. Force npm to use specific registry: `NPM_CONFIG_REGISTRY=https://registry.npmjs.org/`
3. Disable audit: `NPM_CONFIG_AUDIT=false`

### If deployment fails:
1. Check deployment logs in Portal → Deployment Center → Logs  
2. Check application logs in Portal → Log Stream
3. Verify your repo structure matches the paths in .deployment files