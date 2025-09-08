# AZ-204 Practice Quiz Application

A comprehensive practice quiz application for the Azure Developer Associate (AZ-204) certification exam. Built with Node.js/Express backend and React frontend, designed for deployment on Azure App Service.

## 📋 Project Status: Phase 1 Complete

### ✅ Phase 1 - Basic Quiz Application
- [x] Express API backend with hardcoded questions
- [x] React frontend with question display and answer checking
- [x] 12 AZ-204 practice questions across multiple domains
- [x] Local development setup
- [x] Azure App Service deployment documentation

### 🚧 Future Phases
- [ ] **Phase 2**: Azure SQL Database integration for dynamic questions
- [ ] **Phase 3**: User authentication with Azure AD B2C
- [ ] **Phase 4**: User progress tracking and statistics
- [ ] **Phase 5**: Advanced monitoring with Application Insights

---

## 🏗️ Project Structure

```
az-204-quiz-app/
│
├── backend/                    # Express API server
│   ├── package.json           # Backend dependencies
│   ├── server.js              # Main server file
│   └── questions.json         # AZ-204 practice questions
│
├── frontend/                  # React application
│   ├── package.json          # Frontend dependencies
│   ├── public/
│   │   └── index.html        # HTML template
│   └── src/
│       ├── App.js            # Main React component
│       ├── index.js          # React entry point
│       └── components/
│           └── QuestionCard.js # Question display component
│
├── README.md                  # This file
├── DEPLOYMENT.md             # Azure deployment guide
└── claude_az204_quiz_phase1_prompt.md # Original requirements
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Git

### Local Development Setup

1. **Clone and setup the project:**
   ```bash
   git clone <your-repo-url>
   cd az-204-quiz-app
   ```

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

3. **Start the backend API:**
   ```bash
   npm run dev-backend
   ```
   
   Backend will run on `http://localhost:3001`

4. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev-frontend
   ```
   
   Frontend will run on `http://localhost:3000`

5. **Open your browser:**
   Navigate to `http://localhost:3000` to use the quiz application

### Development Scripts

**Root Level Commands:**
- `npm run install-all` - Install dependencies for both backend and frontend
- `npm run dev-backend` - Start backend with hot reload
- `npm run dev-frontend` - Start frontend with hot reload
- `npm run test-all` - Run all tests (backend + frontend)
- `npm run test-coverage` - Run tests with coverage reports
- `npm run build-frontend` - Build production frontend bundle

**Backend Commands:**
- `npm start` - Start production server
- `npm run dev` - Start with nodemon for development
- `npm test` - Run backend tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

**Frontend Commands:**
- `npm start` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm test` - Run frontend tests
- `npm run test:coverage` - Run tests with coverage

### Testing

The application includes comprehensive test suites for both backend and frontend:

**Backend Testing (Jest + Supertest):**
- API endpoint testing
- Data validation testing  
- Error handling testing
- Question data structure validation
- AZ-204 certification alignment testing

**Frontend Testing (React Testing Library + Jest):**
- Component rendering testing
- User interaction testing
- API integration testing (mocked)
- Accessibility testing
- State management testing

**Run Tests:**
```bash
# Run all tests
npm run test-all

# Run with coverage reports
npm run test-coverage

# Run backend tests only
cd backend && npm test

# Run frontend tests only  
cd frontend && npm test

# Run tests in watch mode for development
cd backend && npm run test:watch
cd frontend && npm test
```

**Coverage Thresholds:**
- **Backend**: 80% coverage required (branches, functions, lines, statements)
- **Frontend**: 75% coverage required (branches, functions, lines, statements)

---

## 🌐 API Endpoints

### Backend API (Port 3001)

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/` | GET | API information and endpoints |
| `/api/health` | GET | Health check with question count |
| `/api/questions` | GET | Get all questions |
| `/api/questions/random` | GET | Get a random question |
| `/api/questions/topic/:topic` | GET | Get questions by topic |

