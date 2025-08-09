#!/bin/bash

echo "🚀 Starting Flask Blog API..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create .env file with proper configuration."
    echo "See FULL_SETUP_GUIDE.md for details."
fi

# Start the application
echo "Starting Flask API on http://localhost:5000"
echo "API Documentation available at:"
echo "  - Health Check: http://localhost:5000/api/health"
echo "  - Posts: http://localhost:5000/api/posts"
echo "  - Auth: http://localhost:5000/api/auth"

python run.py
