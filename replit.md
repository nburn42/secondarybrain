# Project Management System - Replit Guide

## Overview

This is a full-stack project management system built with React, Express.js, and PostgreSQL. The application provides a comprehensive dashboard for managing projects, tasks, and approval workflows with a modern, responsive interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api` prefix
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (using Neon serverless for cloud deployment)
- **Session Management**: Built-in session handling for development

### Database Design
- **Projects**: Core entity with name, description, status, and timestamps
- **Tasks**: Linked to projects with status, numeric priority (0-10 scale), and approval workflow
- **GitHub Repositories**: Associated with projects for code integration
- **Approval Queue**: Manages task approval workflow with reviewer tracking

## Key Components

### Client-Side Components
- **Layout System**: Fixed sidebar navigation with main content area
- **Dashboard**: Statistics overview with project and task summaries
- **Project Management**: CRUD operations for projects with associated repositories
- **Task Management**: Full task lifecycle with status tracking and filtering
- **Approval System**: Interactive swipe-based approval interface using Framer Motion
- **UI Components**: Comprehensive component library with consistent styling

### Server-Side Components
- **Route Handlers**: Organized REST endpoints for all entities
- **Storage Layer**: Abstracted database operations with TypeScript interfaces
- **Database Connection**: Neon PostgreSQL with connection pooling
- **Middleware**: Request logging, JSON parsing, and error handling

## Data Flow

### Client to Server
1. React components use TanStack Query for data fetching
2. API requests go through centralized `apiRequest` helper
3. Form submissions use React Hook Form with Zod validation
4. Server responses update React Query cache automatically

### Server to Database
1. Express routes validate and process requests
2. Storage layer abstracts database operations
3. Drizzle ORM provides type-safe database queries
4. PostgreSQL handles data persistence with foreign key relationships

### Real-time Updates
- Query invalidation triggers automatic refetching
- Optimistic updates for better user experience
- Toast notifications for user feedback

## External Dependencies

### Frontend Libraries
- **UI Framework**: Radix UI primitives for accessibility
- **Animation**: Framer Motion for interactive gestures
- **Date Handling**: date-fns for date formatting
- **Icons**: Lucide React for consistent iconography
- **Form Validation**: Zod for runtime type checking

### Backend Libraries
- **Database**: Neon serverless PostgreSQL driver
- **ORM**: Drizzle with PostgreSQL dialect
- **Utilities**: Various Express middleware for common functionality

## Deployment Strategy

### Development Setup
- Vite dev server for hot module replacement
- Express server with middleware mode integration
- Automatic restart on server file changes
- Environment-based configuration

### Production Build
1. **Frontend**: Vite builds optimized static assets to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations handle schema updates
4. **Static Serving**: Express serves built frontend assets

### Environment Configuration
- Database URL required for PostgreSQL connection
- Automatic database provisioning check
- Development vs production environment detection
- Replit-specific optimizations and error handling

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with client, server, and shared code
   - **Rationale**: Simplifies development and deployment while maintaining separation
   - **Trade-off**: Slightly more complex build process but better code sharing

2. **Type-Safe Database**: Drizzle ORM with TypeScript
   - **Rationale**: Prevents runtime database errors and improves developer experience
   - **Alternative**: Could use raw SQL or other ORMs, but type safety is prioritized

3. **Component-Based UI**: shadcn/ui with Radix primitives
   - **Rationale**: Provides accessible, customizable components with consistent design
   - **Benefit**: Faster development with built-in accessibility features

4. **Server State Management**: TanStack Query over Redux
   - **Rationale**: Specialized for server state with caching, background updates
   - **Benefit**: Reduces boilerplate and provides better user experience

5. **Approval Workflow**: Swipe-based interface for mobile-first design
   - **Rationale**: Modern, intuitive interaction pattern for approval decisions
   - **Implementation**: Framer Motion provides smooth gesture handling

### Recent Changes

- **Priority System**: Changed task priority from enum values (low/medium/high/critical) to numeric float values (0-10 scale) - January 2025
  - **UI Updates**: Task forms now use numeric input with 0.1 step increments
  - **Display**: Priority values shown with one decimal place (e.g., "Priority: 5.0")
  - **Filtering**: Priority filters categorized as Low (0-2), Medium (2-5), High (5+)
  - **Color Coding**: Red for 8+, Yellow for 5+, Blue for 2+, Gray for below 2

- **GitHub Repository Schema**: Removed language field from repository records - January 2025
  - **Database**: Dropped language column from github_repositories table
  - **UI Updates**: Removed language display from repository cards in project detail view
  - **Rationale**: Simplified repository data model, focusing on essential metadata only