# Phase 2: Infrastructure Setup

This phase sets up the core infrastructure for the medical reservation system, including Inngest configuration and database schemas.

## Overview

- Remove BullMQ dependencies
- Set up Inngest for workflow orchestration
- Create medical reservation database schemas
- Configure infrastructure for request/approval system

## Key Components

### 1. Inngest Configuration

- Inngest client setup
- Event schemas for medical workflows
- Function definitions for reservation workflows
- Environment configuration

### 2. Database Schema Updates

- Service catalog tables
- Availability rules tables
- Time slot management
- Reservation tracking
- Request/approval workflow states

### 3. Service Layer Updates

- Inngest event service
- Reservation service foundation
- Availability service
- Medical service catalog

### 4. Infrastructure Changes

- Remove Redis/BullMQ dependencies
- Update service registration
- Configure Inngest middleware
- Set up monitoring and observability

## Implementation Steps

1. **Install Inngest dependencies**
2. **Configure Inngest client**
3. **Create database migrations**
4. **Update service architecture**
5. **Set up event schemas**
6. **Configure monitoring**

## Technical Requirements

- Inngest account and API keys
- Database schema migrations
- Service dependency updates
- Environment variable configuration
