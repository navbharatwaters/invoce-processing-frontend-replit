# replit.md

## Overview

This repository contains a modern, AI-powered document processing web application called "AIAutoEye". The application is designed to automate document processing workflows by uploading various document formats (PDF, DOC, DOCX, PNG, JPG, JPEG), sending them to an external AI processing webhook, and displaying the extracted data in an editable Excel-like format.

## Recent Changes

**July 26, 2025 - Latest Updates (STABLE CHECKPOINT):**
- ✓ Fixed cell value persistence issue - cell edits now save immediately and remain persistent when navigating between cells
- ✓ Implemented editable column headers - double-click any column header to rename it
- ✓ Changed row insertion behavior to add rows above current cell instead of below
- ✓ Enhanced document viewer to use full window space with dark background eliminating white space
- ✓ Fixed document orientation issue caused by scroll bar positioning attempts
- ✓ **RESOLVED: Fixed horizontal scroll bar and zoom functionality** - scroll bars now properly appear using percentage-based container sizing, and zoom works correctly with CSS transform scaling
- ✓ **Code Quality Improvements Applied**: Enhanced DocumentViewer with TypeScript interfaces, constants for magic numbers, modular helper functions, accessibility attributes, and support for additional image formats (gif, webp)
- ✓ **RESOLVED: Session persistence issue** - Fixed logout/login state management so users see blank screen after login instead of previous user's processes
- ✓ Enhanced Excel-like navigation to include header row (row 0) for seamless editing
- ✓ Optimized document viewer scaling and transform origin for better zoom behavior
- ✓ All previous features maintained: webhook integration, CSV download, analytics dashboard, settings configuration

**July 25, 2025 - Previous Updates:**
- ✓ Fixed webhook data mapping to properly handle n8n array-of-objects responses
- ✓ Enhanced table layout with responsive column widths and proper sizing
- ✓ Fixed CSV download functionality to match screen display exactly
- ✓ Implemented comprehensive Excel-like keyboard navigation with arrow keys, Enter/F2 editing, Tab navigation
- ✓ Updated Analytics Dashboard to display actual values from processed files
- ✓ Enhanced Settings page with comprehensive configuration options
- ✓ Updated branding from "nBiz Data Processor" to "AIAutoEye" across all application interfaces

**July 24, 2025 - Previous Updates:**
- ✓ Fixed webhook integration to properly send files to n8n workflow
- ✓ Added comprehensive error handling and logging for webhook requests  
- ✓ Implemented fallback data system for demonstration when webhook fails
- ✓ Fixed TypeScript types across frontend components
- ✓ Enhanced file upload with metadata (filename, type, size) sent to webhook
- ✓ Added timeout handling for webhook requests (30 seconds)
- ✓ Improved user feedback with real-time status updates

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL store
- **File Upload**: Multer middleware for handling multipart/form-data

## Key Components

### Database Schema
The application uses four main database tables:
- **users**: User authentication and profile data
- **files**: File metadata, processing status, and extracted data
- **settings**: User-specific configuration (webhook URLs, timeouts, etc.)
- **analytics**: Processing statistics and performance metrics

### Authentication System
- Simple username/password authentication
- Session-based authentication with PostgreSQL session store
- Remember me functionality
- Default admin user (username: "admin", password: "admin123")

### File Processing Workflow
1. **Upload**: Multi-format file upload with validation (10MB limit)
2. **Webhook Integration**: Files sent to n8n workflow endpoint for AI processing
3. **Status Tracking**: Real-time progress updates (uploading → processing → extracting → complete)
4. **Data Extraction**: n8n returns array-of-objects converted to Excel table format
5. **Manual Review**: Editable spreadsheet interface with responsive column sizing
6. **Download**: Properly formatted CSV export with UTF-8 encoding
7. **Approval**: Final approval process with Google Drive integration

### UI Components
- **Split-screen Layout**: Document viewer on left, data table on right
- **Navigation**: Dashboard, Analytics, and Settings tabs
- **File Uploader**: Drag-and-drop interface with progress tracking
- **Data Table**: Excel-like editing interface with auto-save functionality
- **Status Bar**: Real-time processing status with progress indicators

## Data Flow

1. **User Authentication**: Login with credentials, session stored in PostgreSQL
2. **File Upload**: User drags/drops or selects files for processing
3. **Webhook Processing**: Files sent to external AI service (default: n8n webhook)
4. **Status Polling**: Frontend polls for processing updates every 2 seconds
5. **Data Display**: Extracted Excel data displayed in editable table
6. **User Editing**: Manual corrections with visual highlighting of changes
7. **Approval & Export**: Final approval triggers Google Drive upload

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL) via `@neondatabase/serverless`
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **UI Components**: Radix UI primitives for accessible components
- **State Management**: TanStack Query for API state management
- **Validation**: Zod for schema validation
- **File Processing**: Multer for file uploads

### External Services
- **n8n Workflow Webhook**: Production endpoint at `https://navbharatwater.one/webhook/5fd4e2ef-bc4e-404a-9b6e-23ccd70c6871`
- **Data Processing**: n8n workflow extracts structured data from PDFs and returns array-of-objects
- **Google Drive API**: For final file storage (mocked in current implementation)
- **Session Store**: PostgreSQL-based session storage

### Key Technical Achievements
- **Webhook Processing**: Successfully handles n8n array-of-objects responses with proper column ordering
- **Data Mapping**: Preserves original workflow structure while converting to Excel table format
- **CSV Export**: Generates properly formatted CSV files that match screen display exactly
- **Table Display**: Responsive column widths with truncation and tooltips for long content
- **Real-time Updates**: Live status tracking with detailed logging for debugging

### Development Tools
- **Vite**: Development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Backend bundling for production
- **Replit Integration**: Development environment optimizations

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with hot reload
- **Database**: Drizzle migrations with push command

### Production
- **Frontend**: Static build served from Express
- **Backend**: ESBuild bundle with ES modules
- **Database**: PostgreSQL connection via environment variables
- **Environment**: NODE_ENV-based configuration

### Configuration
- **Database**: DATABASE_URL environment variable required
- **Sessions**: SESSION_SECRET for production security
- **File Storage**: Local uploads directory with configurable limits
- **Webhook**: Configurable endpoint in settings (user-specific)

The application is designed to be deployed on platforms like Replit, with automatic database provisioning and environment variable management. The split between client and server code allows for flexible deployment options including serverless functions or traditional server hosting.