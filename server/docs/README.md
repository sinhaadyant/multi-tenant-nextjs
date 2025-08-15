# Multi-Tenant Admin API Documentation

## Overview

This is the documentation directory for the Multi-Tenant Admin API project.

## Structure

- `README.md` - This file
- `API.md` - API documentation
- `SETUP.md` - Setup and installation guide
- `DEPLOYMENT.md` - Deployment instructions

## Quick Start

1. Install dependencies: `npm install`
2. Set up environment: Copy `env.example` to `.env` and configure
3. Run database migrations: `npm run prisma:migrate`
4. Start development server: `npm run dev`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Environment Variables

See `env.example` for required environment variables.

## Database

This project uses Prisma ORM with MySQL database.

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed database with initial data
