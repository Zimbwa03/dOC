# Replit.md

## Overview

Docdot is an AI-powered healthcare bridge system that connects doctors and patients through intelligent automation. The application features real-time consultation assistance with voice recognition, AI-powered medical insights, patient care plan generation, and comprehensive analytics dashboards. The system is built as a full-stack TypeScript application with React frontend and Express backend, designed to enhance medical consultations through technology while maintaining the human touch in healthcare.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses **React 18** with **TypeScript** and **Vite** as the build tool. The UI is built with **Tailwind CSS** and **shadcn/ui** components following a "new-york" design style with a medical-focused color scheme (primary blue #5BA7DB). The app uses **wouter** for client-side routing and **TanStack Query** for server state management. The frontend supports real-time features and responsive design with mobile-first approach.

### Backend Architecture
The server runs on **Express.js** with **TypeScript** in ES module format. It serves both the API endpoints and static files in production. The backend handles file uploads with **multer**, implements WebSocket connections for real-time features, and includes comprehensive middleware for logging and error handling. The API follows RESTful conventions with dedicated routes for authentication, consultations, and medical services.

### Database Layer
The application uses **Drizzle ORM** with **PostgreSQL** as the primary database. The schema includes tables for doctors, patients, consultations, health plans, AI interactions, and analytics. Database migrations are managed through Drizzle Kit. The system uses **Neon Database** as the PostgreSQL provider with connection pooling through the `@neondatabase/serverless` package.

### AI Integration Strategy
The system integrates multiple AI services for comprehensive medical assistance:
- **Google Gemini API** for primary medical analysis and diagnostic suggestions
- **Fine-tuned Mistral 7B** (via Hugging Face) for specialized medical reasoning
- **DeepSeek API** for advanced medical research and analysis
- **Web Speech API** for voice recognition and transcription
- **Tavily API** and **SerpAPI** for medical literature search and research

### Authentication & Authorization
The application implements custom authentication for both doctors and patients. Doctor registration includes voice sample upload for future voice verification. Patient authentication is simplified with phone number and name verification. Session management is handled through browser localStorage with JWT-style tokens.

### Real-time Communication
The system supports real-time features through **WebSocket** connections for live consultation updates, **Supabase real-time subscriptions** for data synchronization, and **WhatsApp Business API** integration for patient notifications and reminders.

### File Storage & Processing
Medical files, voice samples, and consultation recordings are handled through **multer** middleware with configurable storage backends. The system supports audio file processing for voice recognition and analysis features.

## External Dependencies

### AI & Machine Learning Services
- **Google Gemini API** - Primary AI for medical analysis and diagnostic suggestions
- **Hugging Face Models** - Fine-tuned Mistral 7B for specialized medical reasoning
- **DeepSeek API** - Advanced medical research and clinical decision support
- **Web Speech API** - Browser-based voice recognition and transcription

### Medical Research & Data
- **Tavily API** - Medical journal and literature search
- **SerpAPI** - PubMed and medical database access
- **Custom medical research** - Integrated medical reference tools

### Communication & Messaging
- **WhatsApp Business API** - Patient notifications, reminders, and health plan delivery
- **Supabase Real-time** - Live consultation updates and data synchronization
- **WebSocket** - Real-time consultation room features

### Database & Storage
- **Neon Database** - PostgreSQL hosting with serverless capabilities
- **Supabase** - Backend-as-a-Service for additional real-time features
- **Local file storage** - Development file uploads (configurable for cloud storage)

### Development & Build Tools
- **Vite** - Frontend build tool with React plugin
- **TypeScript** - Type safety across frontend and backend
- **Drizzle Kit** - Database schema management and migrations
- **ESBuild** - Backend bundling for production deployment

### UI & Styling Framework
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless component primitives for accessibility
- **shadcn/ui** - Pre-built component library with medical theme customization
- **Lucide React** - Icon system for medical and general interface elements