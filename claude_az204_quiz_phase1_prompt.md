You are my coding assistant. 
Follow Anthropic’s “Claude Code Best Practices” guidelines from https://www.anthropic.com/engineering/claude-code-best-practices.
This means:
- Write clean, modular, and well-commented code.  
- Use explicit filenames and boundaries when outputting multiple files.  
- Provide explanations before giving code.  
- Give incremental instructions rather than giant dumps when appropriate.  
- Assume I will be iterating, so structure outputs to be easy to continue later.  

---

We are building a **quiz application for AZ-204 certification practice** that will be deployed on **Azure App Service**.

### Key Requirements
1. Break the project into **phases/releases** so I can learn Azure step by step:  
   - **Phase 1**: Basic app that shows hardcoded AZ-204 practice questions, focusing mainly on **Azure App Service**.  
   - Later phases: Database storage, user progress tracking, authentication, monitoring, etc.  

2. For each phase, give me:  
   - Project folder structure  
   - Example code (backend + frontend, minimal working version)  
   - Setup instructions  
   - Azure deployment steps  

3. Store all the instructions, code, and progress in a **living project document** so that when I return, we can **continue where we left off**.  

4. Assume I am using **Node.js/Express for backend** and **React for frontend**.  

5. Use **Markdown formatting** with:  
   - Headings for each section  
   - Code blocks for code samples  
   - Step-by-step checklists for setup and deployment  

6. Keep explanations clear and structured so I can follow as I learn.  

---

### Phase 1 – Minimum Viable App
**Goal**: Get a working app deployed to **Azure App Service** that serves practice questions.  

- **Backend**: Hardcode a JSON file of AZ-204 questions and serve them via a REST API (`/questions`).  
- **Frontend**: Simple UI that:  
  - Displays a random question  
  - Shows multiple-choice options  
  - Lets me click an answer and see if it’s correct  

- **Azure Work**:  
  - Create an **App Service (Web App)**  
  - Deploy backend + frontend  
  - Access the quiz via the public App Service URL  

---

### Suggested Project Structure for Phase 1
az204-quiz-app/
│
├── backend/
│ ├── package.json
│ ├── server.js # Express server
│ └── questions.json # Hardcoded AZ-204 practice questions
│
├── frontend/
│ ├── package.json
│ ├── public/
│ │ └── index.html
│ └── src/
│ ├── App.js # Main React component
│ ├── index.js
│ └── components/
│ └── QuestionCard.js
│
└── README.md # Setup + deployment instructions


---

### Sample `questions.json`
Claude should generate a starter `questions.json` file with at least **6–8 App Service questions** and a few from other AZ-204 domains.  
Each question must include a `skillArea` field that maps to an **AZ-204 exam objective**.  

```json
[
  {
    "id": 1,
    "topic": "App Service",
    "skillArea": "Develop Azure compute solutions",
    "question": "Which of the following is NOT a valid App Service plan pricing tier?",
    "options": ["Free", "Shared", "PremiumV2", "Elastic Premium"],
    "answer": "Elastic Premium"
  },
  {
    "id": 2,
    "topic": "App Service",
    "skillArea": "Develop Azure compute solutions",
    "question": "Which deployment slot feature allows zero-downtime deployments?",
    "options": ["Traffic Manager", "Swap", "Scale-Out", "Backup"],
    "answer": "Swap"
  },
  {
    "id": 3,
    "topic": "App Service",
    "skillArea": "Develop Azure compute solutions",
    "question": "What setting in App Service allows you to configure environment variables for your app?",
    "options": ["Application Settings", "Scaling Settings", "Deployment Center", "Authentication"],
    "answer": "Application Settings"
  },
  {
    "id": 4,
    "topic": "App Service",
    "skillArea": "Develop Azure compute solutions",
    "question": "Which App Service scaling mode lets you automatically adjust instances based on CPU usage?",
    "options": ["Manual Scale", "Auto Scale", "Vertical Scale", "Premium Only"],
    "answer": "Auto Scale"
  },
  {
    "id": 5,
    "topic": "Functions",
    "skillArea": "Develop Azure compute solutions",
    "question": "Which Azure Functions hosting plan provides unlimited scale and a pay-per-execution billing model?",
    "options": ["Dedicated", "Consumption", "Premium", "App Service"],
    "answer": "Consumption"
  },
  {
    "id": 6,
    "topic": "Storage",
    "skillArea": "Develop for Azure storage",
    "question": "What type of Azure Storage should you use for storing large binary files like images or videos?",
    "options": ["Table Storage", "Queue Storage", "Blob Storage", "File Storage"],
    "answer": "Blob Storage"
  }
]

What to Deliver

- Fill in the backend Express code (server.js) that serves /questions from questions.json.
- Fill in the frontend React code to fetch and display one question with answer checking.
- Show me how to run the app locally.
- Provide clear steps to deploy backend and frontend to Azure App Service (single or separate apps).
- Save everything into a Markdown-formatted living doc so I can continue later with Phase 2.
- With each new iteration, add 5–10 more AZ-204 questions (well-distributed across exam objectives) to the questions.json file, so my question bank grows steadily as the project evolves.

⚡ Expected Outcome:

- Working Phase 1 code
- Deployment steps to Azure
- A polished Markdown doc I can come back to
- Starter set of App Service-heavy AZ-204 questions with exam objective tags
- Automatic question bank expansion over time