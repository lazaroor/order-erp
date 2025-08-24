# Overview

This is a local-first order and cash flow management system built with Node.js, Express, React, and SQLite. The system manages orders for two fixed products (SUPORTE_PEQUENO and SUPORTE_GRANDE) with automated financial tracking. When orders are marked as complete, the system automatically records revenue entries and cost of goods sold (COGS) in the cash flow system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React SPA**: TypeScript-based React application using Wouter for client-side routing
- **UI Framework**: Shadcn/ui components with Radix UI primitives and Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Express.js Server**: RESTful API with Express middleware for JSON parsing and error handling
- **Database Layer**: SQLite database with Drizzle ORM for type-safe database operations
- **Storage Interface**: Abstracted storage layer (IStorage) for database operations with SQLite implementation
- **Route Structure**: Modular route handlers for products, orders, and cash flow endpoints

## Database Design
- **Products Table**: Fixed catalog with two SKUs (SUPORTE_PEQUENO, SUPORTE_GRANDE) including pricing and cost data
- **Orders System**: Orders with sequential numbering (YYYY-####), status workflow (EmProducao → Enviado → Concluido), and related order items
- **Cash Flow**: Automated financial entries with manual transaction support for comprehensive financial tracking
- **Status Management**: Enum-based status system for orders (1=EmProducao, 2=Enviado, 3=Concluido, 4=Cancelado)

## Key Business Logic
- **Order Workflow**: Orders progress through defined statuses with automated financial recording on completion
- **Automatic Financial Entries**: When orders reach "Concluido" status, the system creates revenue entries and COGS deductions automatically
- **Manual Transactions**: Support for manual cash flow entries for expenses and other financial operations

## Development Environment
- **Build System**: Vite for frontend development with TypeScript support
- **Development Tools**: Hot reload, error overlay, and Replit integration for cloud development
- **Module System**: ESM modules throughout with path aliases for clean imports

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Database connection library (configurable for PostgreSQL via Drizzle)
- **drizzle-orm**: Type-safe SQL ORM with SQLite adapter
- **better-sqlite3**: SQLite database driver for Node.js

## Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **@hookform/resolvers**: Form validation integration
- **date-fns**: Date manipulation utilities

## UI Component Libraries
- **@radix-ui/react-***: Accessible UI primitives (dialog, select, accordion, etc.)
- **lucide-react**: Icon library
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

## Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit integration
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds

## Validation and Type Safety
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas