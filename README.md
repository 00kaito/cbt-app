# MindBridge - Mental Health Therapy Application

## Overview

MindBridge is a comprehensive mental health application designed for both psychologists and patients. It integrates mood monitoring with Cognitive Behavioral Therapy (CBT) tools, specifically the ABC schema for thought analysis. The platform enables patients to track their emotional states, analyze thought patterns, and receive AI-powered insights while allowing therapists to monitor patient progress in real-time.

## Features

- **Dual User System**: Separate dashboards and functionality for patients and therapists
- **Mood Tracking**: Custom mood scales with behavioral indicators and drag-and-drop functionality
- **ABC Schema Analysis**: Cognitive Behavioral Therapy thought record system with AI analysis
- **Exercise Management**: Built-in and custom therapeutic exercises with completion tracking
- **Therapist-Patient Relationships**: Email-based assignment system with secure data sharing
- **Data Synchronization**: Patient data updates are reflected in therapist views through query invalidation
- **Polish Language Interface**: Complete Polish localization

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API key (for AI analysis features)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd mindbridge
npm install
```

### 2. Database Setup

#### Option A: Replit (set DATABASE_URL explicitly)
On Replit you must provide a PostgreSQL connection string:
1. Create a Postgres database (e.g., Neon, Supabase, Railway)
2. In Replit Secrets, add DATABASE_URL with the full connection string
3. Also set SESSION_SECRET and (optional) OPENAI_API_KEY
4. Verify the connection: `psql "$DATABASE_URL" -c "SELECT 1;"`
5. Initialize tables: `npm run db:push`

#### Option B: Local PostgreSQL Setup
1. Install PostgreSQL locally
2. Create a new database:
```sql
CREATE DATABASE mindbridge;
```
3. Set up environment variables (see step 3)

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mindbridge
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=mindbridge

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Session Configuration (generate a random string)
SESSION_SECRET=your_session_secret_here
```

### 4. Database Schema Migration

```bash
# Push schema to database (creates tables)
npm run db:push

# Note: Only db:push is available; migrations generation script is not defined.
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000` by default.

**Port Configuration**: The port can be changed by setting the `PORT` environment variable (defaults to 5000 if not set).

## Docker Setup (Alternative)

### Prerequisites
- Docker Engine (20.10+)
- Docker Compose (2.0+)

### Quick Docker Setup

1. **Prepare environment configuration**:
```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit .env with your configuration:
# - Set POSTGRES_PASSWORD to a secure password
# - Set SESSION_SECRET to a secure key (32+ characters)
# - Optionally add OPENAI_API_KEY for AI features
```

2. **Start the application**:
```bash
# Start database and application services
docker-compose up -d

# Run database migrations to create tables
docker-compose --profile tools run migrate

# Check if services are running
docker-compose ps
```

3. **Access the application**:
- Application: http://localhost:5000
- Database: localhost:5432 (for debugging)

### Docker Management Commands

```bash
# View application logs
docker-compose logs -f app

# View database logs  
docker-compose logs database

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart just the application
docker-compose restart app

# Update and rebuild the application
docker-compose build app
docker-compose up -d app
```

### Production Docker Deployment

```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d

# Run migrations for production
docker-compose -f docker-compose.prod.yml --profile tools run migrate
```

## Quickstart Guide

After completing the setup above, follow these steps to test the application:

### 1. Create Test Accounts

**Create a Patient Account:**
1. Go to `http://localhost:5000`
2. Click "Register" 
3. Fill in patient details (role will default to 'patient')
4. Login with the new account

**Create a Therapist Account:**
1. Logout and register another account
2. The role defaults to 'patient', but you can change it in the database:
```sql
UPDATE users SET role = 'therapist' WHERE email = 'your-therapist-email@example.com';
```

### 2. Set Up Patient Data

**As the Patient:**
1. Go to Settings → Create a custom mood scale
2. Add mood entries in the Dashboard
3. Create ABC thought records in the ABC Schemas section
4. Complete some exercises

### 3. Link Therapist and Patient

**As the Therapist:**
1. Login to the therapist dashboard
2. Click "Dodaj pacjenta" (Add Patient)
3. Enter the patient's email address
4. The patient will now appear in your patient list

### 4. Test Data Sharing

**As the Patient:**
1. In ABC Schemas, click "Udostępnij terapeucie" (Share with Therapist)
2. The shared data will appear in the therapist's view

**As the Therapist:**
1. Click "Zobacz postępy" (View Progress) on the patient
2. You should see mood levels with custom scale names (e.g., "2/8 - Głęboka depresja")
3. Check "Udostępnione elementy" for new shared items count

## API Reference

### Authentication Endpoints

**POST /api/register**
```javascript
// Request body
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "Jan",
  "lastName": "Kowalski"
}

// Response
{
  "id": "user-uuid",
  "email": "user@example.com", 
  "firstName": "Jan",
  "lastName": "Kowalski",
  "role": "patient"
}
```

**POST /api/login**
```javascript
// Request body  
{
  "email": "user@example.com",
  "password": "securepassword"
}

// Response (200 OK)
{
  "id": "user-uuid",
  "email": "user@example.com",
  "firstName": "Jan", 
  "lastName": "Kowalski",
  "role": "patient"
}
```

**GET /api/user**
- Returns current logged-in user info or 401 if not authenticated

**POST /api/logout**
- Destroys session and logs out user

### Patient Endpoints
**Auth**: Session cookie required for all patient endpoints.
**Errors**: 401 unauthenticated, 403 unauthorized where applicable.

**GET /api/mood-scales**
- Returns user's custom mood scales

**POST /api/mood-scales**
```javascript
// Request body
{
  "name": "My Mood Scale",
  "levels": [
    {
      "level": 1,
      "title": "Głęboka depresja", 
      "description": "...",
      "category": "depression",
      "behavioralIndicators": ["Spowolnione ruchy", "Niska energia"]
    }
    // ... more levels
  ]
}
```

**GET /api/mood-entries**
- Returns user's mood entries with scale information
- Supports optional query param `?limit=<number>`

**POST /api/mood-entries**  
```javascript
// Request body
{
  "moodLevel": 2,
  "moodScaleId": "scale-uuid",
  "notes": "Optional notes"
}
```

**GET /api/abc-schemas**
- Returns user's ABC thought records

**POST /api/abc-schemas**
```javascript
// Request body
{
  "activatingEvent": "Description of triggering event",
  "beliefs": "Thoughts and beliefs about the event", 
  "consequences": "Emotional and behavioral consequences",
  "moodBefore": 3,
  "moodAfter": 5
}
```

### Therapist Endpoints
**Auth**: Session cookie required. Must be logged in as therapist role.
**Errors**: 401 unauthenticated, 403 unauthorized (wrong role or unassigned patient).

**GET /api/therapist/patients**
- Returns assigned patients with mood summaries and new item counts

**POST /api/therapist/patients**
```javascript
// Request body
{
  "patientEmail": "patient@example.com"
}
```

**DELETE /api/therapist/patients/:patientId**
- Removes patient assignment

**GET /api/therapist/patient/:patientId**  
- Returns detailed patient information (updates visit timestamp)

**GET /api/therapist/patient/:patientId/mood-entries**
- Returns patient's mood history  

**GET /api/therapist/patient/:patientId/shared-data**
- Returns data the patient has shared with this therapist

## Authentication & Session Management

### Session-Based Authentication
The application uses Express sessions with PostgreSQL storage:

- Sessions are stored in the database using `connect-pg-simple`
- Session cookies are HTTP-only and secure in production
- Session duration is managed by Express session configuration
- Users remain logged in until logout or session expiration

### Role-Based Access Control
- **Patients**: Can only access their own data
- **Therapists**: Can access assigned patients' shared data only
- Route protection is enforced on both frontend and backend

### Password Security
- Passwords are hashed using Node.js built-in `scrypt` function
- Each password uses a unique salt
- Plain text passwords are never stored

## Project Structure

```
mindbridge/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── lib/           # Utility functions and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express application
│   ├── index.ts           # Main server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations and business logic
│   └── vite.ts           # Vite development server integration
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and type definitions
└── drizzle.config.ts      # Database configuration
```

## Developer Documentation

### Architecture Overview

MindBridge follows a modern full-stack architecture with clear separation between frontend and backend responsibilities:

- **Frontend**: React SPA with TypeScript, handling all user interactions and UI logic
- **Backend**: Express.js API server responsible for data persistence and external API calls
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with Passport.js

### Core Technologies

#### Frontend Stack
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling
- **Tailwind CSS** with Shadcn/ui for styling and components
- **Radix UI** for accessible component primitives

#### Backend Stack
- **Node.js** with Express.js for the API server
- **TypeScript** for type safety across the entire stack
- **Drizzle ORM** with PostgreSQL for database operations
- **Passport.js** for authentication middleware
- **OpenAI API** integration for CBT analysis

### Database Schema

The application uses a normalized PostgreSQL database with the following main entities:

#### Core Tables

**users**
- Stores both patient and therapist accounts
- Role-based access control (`role`: 'patient' | 'therapist')
- Authentication credentials with hashed passwords

**therapist_patients**
- Many-to-many relationship between therapists and patients
- Enables one therapist to manage multiple patients

**mood_scales**
- Custom mood tracking scales created by patients
- JSON field storing scale levels with behavioral indicators
- Each patient can have multiple scales

**mood_entries**
- Individual mood recordings linked to specific scales
- Timestamps for trend analysis

**abc_schemas**
- CBT thought records following the ABC model
- AI analysis results stored as JSON
- Sharing mechanism with therapists

**exercises & therapist_exercises**
- Built-in therapeutic exercises and custom therapist-created exercises
- Categorized by therapeutic approach and difficulty

**exercise_completions**
- Tracks patient completion of exercises
- Mood before/after measurements
- Effectiveness ratings

**shared_data**
- Manages data sharing between patients and therapists
- Tracks what information patients have shared

**therapist_patient_visits**
- Tracks when therapists last viewed patient data
- Enables "new items since last visit" counters

### Key Classes and Functions

#### Storage Layer (`server/storage.ts`)

**DatabaseStorage Class**
The main data access layer implementing the `IStorage` interface:

```typescript
class DatabaseStorage implements IStorage {
  // User Management
  async createUser(userData: InsertUser): Promise<User>
  async getUserByEmail(email: string): Promise<User | null>
  async getUserById(id: string): Promise<User | null>

  // Mood Tracking
  async createMoodScale(scaleData: InsertMoodScale): Promise<MoodScale>
  async getMoodScales(userId: string): Promise<MoodScale[]>
  async createMoodEntry(entryData: InsertMoodEntry): Promise<MoodEntry>
  async getMoodEntries(userId: string): Promise<MoodEntry[]>

  // ABC Schema Management
  async createAbcSchema(schemaData: InsertAbcSchema): Promise<AbcSchema>
  async getAbcSchemas(userId: string): Promise<AbcSchema[]>
  async updateAbcSchema(id: string, updates: Partial<AbcSchema>): Promise<AbcSchema>
  async deleteAbcSchema(id: string): Promise<void>

  // Exercise System
  async getExercises(): Promise<Exercise[]>
  async createTherapistExercise(exerciseData: InsertTherapistExercise): Promise<TherapistExercise>
  async createExerciseCompletion(completionData: InsertExerciseCompletion): Promise<ExerciseCompletion>

  // Therapist-Patient Relationships
  async assignPatientToTherapist(therapistId: string, patientEmail: string): Promise<void>
  async getTherapistPatients(therapistId: string): Promise<User[]>
  async getPatientTherapists(patientId: string): Promise<User[]>

  // Data Sharing
  async shareDataWithTherapist(patientId: string, therapistId: string, dataType: string, dataId: string): Promise<void>
  async getSharedDataForTherapist(therapistId: string, patientId: string): Promise<SharedDataResult>

  // Visit Tracking
  async updateTherapistPatientVisit(therapistId: string, patientId: string): Promise<void>
  async getPatientSummaryForTherapist(patientId: string, therapistId: string): Promise<PatientSummary>
}
```

#### Key Helper Functions