### Example API Responses

**Health Check:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "questionsCount": 12
}
```

**Random Question:**
```json
{
  "id": 1,
  "topic": "App Service",
  "skillArea": "Develop Azure compute solutions",
  "question": "Which of the following is NOT a valid App Service plan pricing tier?",
  "options": ["Free", "Shared", "PremiumV2", "Elastic Premium"],
  "answer": "Elastic Premium",
  "explanation": "Elastic Premium is not a valid App Service plan tier..."
}
```

---

## 📚 Question Bank

### Current Questions: 56 total

**Topics Coverage:**
- **App Service** (50 questions): Deployment slots, scaling, authentication, custom domains, pricing tiers, traffic routing, auto-heal, HTTPS configuration, deployment methods, Always On, network isolation, ZIP deployment, canary deployment, WebJobs, logging, auto-scaling, authentication flows, health checks, managed identity, Key Vault integration, and more
- **Azure Functions** (2 questions): Hosting plans, execution timeouts
- **Storage** (2 questions): Blob storage, access tiers
- **Cosmos DB** (1 question): Consistency levels
- **Key Vault** (1 question): Secret size limits

### AZ-204 Exam Skill Areas Covered:
- ✅ Develop Azure compute solutions (52 questions)
- ✅ Develop for Azure storage (3 questions)
- ✅ Implement Azure security (1 question)
- ⏳ Connect to and consume Azure services (Future phase)
- ⏳ Monitor, troubleshoot, and optimize Azure solutions (Future phase)

---

## 🎯 Features

### Current Features (Phase 1)
- **Random Question Display**: Get practice questions randomly from the bank
- **Multiple Choice Interface**: Clean, intuitive question interface
- **Immediate Feedback**: See correct answers with explanations
- **Progress Tracking**: Basic session statistics (correct/total/accuracy)
- **Responsive Design**: Works on desktop and mobile devices
- **Topic-based Filtering**: API supports filtering by topic
- **Error Handling**: Graceful handling of API failures

### Planned Features (Future Phases)
- User accounts and persistent progress tracking
- Expanded question bank with 100+ questions
- Timed practice exams
- Detailed performance analytics
- Study mode with explanations
- Bookmarking difficult questions

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=3001
NODE_ENV=development
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:3001
```

**Production Frontend (.env.production):**
```env
REACT_APP_API_URL=https://your-api-domain.azurewebsites.net
```

---

## 🚀 Deployment

### Azure App Service Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:

- Single App Service deployment
- Separate backend/frontend App Services
- Azure Static Web Apps integration
- Environment configuration
- Monitoring setup
- Troubleshooting guide

### Quick Deploy Commands

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-az204-quiz --location "East US"

# Create and deploy (see DEPLOYMENT.md for complete steps)
```

---

## 🧪 Testing

### Manual Testing Checklist

**Backend API:**
- [ ] Health endpoint returns correct question count
- [ ] Random question endpoint returns valid question structure
- [ ] All questions endpoint returns full array
- [ ] Topic filtering works correctly
- [ ] CORS is configured for frontend domain
- [ ] All tests pass with `npm test`
- [ ] Coverage meets 80% threshold

**Frontend Application:**
- [ ] Page loads without console errors
- [ ] Questions display with proper formatting
- [ ] Answer selection works correctly
- [ ] Submit button enables/disables properly
- [ ] Correct/incorrect feedback shows appropriately
- [ ] Statistics update after each question
- [ ] Next question button loads new question
- [ ] Error states display when API is unavailable
- [ ] All tests pass with `npm test`
- [ ] Coverage meets 75% threshold

### Automated Testing
✅ **Backend Testing (Jest + Supertest)**
- Complete API endpoint testing
- Data validation and structure testing
- Error handling and edge cases
- AZ-204 certification content validation
- Coverage: 80% minimum threshold

✅ **Frontend Testing (React Testing Library)**
- Component rendering and interaction
- User workflow testing
- API integration (mocked)
- Accessibility compliance
- State management validation
- Coverage: 75% minimum threshold

**Test Commands:**
```bash
# Quick test run
npm run test-all

