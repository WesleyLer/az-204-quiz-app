# Azure SQL Database Import Guide

This guide provides step-by-step instructions for importing the AZ-204 quiz questions from JSON into Azure SQL Database.

## Prerequisites

- [ ] Azure SQL Database created
- [ ] Database connection credentials
- [ ] Azure Data Studio or SQL Server Management Studio (SSMS)
- [ ] PowerShell or Azure CLI access
- [ ] JSON questions file (backend/questions.json)

---

## Table of Contents

1. [Database Setup](#database-setup)
2. [Table Creation](#table-creation)
3. [Import Methods](#import-methods)
   - [Method 1: Direct SQL INSERT](#method-1-direct-sql-insert)
   - [Method 2: Azure Data Studio Import](#method-2-azure-data-studio-import)
   - [Method 3: PowerShell with SqlServer Module](#method-3-powershell-with-sqlserver-module)
   - [Method 4: Azure Data Factory](#method-4-azure-data-factory)
4. [Verification Queries](#verification-queries)
5. [Indexing and Performance](#indexing-and-performance)

---

## Database Setup

### Step 1: Create Azure SQL Database

```bash
# Using Azure CLI
az sql server create \
  --name az204-quiz-server \
  --resource-group rg-az204-quiz \
  --location "East US" \
  --admin-user sqladmin \
  --admin-password "YourSecurePassword123!"

az sql db create \
  --resource-group rg-az204-quiz \
  --server az204-quiz-server \
  --name az204-quiz-db \
  --service-objective S0
```

### Step 2: Configure Firewall

```bash
# Allow your IP
az sql server firewall-rule create \
  --resource-group rg-az204-quiz \
  --server az204-quiz-server \
  --name "ClientIP" \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP

# Allow Azure services
az sql server firewall-rule create \
  --resource-group rg-az204-quiz \
  --server az204-quiz-server \
  --name "AllowAzureServices" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

---

## Table Creation

### Questions Table Schema

```sql
-- Create Questions table
CREATE TABLE Questions (
    Id INT PRIMARY KEY,
    Topic NVARCHAR(100) NOT NULL,
    SkillArea NVARCHAR(200) NOT NULL,
    Question NVARCHAR(MAX) NOT NULL,
    Options NVARCHAR(MAX) NOT NULL, -- JSON array as string
    Answer NVARCHAR(500) NOT NULL,
    Explanation NVARCHAR(MAX) NOT NULL,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    ModifiedDate DATETIME2 DEFAULT GETUTCDATE()
);

-- Create indexes for better performance
CREATE INDEX IX_Questions_Topic ON Questions(Topic);
CREATE INDEX IX_Questions_SkillArea ON Questions(SkillArea);
CREATE INDEX IX_Questions_CreatedDate ON Questions(CreatedDate);
```

### Alternative: Normalized Schema

If you prefer a normalized approach with separate options table:

```sql
-- Questions table (normalized)
CREATE TABLE Questions (
    Id INT PRIMARY KEY,
    Topic NVARCHAR(100) NOT NULL,
    SkillArea NVARCHAR(200) NOT NULL,
    Question NVARCHAR(MAX) NOT NULL,
    Answer NVARCHAR(500) NOT NULL,
    Explanation NVARCHAR(MAX) NOT NULL,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    ModifiedDate DATETIME2 DEFAULT GETUTCDATE()
);

-- Question Options table
CREATE TABLE QuestionOptions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    QuestionId INT NOT NULL,
    OptionText NVARCHAR(500) NOT NULL,
    OptionOrder TINYINT NOT NULL,
    FOREIGN KEY (QuestionId) REFERENCES Questions(Id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IX_Questions_Topic ON Questions(Topic);
CREATE INDEX IX_Questions_SkillArea ON Questions(SkillArea);
CREATE INDEX IX_QuestionOptions_QuestionId ON QuestionOptions(QuestionId);
```

---

## Import Methods

## Method 1: Direct SQL INSERT

### Step 1: Generate INSERT Statements

Use this PowerShell script to convert JSON to SQL INSERT statements:

```powershell
# Convert JSON to SQL INSERT statements
$jsonPath = "backend/questions.json"
$questions = Get-Content $jsonPath | ConvertFrom-Json

$insertStatements = @()

foreach ($question in $questions) {
    # Escape single quotes in strings
    $topic = $question.topic -replace "'", "''"
    $skillArea = $question.skillArea -replace "'", "''"
    $questionText = $question.question -replace "'", "''"
    $options = ($question.options | ConvertTo-Json -Compress) -replace "'", "''"
    $answer = $question.answer -replace "'", "''"
    $explanation = $question.explanation -replace "'", "''"
    
    $insert = @"
INSERT INTO Questions (Id, Topic, SkillArea, Question, Options, Answer, Explanation)
VALUES ($($question.id), '$topic', '$skillArea', '$questionText', '$options', '$answer', '$explanation');
"@
    
    $insertStatements += $insert
}

# Save to SQL file
$insertStatements | Out-File -FilePath "import_questions.sql" -Encoding UTF8
Write-Host "Generated import_questions.sql with $($insertStatements.Count) INSERT statements"
```

### Step 2: Execute SQL File

```sql
-- Execute the generated SQL file in Azure Data Studio or SSMS
-- Or run directly:

INSERT INTO Questions (Id, Topic, SkillArea, Question, Options, Answer, Explanation)
VALUES 
(1, 'App Service', 'Develop Azure compute solutions', 
 'Which of the following is NOT a valid App Service plan pricing tier?', 
 '["Free","Shared","PremiumV2","Elastic Premium"]', 
 'Elastic Premium', 
 'Elastic Premium is not a valid App Service plan tier. Valid tiers include Free, Shared, Basic, Standard, PremiumV2, PremiumV3, and Isolated.'),

(2, 'App Service', 'Develop Azure compute solutions', 
 'Which deployment slot feature allows zero-downtime deployments?', 
 '["Traffic Manager","Swap","Scale-Out","Backup"]', 
 'Swap', 
 'Deployment slot swapping allows you to deploy to a staging slot and then swap it with production, enabling zero-downtime deployments.'),

-- ... continue for all 56 questions
-- (See generated file for complete INSERT statements)
```

## Method 2: Azure Data Studio Import

### Step 1: Prepare CSV File

Convert JSON to CSV using PowerShell:

```powershell
# Convert JSON to CSV
$jsonPath = "backend/questions.json"
$questions = Get-Content $jsonPath | ConvertFrom-Json

$csvData = @()
foreach ($question in $questions) {
    $csvData += [PSCustomObject]@{
        Id = $question.id
        Topic = $question.topic
        SkillArea = $question.skillArea
        Question = $question.question
        Options = ($question.options | ConvertTo-Json -Compress)
        Answer = $question.answer
        Explanation = $question.explanation
    }
}

$csvData | Export-Csv -Path "questions.csv" -NoTypeInformation -Encoding UTF8
Write-Host "Exported questions.csv"
```

### Step 2: Import via Azure Data Studio

1. **Open Azure Data Studio**
2. **Connect to your Azure SQL Database**
3. **Right-click on the database** → **Import Wizard**
4. **Select CSV file**: Choose `questions.csv`
5. **Configure mapping**:
   - Map CSV columns to database columns
   - Set appropriate data types
6. **Execute import**

## Method 3: PowerShell with SqlServer Module

### Step 1: Install SqlServer Module

```powershell
# Install SqlServer PowerShell module
Install-Module -Name SqlServer -Force -AllowClobber
```

### Step 2: Import Script

```powershell
# Import questions using SqlServer module
param(
    [string]$ServerName = "az204-quiz-server.database.windows.net",
    [string]$DatabaseName = "az204-quiz-db",
    [string]$Username = "sqladmin",
    [string]$Password = "YourSecurePassword123!",
    [string]$JsonPath = "backend/questions.json"
)

# Import SqlServer module
Import-Module SqlServer

# Read JSON file
$questions = Get-Content $JsonPath | ConvertFrom-Json

# Connection string
$connectionString = "Server=$ServerName;Database=$DatabaseName;User ID=$Username;Password=$Password;Encrypt=True;TrustServerCertificate=False;"

# Import each question
foreach ($question in $questions) {
    try {
        $query = @"
INSERT INTO Questions (Id, Topic, SkillArea, Question, Options, Answer, Explanation)
VALUES (@Id, @Topic, @SkillArea, @Question, @Options, @Answer, @Explanation)
"@
        
        $parameters = @{
            Id = $question.id
            Topic = $question.topic
            SkillArea = $question.skillArea
            Question = $question.question
            Options = ($question.options | ConvertTo-Json -Compress)
            Answer = $question.answer
            Explanation = $question.explanation
        }
        
        Invoke-Sqlcmd -ConnectionString $connectionString -Query $query -Variable $parameters
        Write-Host "Imported question $($question.id): $($question.question.Substring(0, 50))..."
    }
    catch {
        Write-Error "Failed to import question $($question.id): $_"
    }
}

Write-Host "Import completed!"
```

## Method 4: Azure Data Factory

### Step 1: Create Data Factory Pipeline

1. **Create Azure Data Factory**
2. **Create Linked Services**:
   - Source: Azure Blob Storage (upload JSON file)
   - Sink: Azure SQL Database
3. **Create Dataset**:
   - JSON dataset for source
   - SQL table dataset for sink
4. **Create Pipeline**:
   - Copy Data activity
   - Map JSON properties to SQL columns

### Step 2: JSON to SQL Mapping

```json
{
  "source": {
    "type": "JsonSource",
    "storeSettings": {
      "type": "AzureBlobStorageReadSettings"
    }
  },
  "sink": {
    "type": "AzureSqlSink",
    "tableOption": "autoCreate"
  },
  "translator": {
    "type": "TabularTranslator",
    "mappings": [
      {"source": {"path": "$.id"}, "sink": {"name": "Id"}},
      {"source": {"path": "$.topic"}, "sink": {"name": "Topic"}},
      {"source": {"path": "$.skillArea"}, "sink": {"name": "SkillArea"}},
      {"source": {"path": "$.question"}, "sink": {"name": "Question"}},
      {"source": {"path": "$.options"}, "sink": {"name": "Options"}},
      {"source": {"path": "$.answer"}, "sink": {"name": "Answer"}},
      {"source": {"path": "$.explanation"}, "sink": {"name": "Explanation"}}
    ]
  }
}
```

---

## Complete SQL INSERT Script

Here's the complete SQL script to insert all 56 questions:

```sql
-- Clear existing data (if needed)
-- DELETE FROM Questions;

-- Insert all questions
INSERT INTO Questions (Id, Topic, SkillArea, Question, Options, Answer, Explanation) VALUES
(1, 'App Service', 'Develop Azure compute solutions', 'Which of the following is NOT a valid App Service plan pricing tier?', '["Free","Shared","PremiumV2","Elastic Premium"]', 'Elastic Premium', 'Elastic Premium is not a valid App Service plan tier. Valid tiers include Free, Shared, Basic, Standard, PremiumV2, PremiumV3, and Isolated.'),

(2, 'App Service', 'Develop Azure compute solutions', 'Which deployment slot feature allows zero-downtime deployments?', '["Traffic Manager","Swap","Scale-Out","Backup"]', 'Swap', 'Deployment slot swapping allows you to deploy to a staging slot and then swap it with production, enabling zero-downtime deployments.'),

(3, 'App Service', 'Develop Azure compute solutions', 'What setting in App Service allows you to configure environment variables for your app?', '["Application Settings","Scaling Settings","Deployment Center","Authentication"]', 'Application Settings', 'Application Settings in App Service allow you to configure environment variables and connection strings for your application.'),

(4, 'App Service', 'Develop Azure compute solutions', 'Which App Service scaling mode lets you automatically adjust instances based on CPU usage?', '["Manual Scale","Auto Scale","Vertical Scale","Premium Only"]', 'Auto Scale', 'Auto Scale allows you to automatically scale your App Service based on metrics like CPU usage, memory usage, or custom metrics.'),

(5, 'App Service', 'Develop Azure compute solutions', 'What is the minimum App Service plan tier required to enable deployment slots?', '["Free","Shared","Basic","Standard"]', 'Standard', 'Deployment slots are available in Standard, Premium, and Isolated tiers. Basic, Shared, and Free tiers do not support deployment slots.'),

(6, 'App Service', 'Develop Azure compute solutions', 'What is the maximum number of custom domains you can add to a single App Service app in the Free tier?', '["0","1","5","Unlimited"]', '0', 'The Free tier does not support custom domains. You need at least the Shared tier to add custom domains.'),

(7, 'App Service', 'Develop Azure compute solutions', 'Which authentication method is supported by App Service Easy Auth?', '["SAML 2.0","Microsoft Identity Platform","LDAP","Kerberos"]', 'Microsoft Identity Platform', 'App Service Easy Auth supports OAuth 2.0 providers including Microsoft Identity Platform, Google, Facebook, and Twitter.'),

(8, 'App Service', 'Develop Azure compute solutions', 'What happens to application settings during a deployment slot swap?', '["All settings are swapped","No settings are swapped","Only slot-specific settings stay","Only connection strings are swapped"]', 'Only slot-specific settings stay', 'During slot swap, most settings are swapped, but slot-specific settings (marked as deployment slot settings) remain with their respective slots.'),

(9, 'App Service', 'Develop Azure compute solutions', 'Which feature allows you to route a percentage of traffic to a deployment slot for testing?', '["Load Balancer","Traffic Routing","A/B Testing","Blue-Green Deployment"]', 'Traffic Routing', 'Traffic routing in deployment slots allows you to route a percentage of traffic to different slots for gradual rollout and A/B testing.'),

(10, 'App Service', 'Develop Azure compute solutions', 'What is the default scaling limit for App Service instances in the Basic tier?', '["1 instance","3 instances","10 instances","20 instances"]', '3 instances', 'The Basic tier supports manual scaling up to 3 instances. Auto-scaling is not available in the Basic tier.'),

(11, 'App Service', 'Develop Azure compute solutions', 'Which configuration element in web.config helps ensure smooth slot swaps?', '["connectionStrings","applicationInitialization","httpModules","compilation"]', 'applicationInitialization', 'The applicationInitialization element ensures your app is warmed up before receiving traffic during slot swaps, preventing cold start issues.'),

(12, 'App Service', 'Develop Azure compute solutions', 'What is the maximum number of deployment slots available in the Standard tier?', '["5","10","15","20"]', '5', 'The Standard tier supports up to 5 deployment slots including production. Premium tiers support up to 20 slots.'),

(13, 'App Service', 'Develop Azure compute solutions', 'Which App Service feature automatically restarts your app when it becomes unresponsive?', '["Health Check","Auto Heal","Always On","Application Insights"]', 'Auto Heal', 'Auto Heal automatically restarts your app based on predefined rules when issues like high memory usage or unresponsive requests are detected.'),

(14, 'App Service', 'Develop Azure compute solutions', 'What is required to enable HTTPS-only access for an App Service?', '["SSL certificate","Custom domain","Premium tier","TLS/SSL setting"]', 'TLS/SSL setting', 'You can enable HTTPS-only access through the TLS/SSL settings in any App Service tier, even with the default *.azurewebsites.net domain.'),

(15, 'App Service', 'Develop Azure compute solutions', 'Which deployment method provides the fastest deployment for large applications?', '["Local Git","GitHub Actions","ZIP Deploy","Run from Package"]', 'Run from Package', 'Run from Package deploys by mounting the ZIP file directly, avoiding file extraction and providing faster deployment for large applications.'),

(16, 'App Service', 'Develop Azure compute solutions', 'What is the purpose of the Always On setting in App Service?', '["Enable auto-scaling","Prevent app from sleeping","Enable HTTPS","Configure custom domains"]', 'Prevent app from sleeping', 'Always On prevents your app from being unloaded when idle, ensuring better response times for the first request after idle periods.'),

(17, 'App Service', 'Develop Azure compute solutions', 'Which scaling metric is NOT available for App Service auto-scaling rules?', '["CPU Percentage","Memory Percentage","HTTP Queue Length","Disk Space"]', 'Disk Space', 'App Service auto-scaling supports CPU, memory, HTTP queue length, and custom metrics, but not disk space as a scaling metric.'),

(18, 'App Service', 'Develop Azure compute solutions', 'What happens when you delete a deployment slot?', '["App stops working","Settings are merged","Slot is archived","Resources are released"]', 'Resources are released', 'When you delete a deployment slot, all its resources are released and the slot configuration is permanently removed.'),

(19, 'App Service', 'Develop Azure compute solutions', 'Which App Service plan type provides network isolation?', '["Basic","Standard","Premium","Isolated"]', 'Isolated', 'The Isolated tier provides network isolation by running in dedicated Azure App Service Environments (ASE).'),

(20, 'App Service', 'Develop Azure compute solutions', 'What is the maximum file size for ZIP deployment in App Service?', '["100 MB","512 MB","1 GB","2 GB"]', '1 GB', 'ZIP deployment in App Service supports packages up to 1 GB in size through the Kudu API.'),

(21, 'App Service', 'Develop Azure compute solutions', 'Which feature allows you to test new code with a subset of users?', '["Blue-Green Deployment","Canary Deployment","Rolling Deployment","Shadow Deployment"]', 'Canary Deployment', 'Canary deployment uses traffic routing to send a percentage of users to the new version while maintaining the stable version for others.'),

(22, 'App Service', 'Develop Azure compute solutions', 'What is the default timeout for HTTP requests in App Service?', '["30 seconds","230 seconds","300 seconds","600 seconds"]', '230 seconds', 'The default HTTP request timeout in App Service is 230 seconds (approximately 4 minutes) and cannot be increased.'),

(23, 'App Service', 'Develop Azure compute solutions', 'Which authentication flow is recommended for server-side web applications?', '["Implicit Flow","Authorization Code Flow","Client Credentials Flow","Device Code Flow"]', 'Authorization Code Flow', 'Authorization Code Flow is the recommended and most secure flow for server-side web applications as it keeps tokens secure.'),

(24, 'App Service', 'Develop Azure compute solutions', 'What happens to WebJobs when you swap deployment slots?', '["WebJobs are swapped","WebJobs remain with slots","WebJobs are deleted","WebJobs are duplicated"]', 'WebJobs remain with slots', 'WebJobs are tied to their specific deployment slots and do not move during slot swaps to prevent disruption of background processes.'),

(25, 'App Service', 'Develop Azure compute solutions', 'Which logging destination provides the longest retention period?', '["File System","Blob Storage","Event Hub","Log Analytics"]', 'Blob Storage', 'Blob Storage can retain App Service logs indefinitely, while File System logging has limited retention (12 hours to 7 days).'),

(26, 'App Service', 'Develop Azure compute solutions', 'What is the minimum number of instances required for auto-scaling?', '["0","1","2","3"]', '1', 'Auto-scaling requires a minimum of 1 instance to ensure your application remains available during scaling operations.'),

(27, 'App Service', 'Develop Azure compute solutions', 'Which setting determines the .NET Framework version for your App Service?', '["Application Settings","General Settings","Path Mappings","Default Documents"]', 'General Settings', 'The .NET Framework version is configured in the General Settings section of your App Service configuration.'),

(28, 'App Service', 'Develop Azure compute solutions', 'What is the purpose of the SCM site in App Service?', '["User interface","Development tools","Database access","File management"]', 'Development tools', 'The SCM (Source Control Manager) site provides access to Kudu, which offers development tools, console access, and deployment utilities.'),

(29, 'App Service', 'Develop Azure compute solutions', 'Which connection string type is specifically for Entity Framework?', '["SQLServer","SQLAzure","Custom","MySql"]', 'SQLAzure', 'SQLAzure is the connection string type designed for Azure SQL databases and Entity Framework integration.'),

(30, 'App Service', 'Develop Azure compute solutions', 'What happens when you enable ''Run From Package'' deployment?', '["Files are extracted","Package is mounted","Code is compiled","Database is created"]', 'Package is mounted', 'Run From Package mounts the ZIP file as a read-only file system, improving cold start performance and deployment speed.'),

(31, 'App Service', 'Develop Azure compute solutions', 'Which tier supports VNet integration for outbound connections?', '["Basic and above","Standard and above","Premium and above","Isolated only"]', 'Standard and above', 'VNet integration for outbound connections is available in Standard, Premium, and Isolated tiers, but not in Basic, Shared, or Free tiers.'),

(32, 'App Service', 'Develop Azure compute solutions', 'What is the maximum number of scale-out rules you can configure?', '["5","10","15","20"]', '10', 'You can configure up to 10 scale-out rules and 10 scale-in rules per App Service plan for comprehensive auto-scaling scenarios.'),

(33, 'App Service', 'Develop Azure compute solutions', 'Which deployment slot setting prevents a setting from being swapped?', '["Sticky Setting","Slot Setting","Deployment Setting","Environment Setting"]', 'Deployment Setting', 'Settings marked as ''Deployment slot setting'' (sticky) remain with their respective slots and are not swapped during slot operations.'),

(34, 'App Service', 'Develop Azure compute solutions', 'What is the default scale condition evaluation frequency?', '["1 minute","5 minutes","10 minutes","15 minutes"]', '5 minutes', 'Auto-scaling rules are evaluated every 5 minutes by default, though this can be adjusted based on your scaling requirements.'),

(35, 'App Service', 'Develop Azure compute solutions', 'Which authentication token has the longest default lifetime?', '["Access Token","ID Token","Refresh Token","Session Token"]', 'Refresh Token', 'Refresh tokens typically have the longest lifetime (days to months) and are used to obtain new access tokens without re-authentication.'),

(36, 'App Service', 'Develop Azure compute solutions', 'What happens when you exceed the file system quota in App Service?', '["App crashes","New files rejected","Oldest files deleted","Performance degrades"]', 'New files rejected', 'When the file system quota is exceeded, attempts to write new files will fail, but existing functionality continues to work.'),

(37, 'App Service', 'Develop Azure compute solutions', 'Which feature allows you to configure custom startup commands?', '["Application Settings","General Settings","Startup Command","Path Mappings"]', 'General Settings', 'Custom startup commands are configured in the General Settings section, allowing you to specify how your application should start.'),

(38, 'App Service', 'Develop Azure compute solutions', 'What is the purpose of health check endpoints in App Service?', '["Monitor performance","Detect unhealthy instances","Log requests","Manage certificates"]', 'Detect unhealthy instances', 'Health check endpoints allow App Service to detect unhealthy instances and replace them automatically to maintain application availability.'),

(39, 'App Service', 'Develop Azure compute solutions', 'Which deployment method is best for continuous integration?', '["ZIP Deploy","FTP","GitHub Actions","Local Git"]', 'GitHub Actions', 'GitHub Actions provides robust CI/CD capabilities with automated testing, building, and deployment workflows for continuous integration.'),

(40, 'App Service', 'Develop Azure compute solutions', 'What is the maximum retention period for diagnostic logs in the file system?', '["12 hours","3 days","7 days","30 days"]', '7 days', 'File system diagnostic logs can be retained for a maximum of 7 days before being automatically deleted to prevent storage issues.'),

(41, 'App Service', 'Develop Azure compute solutions', 'Which scaling approach is recommended for predictable load patterns?', '["Reactive scaling","Proactive scaling","Manual scaling","Scheduled scaling"]', 'Scheduled scaling', 'Scheduled scaling allows you to proactively scale based on known patterns, providing better performance and cost optimization for predictable loads.'),

(42, 'App Service', 'Develop Azure compute solutions', 'What is the default HTTP version supported by App Service?', '["HTTP/1.0","HTTP/1.1","HTTP/2.0","HTTP/3.0"]', 'HTTP/2.0', 'App Service supports HTTP/2.0 by default, providing improved performance through multiplexing and server push capabilities.'),

(43, 'App Service', 'Develop Azure compute solutions', 'Which setting controls whether your app can be debugged remotely?', '["Remote Debugging","Debug Mode","General Settings","Application Settings"]', 'General Settings', 'Remote debugging is enabled through the General Settings configuration, allowing Visual Studio to attach to your running app.'),

(44, 'App Service', 'Develop Azure compute solutions', 'What happens when you enable ''Managed Identity'' for App Service?', '["Creates service principal","Assigns admin rights","Enables encryption","Configures firewall"]', 'Creates service principal', 'Managed Identity creates a service principal in Azure AD that can be used to authenticate to other Azure services without storing credentials.'),

(45, 'App Service', 'Develop Azure compute solutions', 'Which tool provides the most detailed deployment logs?', '["Azure Portal","Kudu Console","Azure CLI","Visual Studio"]', 'Kudu Console', 'The Kudu console provides the most detailed deployment logs and diagnostic information for troubleshooting deployment issues.'),

(46, 'App Service', 'Develop Azure compute solutions', 'What is the recommended approach for storing sensitive configuration data?', '["Application Settings","Connection Strings","Key Vault","Environment Variables"]', 'Key Vault', 'Azure Key Vault is the recommended secure storage solution for sensitive data like passwords, certificates, and API keys.'),

(47, 'App Service', 'Develop Azure compute solutions', 'Which feature allows you to route requests based on client location?', '["Traffic Manager","Application Gateway","Front Door","Load Balancer"]', 'Front Door', 'Azure Front Door provides global routing capabilities, allowing you to route requests based on client location and other criteria.'),

(48, 'App Service', 'Develop Azure compute solutions', 'What is the maximum number of custom handlers you can configure?', '["5","10","20","Unlimited"]', '20', 'App Service allows up to 20 custom handlers to be configured for different file extensions and URL patterns.'),

(49, 'App Service', 'Develop Azure compute solutions', 'Which authentication method provides the highest security for API access?', '["API Key","Basic Authentication","OAuth 2.0","Certificate Authentication"]', 'Certificate Authentication', 'Certificate-based authentication provides the highest security by using cryptographic certificates for mutual authentication.'),

(50, 'App Service', 'Develop Azure compute solutions', 'What is the purpose of the ''Warm up'' feature in deployment slots?', '["Compile code","Initialize cache","Load configuration","Prepare instance"]', 'Prepare instance', 'The warm-up feature ensures that application instances are fully initialized and ready to serve traffic before becoming active during slot swaps.'),

(51, 'Functions', 'Develop Azure compute solutions', 'Which Azure Functions hosting plan provides unlimited scale and a pay-per-execution billing model?', '["Dedicated","Consumption","Premium","App Service"]', 'Consumption', 'The Consumption plan provides unlimited scale and charges only for the time your functions execute.'),

(52, 'Functions', 'Develop Azure compute solutions', 'What is the maximum execution timeout for Azure Functions in the Consumption plan?', '["5 minutes","10 minutes","30 minutes","Unlimited"]', '10 minutes', 'Functions in the Consumption plan have a maximum execution timeout of 10 minutes (600 seconds).'),

(53, 'Storage', 'Develop for Azure storage', 'What type of Azure Storage should you use for storing large binary files like images or videos?', '["Table Storage","Queue Storage","Blob Storage","File Storage"]', 'Blob Storage', 'Blob Storage is optimized for storing massive amounts of unstructured data like images, videos, and documents.'),

(54, 'Storage', 'Develop for Azure storage', 'Which Blob Storage access tier has the lowest storage cost but highest access cost?', '["Hot","Cool","Archive","Premium"]', 'Archive', 'Archive tier has the lowest storage costs but highest access costs and longest rehydration time.'),

(55, 'Cosmos DB', 'Develop for Azure storage', 'Which consistency level in Cosmos DB provides the strongest consistency guarantees?', '["Eventual","Session","Bounded Staleness","Strong"]', 'Strong', 'Strong consistency provides linearizability guarantees, ensuring reads receive the most recent committed version of an item.'),

(56, 'Key Vault', 'Implement Azure security', 'What is the maximum size of a secret value that can be stored in Azure Key Vault?', '["25 KB","50 KB","100 KB","1 MB"]', '25 KB', 'Azure Key Vault secrets have a maximum size limit of 25 KB for the secret value.');

-- Verify import
SELECT COUNT(*) as TotalQuestions FROM Questions;
SELECT Topic, COUNT(*) as QuestionCount FROM Questions GROUP BY Topic;
```

---

## Verification Queries

After importing, run these queries to verify the data:

```sql
-- Check total count
SELECT COUNT(*) as TotalQuestions FROM Questions;

-- Check by topic
SELECT Topic, COUNT(*) as QuestionCount 
FROM Questions 
GROUP BY Topic 
ORDER BY QuestionCount DESC;

-- Check by skill area
SELECT SkillArea, COUNT(*) as QuestionCount 
FROM Questions 
GROUP BY SkillArea 
ORDER BY QuestionCount DESC;

-- Sample questions
SELECT TOP 5 Id, Topic, Question, Answer 
FROM Questions 
ORDER BY Id;

-- Check for any missing data
SELECT Id, Topic, 
       CASE WHEN Question IS NULL OR Question = '' THEN 'Missing Question' ELSE 'OK' END as QuestionStatus,
       CASE WHEN Options IS NULL OR Options = '' THEN 'Missing Options' ELSE 'OK' END as OptionsStatus,
       CASE WHEN Answer IS NULL OR Answer = '' THEN 'Missing Answer' ELSE 'OK' END as AnswerStatus
FROM Questions
WHERE Question IS NULL OR Question = '' OR 
      Options IS NULL OR Options = '' OR 
      Answer IS NULL OR Answer = '';
```

---

## Indexing and Performance

### Recommended Indexes

```sql
-- Performance indexes for common queries
CREATE INDEX IX_Questions_Topic_SkillArea ON Questions(Topic, SkillArea);
CREATE INDEX IX_Questions_Topic_Id ON Questions(Topic, Id);

-- Full-text search index for question content (optional)
CREATE FULLTEXT CATALOG QuestionsCatalog;
CREATE FULLTEXT INDEX ON Questions(Question, Explanation) 
KEY INDEX PK__Question__3214EC0771EC9FC8 ON QuestionsCatalog;
```

### Query Performance Examples

```sql
-- Efficient random question by topic
SELECT TOP 1 * FROM Questions 
WHERE Topic = 'App Service' 
ORDER BY NEWID();

-- Search questions by keyword
SELECT Id, Topic, Question, Answer 
FROM Questions 
WHERE Question LIKE '%deployment%' OR Explanation LIKE '%deployment%';

-- Get questions with statistics
SELECT q.*, 
       (SELECT COUNT(*) FROM Questions WHERE Topic = q.Topic) as TopicQuestionCount
FROM Questions q
WHERE q.Id = @QuestionId;
```

---

## Connection String Examples

### .NET Configuration

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=az204-quiz-server.database.windows.net;Database=az204-quiz-db;User ID=sqladmin;Password=YourSecurePassword123!;Encrypt=True;TrustServerCertificate=False;"
  }
}
```

### Entity Framework Context

```csharp
public class QuizDbContext : DbContext
{
    public QuizDbContext(DbContextOptions<QuizDbContext> options) : base(options) { }
    
    public DbSet<Question> Questions { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Question).IsRequired();
            entity.Property(e => e.Options).IsRequired();
            entity.Property(e => e.Answer).IsRequired();
            entity.HasIndex(e => e.Topic);
            entity.HasIndex(e => e.SkillArea);
        });
    }
}
```

---

## Troubleshooting

### Common Issues

**Connection Timeouts:**
```sql
-- Increase connection timeout in connection string
"Connection Timeout=60;"
```

**Special Characters:**
```sql
-- Ensure proper escaping of single quotes
UPDATE Questions SET Question = REPLACE(Question, '''', '''''') WHERE Question LIKE '%''%';
```

**JSON Validation:**
```sql
-- Validate JSON format in Options column
SELECT Id, Options FROM Questions WHERE ISJSON(Options) = 0;
```

**Performance Issues:**
```sql
-- Check query execution plans
SET STATISTICS IO ON;
SELECT * FROM Questions WHERE Topic = 'App Service';
```

---

## Maintenance

### Update Procedures

```sql
-- Add new question
INSERT INTO Questions (Id, Topic, SkillArea, Question, Options, Answer, Explanation)
VALUES (57, 'App Service', 'Develop Azure compute solutions', 
        'New question text?', '["Option1","Option2","Option3","Option4"]', 
        'Correct Option', 'Detailed explanation');

-- Update existing question
UPDATE Questions 
SET Question = 'Updated question text?',
    ModifiedDate = GETUTCDATE()
WHERE Id = 1;

-- Bulk update topic
UPDATE Questions 
SET Topic = 'Azure App Service',
    ModifiedDate = GETUTCDATE()
WHERE Topic = 'App Service';
```

### Backup Strategy

```sql
-- Create backup
BACKUP DATABASE [az204-quiz-db] 
TO URL = 'https://yourstorageaccount.blob.core.windows.net/backups/quiz-backup.bacpac';

-- Export to BACPAC
-- Use Azure Portal or Azure Data Studio Export wizard
```

---

## Next Steps

1. **Test the import** with a few sample records first
2. **Verify data integrity** using the verification queries
3. **Update your application** to use Azure SQL Database instead of JSON file
4. **Implement connection string** in your Node.js backend
5. **Add error handling** for database connectivity issues
6. **Consider implementing caching** for frequently accessed questions

---

**📝 Notes:**
- Replace placeholder values (server names, passwords) with your actual values
- Test the import process with a small dataset first
- Ensure proper firewall rules are configured for your IP address
- Consider using Azure Key Vault for connection string storage in production