**getLevelName()** - Extracts human-readable level names from mood scale definitions
**getMoodColorClass()** - Determines color coding based on mood values and scale ranges

### API Routes (`server/routes.ts`)

#### Authentication Routes
- `POST /api/login` - User authentication
- `POST /api/logout` - Session termination
- `POST /api/register` - New user registration
- `GET /api/user` - Current user information

#### Patient Routes
- `GET /api/mood-scales` - User's mood scales
- `POST /api/mood-scales` - Create new mood scale
- `GET /api/mood-entries` - User's mood entries
- `POST /api/mood-entries` - Record new mood entry
- `GET /api/abc-schemas` - User's ABC thought records
- `POST /api/abc-schemas` - Create new ABC schema
- `PUT /api/abc-schemas/:id` - Update ABC schema
- `DELETE /api/abc-schemas/:id` - Delete ABC schema

#### Therapist Routes
- `GET /api/therapist/patients` - Assigned patients list
- `POST /api/therapist/patients` - Assign new patient
- `DELETE /api/therapist/patients/:patientId` - Remove patient assignment
- `GET /api/therapist/patient/:patientId` - Individual patient details
- `GET /api/therapist/patient/:patientId/mood-entries` - Patient's mood history
- `GET /api/therapist/patient/:patientId/shared-data` - Shared patient data

#### Exercise Routes
- `GET /api/exercises` - Built-in exercises
- `POST /api/exercise-completions` - Record exercise completion
- `GET /api/therapist/exercises` - Therapist's custom exercises
- `POST /api/therapist/exercises` - Create custom exercise

### Frontend Architecture

#### Page Components

**Dashboard Pages**
- `client/src/pages/dashboard.tsx` - Patient dashboard
- `client/src/pages/therapist-dashboard.tsx` - Therapist dashboard

**Feature Pages**
- `client/src/pages/mood-tracking.tsx` - Mood scale management and entry
- `client/src/pages/abc-schemas.tsx` - CBT thought record management
- `client/src/pages/exercises.tsx` - Exercise browsing and completion
- `client/src/pages/patient-detail.tsx` - Therapist view of patient details

#### Key Components

**MyAbcSchemas** (`client/src/components/my-abc-schemas.tsx`)
- Displays user's ABC thought records
- Handles sharing with therapists
- Manages edit/delete operations

**AbcSchemaForm** (`client/src/components/abc-schema-form.tsx`)
- Form for creating/editing ABC schemas
- Integrates with OpenAI for analysis
- Mood before/after tracking

**Navigation** (`client/src/components/navigation.tsx`)
- Role-aware navigation menu
- Authentication state management

#### State Management

The application uses TanStack Query for server state management:

```typescript
// Example query configuration
const { data: abcSchemas, isLoading } = useQuery({
  queryKey: ['/api/abc-schemas'],
  enabled: !!user,
});

// Example mutation with cache invalidation
const createSchemaMutation = useMutation({
  mutationFn: async (schemaData) => {
    const res = await apiRequest('POST', '/api/abc-schemas', schemaData);
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/abc-schemas'] });
  },
});
```

### AI Integration

The application integrates with OpenAI's GPT models for cognitive behavioral therapy analysis:

#### Analysis Process
1. Patient completes ABC thought record
2. Data sent to OpenAI API with structured prompts
3. AI identifies cognitive distortions and recommends exercises
4. Results stored in database and displayed to patient/therapist

