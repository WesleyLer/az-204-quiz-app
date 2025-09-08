# Azure SQL Database Integration with App Service

This guide shows how to connect your AZ-204 Quiz App Service to Azure SQL Database, replacing the JSON file with a scalable database solution.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Connection Setup](#database-connection-setup)
3. [Backend Code Migration](#backend-code-migration)
4. [App Service Configuration](#app-service-configuration)
5. [Connection String Security](#connection-string-security)
6. [Testing and Verification](#testing-and-verification)
7. [Production Deployment](#production-deployment)
8. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)

---

## Prerequisites

- [ ] Azure SQL Database created and populated (see AZURE_SQL_IMPORT.md)
- [ ] App Service deployed (see DEPLOYMENT.md)
- [ ] Node.js backend with Express server
- [ ] Database firewall configured to allow App Service access

---

## Database Connection Setup

### Step 1: Install Required Packages

Add SQL Server drivers to your backend:

```bash
cd backend
npm install mssql dotenv
npm install --save-dev @types/mssql  # If using TypeScript
```

### Step 2: Update Package.json

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mssql": "^10.0.1",
    "dotenv": "^16.3.1"
  }
}
```

### Step 3: Create Database Configuration

Create `backend/config/database.js`:

```javascript
const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: 1433,
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false,
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

const connectDB = async () => {
    try {
        if (!pool) {
            pool = await sql.connect(dbConfig);
            console.log('Connected to Azure SQL Database');
        }
        return pool;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB first.');
    }
    return pool;
};

module.exports = {
    connectDB,
    getPool,
    sql
};
```

### Step 4: Create Environment Variables

Create `backend/.env`:

```env
# Azure SQL Database Configuration
DB_SERVER=az204-quiz-server.database.windows.net
DB_NAME=az204-quiz-db
DB_USER=sqladmin
DB_PASSWORD=YourSecurePassword123!

# App Configuration
PORT=3001
NODE_ENV=development
```

---

## Backend Code Migration

### Step 1: Create Data Access Layer

Create `backend/data/questionRepository.js`:

```javascript
const { getPool, sql } = require('../config/database');

class QuestionRepository {
    
    // Get all questions
    async getAllQuestions() {
        try {
            const pool = getPool();
            const result = await pool.request().query(`
                SELECT Id as id, Topic as topic, SkillArea as skillArea, 
                       Question as question, Options as options, Answer as answer, 
                       Explanation as explanation
                FROM Questions
                ORDER BY Id
            `);
            
            // Parse JSON options for each question
            return result.recordset.map(question => ({
                ...question,
                options: JSON.parse(question.options)
            }));
        } catch (error) {
            console.error('Error fetching all questions:', error);
            throw error;
        }
    }

    // Get random question
    async getRandomQuestion() {
        try {
            const pool = getPool();
            const result = await pool.request().query(`
                SELECT TOP 1 Id as id, Topic as topic, SkillArea as skillArea,
                       Question as question, Options as options, Answer as answer,
                       Explanation as explanation
                FROM Questions
                ORDER BY NEWID()
            `);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            const question = result.recordset[0];
            return {
                ...question,
                options: JSON.parse(question.options)
            };
        } catch (error) {
            console.error('Error fetching random question:', error);
            throw error;
        }
    }

    // Get questions by topic
    async getQuestionsByTopic(topic) {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('topic', sql.NVarChar, topic)
                .query(`
                    SELECT Id as id, Topic as topic, SkillArea as skillArea,
                           Question as question, Options as options, Answer as answer,
                           Explanation as explanation
                    FROM Questions
                    WHERE Topic = @topic
                    ORDER BY Id
                `);
            
            return result.recordset.map(question => ({
                ...question,
                options: JSON.parse(question.options)
            }));
        } catch (error) {
            console.error('Error fetching questions by topic:', error);
            throw error;
        }
    }

    // Get question by ID
    async getQuestionById(id) {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT Id as id, Topic as topic, SkillArea as skillArea,
                           Question as question, Options as options, Answer as answer,
                           Explanation as explanation
                    FROM Questions
                    WHERE Id = @id
                `);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            const question = result.recordset[0];
            return {
                ...question,
                options: JSON.parse(question.options)
            };
        } catch (error) {
            console.error('Error fetching question by ID:', error);
            throw error;
        }
    }

    // Get total question count
    async getQuestionCount() {
        try {
            const pool = getPool();
            const result = await pool.request().query(`
                SELECT COUNT(*) as count FROM Questions
            `);
            
            return result.recordset[0].count;
        } catch (error) {
            console.error('Error fetching question count:', error);
            throw error;
        }
    }

    // Get questions count by topic
    async getTopicStats() {
        try {
            const pool = getPool();
            const result = await pool.request().query(`
                SELECT Topic as topic, COUNT(*) as count
                FROM Questions
                GROUP BY Topic
                ORDER BY Topic
            `);
            
            return result.recordset;
        } catch (error) {
            console.error('Error fetching topic stats:', error);
            throw error;
        }
    }
}

module.exports = new QuestionRepository();
```

### Step 2: Update Server.js

Replace `backend/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const questionRepository = require('./data/questionRepository');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database connection
const initializeApp = async () => {
    try {
        await connectDB();
        console.log('Database connected successfully');
        
        // Start server after successful DB connection
        app.listen(PORT, () => {
            console.log(`AZ-204 Quiz API server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
            console.log(`Questions endpoint: http://localhost:${PORT}/api/questions`);
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

// API Routes
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await questionRepository.getAllQuestions();
        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

app.get('/api/questions/random', async (req, res) => {
    try {
        const question = await questionRepository.getRandomQuestion();
        
        if (!question) {
            return res.status(404).json({ error: 'No questions available' });
        }
        
        res.json(question);
    } catch (error) {
        console.error('Error fetching random question:', error);
        res.status(500).json({ error: 'Failed to fetch random question' });
    }
});

app.get('/api/questions/topic/:topic', async (req, res) => {
    try {
        const { topic } = req.params;
        const questions = await questionRepository.getQuestionsByTopic(topic);
        
        if (questions.length === 0) {
            return res.status(404).json({ error: `No questions found for topic: ${topic}` });
        }
        
        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions by topic:', error);
        res.status(500).json({ error: 'Failed to fetch questions by topic' });
    }
});

app.get('/api/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const question = await questionRepository.getQuestionById(parseInt(id));
        
        if (!question) {
            return res.status(404).json({ error: `Question with ID ${id} not found` });
        }
        
        res.json(question);
    } catch (error) {
        console.error('Error fetching question by ID:', error);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

app.get('/api/health', async (req, res) => {
    try {
        const questionCount = await questionRepository.getQuestionCount();
        const topicStats = await questionRepository.getTopicStats();
        
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            questionsCount: questionCount,
            database: 'Azure SQL Database',
            topics: topicStats
        });
    } catch (error) {
        console.error('Error in health check:', error);
        res.status(500).json({ 
            status: 'ERROR', 
            timestamp: new Date().toISOString(),
            error: 'Database connection failed'
        });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const topicStats = await questionRepository.getTopicStats();
        const totalCount = await questionRepository.getQuestionCount();
        
        res.json({
            totalQuestions: totalCount,
            topicBreakdown: topicStats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'AZ-204 Quiz API',
        version: '1.0.0',
        database: 'Azure SQL Database',
        endpoints: {
            questions: '/api/questions',
            randomQuestion: '/api/questions/random',
            questionsByTopic: '/api/questions/topic/:topic',
            questionById: '/api/questions/:id',
            health: '/api/health',
            stats: '/api/stats'
        }
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});

// Initialize the application
initializeApp();
```

---

## App Service Configuration

### Step 1: Configure App Service Connection String

**Via Azure Portal:**

1. **Navigate to your App Service** in Azure Portal
2. **Go to Configuration → Connection strings**
3. **Add new connection string:**
   - **Name**: `AZURE_SQL_CONNECTIONSTRING`
   - **Value**: `Server=az204-quiz-server.database.windows.net;Database=az204-quiz-db;User ID=sqladmin;Password=YourSecurePassword123!;Encrypt=true;TrustServerCertificate=false;`
   - **Type**: `SQLAzure`
4. **Click Save**

**Via Azure CLI:**

```bash
az webapp config connection-string set \
  --resource-group rg-az204-quiz \
  --name az204-quiz-app-[YOUR-SUFFIX] \
  --connection-string-type SQLAzure \
  --settings AZURE_SQL_CONNECTIONSTRING="Server=az204-quiz-server.database.windows.net;Database=az204-quiz-db;User ID=sqladmin;Password=YourSecurePassword123!;Encrypt=true;TrustServerCertificate=false;"
```

### Step 2: Configure Application Settings

**Via Azure Portal:**

1. **Go to Configuration → Application settings**
2. **Add these settings:**
   - `DB_SERVER`: `az204-quiz-server.database.windows.net`
   - `DB_NAME`: `az204-quiz-db`  
   - `DB_USER`: `sqladmin`
   - `DB_PASSWORD`: `YourSecurePassword123!`
   - `NODE_ENV`: `production`

**Via Azure CLI:**

```bash
az webapp config appsettings set \
  --resource-group rg-az204-quiz \
  --name az204-quiz-app-[YOUR-SUFFIX] \
  --settings \
    DB_SERVER="az204-quiz-server.database.windows.net" \
    DB_NAME="az204-quiz-db" \
    DB_USER="sqladmin" \
    DB_PASSWORD="YourSecurePassword123!" \
    NODE_ENV="production"
```

### Step 3: Update Network Access

**Configure SQL Server Firewall:**

```bash
# Allow App Service outbound IPs
az sql server firewall-rule create \
  --resource-group rg-az204-quiz \
  --server az204-quiz-server \
  --name "AllowAppService" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

# More secure: Get App Service outbound IPs and add specific rules
az webapp show \
  --resource-group rg-az204-quiz \
  --name az204-quiz-app-[YOUR-SUFFIX] \
  --query outboundIpAddresses --output tsv
```

---

## Connection String Security

### Option 1: Azure Key Vault (Recommended)

**Step 1: Create Key Vault**

```bash
az keyvault create \
  --resource-group rg-az204-quiz \
  --name kv-az204-quiz-[YOUR-SUFFIX] \
  --location "East US"
```

**Step 2: Store Connection String**

```bash
az keyvault secret set \
  --vault-name kv-az204-quiz-[YOUR-SUFFIX] \
  --name "SqlConnectionString" \
  --value "Server=az204-quiz-server.database.windows.net;Database=az204-quiz-db;User ID=sqladmin;Password=YourSecurePassword123!;Encrypt=true;"
```

**Step 3: Configure App Service Managed Identity**

```bash
# Enable managed identity
az webapp identity assign \
  --resource-group rg-az204-quiz \
  --name az204-quiz-app-[YOUR-SUFFIX]

# Grant Key Vault access
az keyvault set-policy \
  --name kv-az204-quiz-[YOUR-SUFFIX] \
  --object-id $(az webapp identity show --resource-group rg-az204-quiz --name az204-quiz-app-[YOUR-SUFFIX] --query principalId --output tsv) \
  --secret-permissions get
```

**Step 4: Update App Service Configuration**

```bash
az webapp config appsettings set \
  --resource-group rg-az204-quiz \
  --name az204-quiz-app-[YOUR-SUFFIX] \
  --settings DB_CONNECTION_STRING="@Microsoft.KeyVault(VaultName=kv-az204-quiz-[YOUR-SUFFIX];SecretName=SqlConnectionString)"
```

### Option 2: Managed Identity for SQL Authentication (Advanced)

Update `backend/config/database.js`:

```javascript
const { DefaultAzureCredential } = require('@azure/identity');

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: 1433,
    authentication: {
        type: 'azure-active-directory-default'
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
    }
};
```

---

## Testing and Verification

### Step 1: Local Testing

```bash
# Test locally with environment variables
cd backend
npm install
npm start

# Test endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/questions/random
```

### Step 2: Update Tests

Update `backend/tests/server.test.js`:

```javascript
// Mock the database connection for tests
jest.mock('../config/database');
jest.mock('../data/questionRepository');

const questionRepository = require('../data/questionRepository');

// Mock implementation
beforeEach(() => {
    questionRepository.getAllQuestions.mockResolvedValue(mockQuestions);
    questionRepository.getRandomQuestion.mockResolvedValue(mockQuestions[0]);
    questionRepository.getQuestionCount.mockResolvedValue(mockQuestions.length);
});
```

### Step 3: Production Verification

```bash
# Test production endpoints
curl https://az204-quiz-app-[YOUR-SUFFIX].azurewebsites.net/api/health
curl https://az204-quiz-app-[YOUR-SUFFIX].azurewebsites.net/api/questions/random
```

---

## Production Deployment

### Step 1: Update Deployment Scripts

Update root `package.json`:

```json
{
  "scripts": {
    "deploy": "npm run install-backend && npm run install-frontend && npm run build-frontend",
    "postdeploy": "cd backend && npm run db:migrate"  
  }
}
```

### Step 2: Database Migration Script

Create `backend/scripts/migrate.js`:

```javascript
const { connectDB } = require('../config/database');
const questionRepository = require('../data/questionRepository');

async function verifyDatabase() {
    try {
        await connectDB();
        const count = await questionRepository.getQuestionCount();
        console.log(`Database verified: ${count} questions found`);
        
        if (count === 0) {
            console.warn('No questions found in database. Please run the import script.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Database verification failed:', error);
        process.exit(1);
    }
}

verifyDatabase();
```

### Step 3: GitHub Actions Update

Update `.github/workflows/main.yml`:

```yaml
env:
  DB_SERVER: ${{ secrets.DB_SERVER }}
  DB_NAME: ${{ secrets.DB_NAME }}
  DB_USER: ${{ secrets.DB_USER }}
  DB_PASSWORD: ${{ secrets.DB_PASSWORD }}

steps:
  - name: Install dependencies
    run: |
      cd backend
      npm install
      
  - name: Run tests
    run: |
      cd backend
      npm test
      
  - name: Verify database connection
    run: |
      cd backend
      node scripts/migrate.js
```

---

## Monitoring and Troubleshooting

### Step 1: Application Insights Integration

```javascript
// Add to server.js
const appInsights = require('applicationinsights');

if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    appInsights.setup().start();
    console.log('Application Insights enabled');
}
```

### Step 2: Database Monitoring

```sql
-- Monitor active connections
SELECT 
    DB_NAME() as DatabaseName,
    COUNT(*) as ActiveConnections
FROM sys.dm_exec_sessions 
WHERE database_id = DB_ID();

-- Monitor query performance
SELECT TOP 10
    total_worker_time/execution_count AS AvgCPU,
    total_elapsed_time/execution_count AS AvgDuration,
    execution_count,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
              ((CASE qs.statement_end_offset
                WHEN -1 THEN DATALENGTH(st.text)
                ELSE qs.statement_end_offset
                END - qs.statement_start_offset)/2) + 1) AS QueryText
FROM sys.dm_exec_query_stats AS qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) AS st
ORDER BY total_worker_time/execution_count DESC;
```

### Step 3: Common Issues & Solutions

**Connection Pool Exhaustion:**
```javascript
// Update database config
pool: {
    max: 20,  // Increase pool size
    min: 5,   // Maintain minimum connections
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000
}
```

**Timeout Issues:**
```javascript
const config = {
    // ... other config
    requestTimeout: 60000,  // Increase to 60 seconds
    connectionTimeout: 60000
};
```

**Query Optimization:**
```sql
-- Add indexes for better performance
CREATE INDEX IX_Questions_Topic_Performance ON Questions(Topic) INCLUDE (Id, Question, Answer);
CREATE INDEX IX_Questions_Random ON Questions(Id) WHERE Id > 0;
```

---

## Performance Optimization

### Connection Pooling Best Practices

```javascript
// Enhanced database configuration
const dbConfig = {
    // ... connection details
    pool: {
        max: 10,              // Maximum connections
        min: 2,               // Minimum connections
        acquireTimeoutMillis: 60000,  // Time to wait for connection
        idleTimeoutMillis: 600000,    // How long connection can be idle
        createTimeoutMillis: 30000,   // Time to wait for connection creation
    },
    options: {
        enableArithAbort: true,
        encrypt: true,
        trustServerCertificate: false,
        requestTimeout: 30000,
        cancelTimeout: 5000,
        // Connection retry logic
        connectTimeout: 30000,
    }
};
```

### Caching Strategy

```javascript
// Add caching for frequently accessed data
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Enhanced repository with caching
async getRandomQuestion() {
    const cacheKey = 'random_question_' + Math.floor(Date.now() / 60000); // 1 minute cache
    const cached = cache.get(cacheKey);
    
    if (cached) {
        return cached;
    }
    
    const question = await this.fetchRandomQuestionFromDB();
    cache.set(cacheKey, question);
    return question;
}
```

---

## Migration Checklist

- [ ] Azure SQL Database created and populated
- [ ] Database firewall configured for App Service
- [ ] Backend packages installed (mssql, dotenv)
- [ ] Database configuration file created
- [ ] Repository layer implemented
- [ ] Server.js updated for database integration
- [ ] App Service connection strings configured
- [ ] Environment variables set in App Service
- [ ] Local testing completed
- [ ] Production deployment successful
- [ ] Database monitoring configured
- [ ] Performance optimization applied
- [ ] Error handling and logging implemented

---

## Next Phase Enhancements

Once the database integration is complete, consider these Phase 2 features:

1. **User Authentication** - Track individual progress
2. **Question Analytics** - Track difficulty and success rates
3. **Adaptive Learning** - Focus on weak areas
4. **Question Management** - Admin interface for content updates
5. **Performance Metrics** - Detailed statistics and reporting

Your AZ-204 Quiz App is now ready for production scale with Azure SQL Database! 🚀