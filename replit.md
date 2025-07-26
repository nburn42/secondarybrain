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
- **Task Items**: Track agent conversations, tool calls, and execution history with hierarchical parent-child relationships
- **GitHub Repositories**: Associated with projects for code integration
- **Approval Queue**: Manages task approval workflow with reviewer tracking, now linked to specific task items

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

- **Task Items System**: Added hierarchical conversation tracking for agent execution - January 2025
  - **Database**: New task_items table with parent-child relationships and tool call storage
  - **Types**: Support for planning messages, tool calls, file creation, approval requests, and rejections
  - **API**: Full CRUD operations for task items with nested children support
  - **Storage**: JSON fields for tool parameters/responses, file content, and execution metadata
  - **Approval Integration**: Task items can trigger approval workflow when creating files or making tool calls

- **Approval Queue Removal**: Simplified approval system by removing separate approval_queue table - January 2025
  - **Database**: Dropped approval_queue table, approvals now handled directly through task_items
  - **API**: New `/api/approvals` endpoint queries task items with needsApproval=true and isApproved=null
  - **Approval Process**: `/api/task-items/:id/approve` endpoint processes approvals and creates rejection task items
  - **Dashboard**: Updated stats query to count pending approvals from task items instead of approval queue
  - **Rationale**: Eliminated redundant table, simplified data model while maintaining full approval functionality

- **Task Status Simplification**: Removed approval-related statuses from tasks - January 2025
  - **Status Enum**: Updated task_status to only include: pending, running, completed, failed
  - **Database**: Removed approvedAt and rejectionReason columns from tasks table
  - **Logic**: Task approval logic moved entirely to task_items with needsApproval/isApproved fields
  - **Rationale**: Tasks represent execution state, while task items handle approval workflow

- **Hierarchical Task System**: Added parent-child relationships for tasks - January 2025
  - **Database**: Added parentId field to tasks table with self-referencing foreign key
  - **Relations**: Tasks can have parent and children relationships through Drizzle relations
  - **API**: New endpoints for `/api/tasks/:id/children` and `/api/parent-tasks`
  - **Storage**: Methods for querying parent tasks with children and task hierarchies
  - **Types**: Extended types for TaskWithChildren and TaskWithProjectAndChildren
  - **Use Case**: Enables breaking down complex tasks into subtasks with proper hierarchy

- **Separate Repositories Tab**: Implemented independent repository management - January 2025
  - **Database**: Modified github_repositories table to support global repositories (optional projectId, added owner field)
  - **API**: New endpoints `/api/repositories` for global repository CRUD operations
  - **UI**: Separate repositories page with GitHub URL auto-parsing and repository cards
  - **Navigation**: Added repositories tab to sidebar with GitBranch icon
  - **Functionality**: Repository creation form with owner/name auto-extraction from GitHub URLs

- **Agent Container Infrastructure**: Created Docker-based agent execution system - January 2025
  - **Container**: Python-based Docker container with git, requests, and JWT support
  - **Authentication**: JWT token system for secure agent-to-API communication
  - **Workspace**: Agent clones project repositories into `/workspace` directory
  - **API**: Protected agent endpoints for repository access with JWT authentication
  - **Structure**: Complete agent-container subdirectory with Dockerfile, requirements, and scripts

- **GitHub Authentication System**: Implemented secure repository authentication - January 2025
  - **Database**: Added githubToken and isPrivate fields to repositories table
  - **Encryption**: Secure token storage using AES encryption in server/crypto.ts
  - **UI**: Authentication dialog in repositories page with GitHub token input
  - **Agent Integration**: Decrypted tokens passed to agent containers for private repo cloning
  - **API**: PUT /api/repositories/:id/auth endpoint for setting authentication
  - **Clone Support**: Agent automatically uses authentication for private repositories

- **GKE Container Management System**: Full container orchestration for agent execution - January 2025
  - **Database**: New containers table with status tracking, JWT tokens, and execution metadata
  - **GCP Integration**: Build and deployment scripts for Google Kubernetes Engine (GKE)
  - **Docker Registry**: Automated build/push pipeline to us-west2-docker.pkg.dev/neuronotify/neuronotifyagent
  - **API**: Complete CRUD operations for container lifecycle management
  - **UI**: Container cards showing status, logs, duration, and execution details
  - **Authentication**: JWT-based secure communication between containers and backend
  - **Scripts**: build-agent.sh and deploy-container.sh for automated container deployment
  - **Project Integration**: Each project can have multiple containers with independent execution

- **Progressive Web App (PWA) Implementation**: Mobile-first installable web app with offline capabilities - January 2025
  - **Web App Manifest**: Complete PWA configuration with app icons, shortcuts, and mobile optimization
  - **Service Worker**: Offline caching, background sync, and update management
  - **Install Prompt**: Smart installation prompt for mobile devices with dismissal functionality
  - **Push Notifications**: Infrastructure ready for future push notification implementation
  - **Offline Support**: Network-first API caching and cache-first static asset strategy
  - **Mobile Optimization**: Apple touch icons, standalone mode, and mobile viewport configuration
  - **App Shortcuts**: Quick access to Dashboard, Projects, and Approvals from home screen

- **Agent Task Execution Loop**: Intelligent task claiming and planner execution system - January 2025
  - **Task Claiming**: Agents automatically claim available tasks by setting container ID to prevent conflicts
  - **Database Schema**: Added containerId to tasks table and chatResponse field to task items
  - **Planner Loop**: Agents build chat history from task items and execute planning conversations
  - **Chat History**: Task items automatically convert to conversation history for LLM integration
  - **Task Item Creation**: Agents create planning, tool call, and response task items during execution
  - **Status Management**: Tasks automatically progress from pending → running → completed/failed
  - **Concurrency Control**: Multiple containers can work on different tasks without conflicts
  - **Repository Integration**: Agents clone project repositories before starting task execution

- **Tinder-Style Swipe Approval Interface**: Mobile-first approval system with gesture controls - January 2025
  - **Swipe Gestures**: Left swipe to reject, right swipe to approve with smooth animations
  - **Rejection Reasons**: Modal dialog prompts for detailed rejection explanations when rejecting
  - **Dual Mode UI**: Toggle between swipe mode and traditional list view for different preferences
  - **Visual Feedback**: Real-time color gradients and icons show swipe direction and action
  - **Card Stack**: Progressive card navigation through pending approvals with position indicators
  - **Touch Optimized**: Mobile-first design with large touch targets and haptic-like feedback
  - **API Integration**: Seamless approval/rejection with automatic refresh and progress tracking