#### OpenAI Configuration
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Analysis prompt structure focuses on CBT principles
const analysisPrompt = `Analyze this thought record using CBT principles...`;
```

### Authentication & Security

#### Session Management
- Express sessions stored in PostgreSQL
- Secure cookie configuration
- CSRF protection considerations

#### Password Security
- Scrypt-based password hashing
- Salt generation for each password
- Secure password storage practices

#### Data Access Control
- Role-based access control
- Patients can only access their own data
- Therapists can only access assigned patients' shared data

### Development Guidelines

#### Code Style
- TypeScript strict mode enabled
- Consistent naming conventions (camelCase for variables, PascalCase for components)
- Comprehensive type definitions in `shared/schema.ts`

#### Database Operations
- All queries use Drizzle ORM for type safety
- Transactions for data consistency
- Proper error handling and rollbacks

#### API Design
- RESTful endpoint conventions
- Consistent error response format
- Input validation using Zod schemas

#### Frontend Patterns
- Component composition over inheritance
- Custom hooks for business logic
- Controlled components with React Hook Form

### Testing Considerations

The application structure supports various testing approaches:

- **Unit Testing**: Individual functions and components
- **Integration Testing**: API endpoints and database operations  
- **E2E Testing**: Complete user workflows

Test files should follow the pattern: `*.test.ts` or `*.test.tsx`

### Performance Optimizations

#### Frontend
- Code splitting by route
- Query caching with TanStack Query
- Optimistic updates for better UX
- Component memoization where beneficial

#### Backend
- Database query optimization
- Connection pooling for PostgreSQL
- Caching strategies for frequently accessed data

#### Database
- Proper indexing on foreign keys and frequently queried columns
- Query optimization using Drizzle's query builder
- Pagination for large datasets

### Deployment Considerations

#### Environment Configuration
- Separate configurations for development/production
- Environment variable validation
- Database migration strategies

#### Security
- HTTPS enforcement in production
- Secure session cookie configuration
- Rate limiting for API endpoints
- Input sanitization and validation

### Contributing Guidelines

1. **Branch Naming**: Use descriptive branch names (e.g., `feature/mood-tracking`, `fix/authentication-bug`)
2. **Commit Messages**: Follow conventional commit format
3. **Code Review**: All changes require review before merging
4. **Testing**: Write tests for new functionality
5. **Documentation**: Update relevant documentation for API changes

### Troubleshooting

#### Common Issues

**DATABASE_URL Missing/Invalid**
```bash
# If you see: "DATABASE_URL, ensure the database is provisioned"
echo $DATABASE_URL  # Should show your connection string

# Test database connection
psql "$DATABASE_URL" -c "SELECT 1;"

# If connection works, initialize tables
npm run db:push

# For Replit: Add DATABASE_URL to Secrets tab
# For local: Ensure PostgreSQL is running and database exists
```

**OpenAI API Issues**
- The app will work without OpenAI key, but AI analysis will be disabled
- Check API key format: should start with `sk-`
- Check billing and rate limits on OpenAI dashboard
- Look for "OpenAI API" errors in server logs

**Authentication Problems**
```bash  
# Check session secret (should be set)
echo $SESSION_SECRET

# Clear sessions from database
psql $DATABASE_URL -c "DELETE FROM session;"
```

**Mood Display Issues**
- If therapist sees "nie śledzony" (not tracked), patient needs to create mood entries
- If patient mood shows wrong scale, check if multiple mood scales exist
- Color coding adjusts automatically based on patient's scale size

**Port/Network Issues** 
```bash
# Check if port is in use
lsof -i :5000

# Try different port
PORT=3000 npm run dev
```

**Build Issues**
```bash
# Clear everything and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors  
npm run check
```

#### Development Tips

**Database Inspection**
```bash
# Connect to database
psql $DATABASE_URL

# View all tables
\dt

# Check user roles
SELECT email, role FROM users;

# Check therapist-patient relationships
SELECT t.email as therapist, p.email as patient 
FROM therapist_patients tp
JOIN users t ON tp.therapist_id = t.id  
JOIN users p ON tp.patient_id = p.id;
```

**Testing Authentication**
1. Register two accounts manually
2. Update one to be a therapist in database
3. Link them via therapist dashboard
4. Test data sharing flow

**AI Analysis Testing**
- Create ABC schema without OpenAI key (should work, no analysis)
- Add OpenAI key and update schema (should get analysis results)
- Check browser network tab for API errors

### Support and Resources

- **Database Schema**: Reference `shared/schema.ts` for complete type definitions
- **API Documentation**: See inline comments in `server/routes.ts`
- **Component Library**: Shadcn/ui documentation for UI components
- **State Management**: TanStack Query documentation for data fetching patterns

For additional support or questions about the codebase architecture, refer to the inline code comments and type definitions throughout the application.