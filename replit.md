# MindBridge - Mental Health Therapy Application

## Overview

MindBridge is a comprehensive mental health application designed for both psychologists and patients. It integrates mood monitoring with Cognitive Behavioral Therapy (CBT) tools, specifically the ABC schema for thought analysis. The platform enables patients to track their emotional states, analyze thought patterns, and receive AI-powered insights while allowing therapists to monitor patient progress in real-time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL sessions using connect-pg-simple
- **Password Security**: Scrypt hashing with salt for secure password storage
- **API Design**: RESTful endpoints with standardized error handling

### Database Design
- **Primary Database**: PostgreSQL using Neon serverless
- **ORM**: Drizzle ORM with type-safe queries
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Key Tables**:
  - Users (patients and therapists with role-based access)
  - Mood scales (customizable mood tracking systems)
  - Mood entries (daily mood recordings)
  - ABC schemas (thought analysis records)
  - Exercises (CBT therapeutic exercises)
  - Exercise completions (tracking patient engagement)
  - Therapist-patient relationships
  - Shared data system for secure information exchange

### Authentication & Authorization
- **Strategy**: Session-based authentication with secure cookies
- **Role-Based Access**: Separate patient and therapist user roles with different dashboard experiences
- **Security**: CSRF protection, secure session management, password hashing
- **Data Isolation**: Users can only access their own data or assigned patient data (for therapists)

### AI Integration
- **Provider**: OpenAI GPT-5 for cognitive behavioral therapy analysis
- **Purpose**: Analyze ABC thought records to identify cognitive distortions
- **Output**: Structured analysis with confidence scores and exercise recommendations
- **Implementation**: Serverless function approach with error handling and fallbacks

### Real-Time Features
- **Data Sharing**: Instant synchronization of patient data with assigned therapists
- **Progress Tracking**: Real-time mood trends and exercise completion monitoring
- **Collaborative Tools**: Shared session preparation and progress review capabilities

### Development Environment
- **Hot Reloading**: Vite development server with HMR
- **Error Handling**: Runtime error overlay for development
- **Type Safety**: Comprehensive TypeScript configuration with strict mode
- **Code Quality**: Shared types between client and server for consistency

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Connection Management**: WebSocket support for serverless environments

### AI Services
- **OpenAI API**: GPT-5 model for cognitive behavioral therapy analysis
- **Analysis Features**: Cognitive distortion identification and therapeutic exercise recommendations

### Authentication Infrastructure
- **Session Management**: PostgreSQL-backed session storage for scalability
- **Password Security**: Node.js crypto module for secure password handling

### UI Components
- **Radix UI**: Accessible component primitives for complex interactions
- **Shadcn/ui**: Pre-built component library with consistent design system
- **Lucide Icons**: Comprehensive icon library for interface elements

### Development Tools
- **Vite**: Fast build tool with TypeScript support and plugin ecosystem
- **Replit Integration**: Development environment optimizations and error reporting
- **PostCSS**: CSS processing with Tailwind CSS compilation