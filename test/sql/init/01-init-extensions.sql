-- Initialize the database with pgvector extension and create schemas
-- This file runs automatically when the PostgreSQL container starts

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create izumi schema for vector store
CREATE SCHEMA IF NOT EXISTS izumi;

-- Create test data schema
CREATE SCHEMA IF NOT EXISTS test_data;

-- Set search path
SET search_path TO test_data, izumi, public;
