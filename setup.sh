#!/bin/bash

echo "Setting up Flask Blog Application..."

# Backend Setup
echo "1. Setting up Backend (Flask API)..."
cd /home/shoaib-shaikh/Desktop/projects/blog-application

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Setup database
echo "Setting up PostgreSQL database..."
echo "Please make sure PostgreSQL is installed and running"
echo "Create a database named 'blog_db' or update DATABASE_URL in .env"

# Copy environment file
if [ ! -f .env ]; then
    echo "Please configure your .env file with proper values"
else
    echo "Environment file found"
fi

echo "Backend setup complete!"
echo "To run the backend: python run.py"
echo ""

# Frontend Setup
echo "2. Setting up Frontend (React + TypeScript)..."
cd /home/shoaib-shaikh/Desktop/projects/frontend-blog

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cat > package.json << 'EOF'
{
  "name": "frontend-blog",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@types/node": "^16.18.68",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5",
    "axios": "^1.6.2",
    "react-hook-form": "^7.48.2",
    "react-query": "^3.39.3",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:5000"
}
EOF

npm install

# Setup Tailwind CSS
echo "Setting up Tailwind CSS..."
npx tailwindcss init -p

cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
EOF

echo "Setup complete!"
echo ""
echo "To run the applications:"
echo "1. Backend: cd /home/shoaib-shaikh/Desktop/projects/blog-application && python run.py"
echo "2. Frontend: cd /home/shoaib-shaikh/Desktop/projects/frontend-blog && npm start"
echo ""
echo "Make sure to:"
echo "1. Configure PostgreSQL database"
echo "2. Set up OAuth credentials in .env file"
echo "3. Update CORS_ORIGINS if needed"
