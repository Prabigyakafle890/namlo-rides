# Namlo Rides

Namlo Rides is a web-only ride-sharing simulator built with React. It demonstrates a rider request flow, a driver console, live trip updates, a Kathmandu map view, and resolved ride history.

## Features

- Demo login screen
- Rider controls for requesting and cancelling a ride
- Driver controls for accepting, rejecting, and completing rides
- Live route progress on a Leaflet map
- Resolved trip history for completed, cancelled, and rejected rides
- Local demo mode by default
- Optional Firebase Realtime Database support
- Optional REST endpoint support for ride history

## Demo Login

```text
Username: intern@namlotech.com
Password: namlo2026
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Environment Variables

The app works without environment variables by using browser storage for demo data.

To enable Firebase realtime updates, create a `.env` file and provide:

```bash
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_DATABASE_URL=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

To save and load ride history from a REST API, provide:

```bash
REACT_APP_HISTORY_API_URL=
```

When `REACT_APP_HISTORY_API_URL` is not set, history is stored in `localStorage`.

## Tech Stack

- React
- Create React App
- React Leaflet and Leaflet
- Firebase Realtime Database
- Lucide React icons
- Testing Library

## Project Structure

```text
src/
  App.js                    Main app, login, dashboard, map, ride workflow
  App.css                   App styling
  index.js                  React entry point
  reportWebVitals.js        Optional web vitals reporting
  services/
    historyApi.js           Local or REST-backed ride history
    realtime.js             Local or Firebase-backed realtime trip stream
```
