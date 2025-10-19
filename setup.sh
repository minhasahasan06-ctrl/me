#!/bin/bash

# AI Health Chatbot Setup Script
echo "🏥 Setting up AI Health Chatbot with Wearable Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python 3.11+ is installed
print_status "Checking Python version..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_success "Python $PYTHON_VERSION found"
else
    print_error "Python 3.11+ is required but not found. Please install Python first."
    exit 1
fi

# Check if Node.js 18+ is installed
print_status "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION found"
else
    print_error "Node.js 18+ is required but not found. Please install Node.js first."
    exit 1
fi

# Setup Backend
print_status "Setting up backend..."
cd backend

# Create virtual environment
print_status "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating environment configuration file..."
    cp .env.example .env
    print_warning "Please edit backend/.env with your API keys before running the application"
else
    print_success "Environment file already exists"
fi

cd ..

# Setup Frontend
print_status "Setting up frontend..."
cd frontend

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

cd ..

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p backend/uploads

# Set permissions
chmod 755 backend/uploads

print_success "Setup completed successfully!"

echo ""
echo "🎉 AI Health Chatbot is ready to use!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env with your API keys:"
echo "   - GOOGLE_API_KEY (required)"
echo "   - FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET (optional)"
echo ""
echo "2. Start the backend:"
echo "   cd backend && source venv/bin/activate && python app.py"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   cd frontend && npm start"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "🔗 Get API keys:"
echo "   - Google AI: https://makersuite.google.com/app/apikey"
echo "   - Fitbit: https://dev.fitbit.com"