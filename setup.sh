#!/bin/bash

# Nuxt Project Setup Script
echo "🚀 Setting up Nuxt project with Yarn..."

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Install Playwright browsers for E2E testing
echo "🎭 Installing Playwright browsers..."
yarn playwright install

# Prepare Nuxt
echo "⚡ Preparing Nuxt..."
yarn postinstall

echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  yarn dev          - Start development server (auto-opens browser)"
echo "  yarn build        - Clean & build for production"
echo "  yarn preview      - Preview production build (auto-opens browser)"
echo "  yarn test         - Run all tests"
echo "  yarn test:unit    - Run unit tests"
echo "  yarn test:nuxt    - Run Nuxt component tests"
echo "  yarn test:e2e     - Run E2E tests"
echo "  yarn test:coverage - Run tests with coverage"
echo ""
echo "✨ Features:"
echo "  • Auto-cleaning before builds"
echo "  • Auto-opening browser for dev/preview"
echo "  • Comprehensive testing setup"
echo ""
echo "Happy coding! 🎉"