# Detailed coverage report
npm run test-coverage

# Individual test suites
cd backend && npm test
cd frontend && npm test
```

---

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure backend CORS is configured with frontend URL
- Check that API_URL environment variable is correct

**Questions Not Loading:**
- Verify backend server is running on correct port
- Check browser network tab for API call failures
- Confirm `questions.json` file exists and is valid JSON
- Run backend tests to verify API functionality: `cd backend && npm test`

**Build Failures:**
- Verify Node.js version compatibility (16+)
- Clear node_modules and reinstall dependencies
- Check for any TypeScript or ESLint errors
- Run tests to identify issues: `npm run test-all`

**Test Failures:**
- Check if all dependencies are installed: `npm run install-all`
- Verify Node.js version meets requirements (16+)
- For backend: Check if `questions.json` has valid structure
- For frontend: Ensure all React Testing Library dependencies are installed
- Clear Jest cache: `npx jest --clearCache`

**Coverage Issues:**
- Run individual test suites to identify gaps: `npm run test-coverage`
- Check uncovered lines in coverage reports
- Add tests for missing functionality

**Azure Deployment Issues:**
- Ensure correct Node.js runtime version in App Service
- Verify environment variables are set correctly
- Check App Service logs for detailed error messages
- Run tests locally before deployment to catch issues early

---

## 🤝 Contributing

### Adding New Questions

To expand the question bank:

1. Edit `backend/questions.json`
2. Follow the existing question structure:
   ```json
   {
     "id": [next_sequential_number],
     "topic": "[App Service|Functions|Storage|etc.]",
     "skillArea": "[AZ-204 exam objective]",
     "question": "[Question text]",
     "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
     "answer": "[Correct option]",
     "explanation": "[Detailed explanation]"
   }
   ```
3. Ensure questions cover all AZ-204 exam domains
4. Test locally before deployment

### Development Guidelines

- Follow existing code style and patterns
- Write tests for all new features (TDD approach)
- Maintain coverage thresholds (80% backend, 75% frontend)
- Add error handling for new features
- Update documentation for any API changes
- Run full test suite before committing: `npm run test-all`
- Test all changes locally before committing

### Test-Driven Development

This project follows TDD principles:

1. **Write tests first** for new functionality
2. **Make tests pass** with minimal code
3. **Refactor** while keeping tests green
4. **Maintain coverage** above threshold requirements

**Adding New Features:**
```bash
# 1. Write tests for new feature
cd backend && npm run test:watch  # Keep running while developing

# 2. Implement feature to make tests pass
# 3. Verify all tests still pass
npm run test-all

# 4. Check coverage
npm run test-coverage
```

---

## 📈 Roadmap

### Phase 2: Database Integration
- Migrate from JSON file to Azure SQL Database
- Admin interface for question management
- Dynamic question loading and caching

### Phase 3: User System
- Azure AD B2C authentication
- User profiles and progress tracking
- Study session history

### Phase 4: Enhanced Features
- Timed practice exams
- Performance analytics and weak area identification
- Question difficulty ratings
- Spaced repetition algorithm

### Phase 5: Production Readiness
- Comprehensive monitoring with Application Insights
- CI/CD pipeline with Azure DevOps
- Load testing and performance optimization
- Mobile app development

---

## 📄 License

This project is intended for educational purposes for AZ-204 certification preparation.

---

## 🙋‍♂️ Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the deployment documentation
3. Check existing issues in the repository
4. Create a new issue with detailed description

---

**Happy studying for your AZ-204 certification! 🎓**

---

*Last updated: January 2025 | Phase 1 Complete*