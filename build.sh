#!/usr/bin/env bash
# Build script for Render deployment
set -e

echo "==> Installing Python dependencies..."
pip install pillow numpy mediapipe

echo "==> Installing backend Node dependencies..."
cd backend
npm ci

echo "==> Installing frontend Node dependencies..."
cd ../frontend
npm ci

echo "==> Building frontend..."
npm run build

echo "==> Copying frontend build to backend/dist..."
cp -r dist ../backend/dist

echo "==> Build complete!"
