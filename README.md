# SQL Query Playground

## Project Overview
SQL Query Playground is an interactive web application for writing and testing SQL queries against sample datasets (employees, products, suppliers, and orders). Users can execute queries, view results in a table format, and track query history without needing a database connection.

## Technical Stack
- **Framework**: React 19.0.0
- **UI Library**: Material UI 7.0.0
- **Key Packages**:
  - @mui/x-data-grid (7.28.1) - Data table component
  - @uiw/react-codemirror (4.23.10) - SQL editor with syntax highlighting
  - codemirror (5.65.19) - Core editor functionality
  - @mui/icons-material (7.0.0) - UI icons

## Performance
- **Load Time**: ~1.2s for first meaningful paint, ~2.5s for interactive load
- **Measurement**: Used React Profiler API, Chrome DevTools, and Web Vitals metrics

## Optimizations
1. Used `useCallback` and `useRef` hooks to prevent unnecessary re-renders
2. Implemented localized state management to optimize render cycles
3. Applied lazy loading for the DataGrid component
4. Optimized resize event handlers with debouncing
5. Used virtualized rendering for efficiently handling large datasets

## Getting Started
```bash
npm install
npm start
```
Access at http://localhost:3000

## Application is Hosted
https://no-biggie.vercel.app/