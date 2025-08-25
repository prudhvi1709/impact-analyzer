# Service Desk Impact Analysis

An interactive visualization tool for analyzing service desk issues based on business impact and resolution time, using real CSV data from ITSM tickets.

## Features

- **Bubble Chart Visualization**: X-axis shows resolution time, Y-axis shows business impact
- **Real Data Integration**: Uses actual service desk data from CSV file (264+ categories analyzed)
- **Interactive Bubbles**: Each bubble represents a service category, size shows issue count
- **Rich Tooltips**: Shows category, sub-category, severity, issues count, business impact, and resolution time
- **Data Mode Selection**: Switch between Real CSV Data, Synthetic Data, and Enhanced Realistic Data
- **Sample Size Control**: Choose 50, 100, 200, or 500 data points to display
- **Date Range Filtering**: Select specific date ranges from the CSV data
- **Category Filtering**: Click legend items to show/hide specific categories
- **Statistics Dashboard**: Real-time stats on total issues, impact, resolution times, and severity

## File Structure (Minimal & Consolidated)

### Core Files (2 JavaScript files, <500 lines each)

1. **`main.js`** (363 lines) - Core application logic
   - `DataManager` class: CSV loading, parsing, data generation
   - `UIManager` class: DOM updates, event handling, statistics
   - `App` class: Application coordinator and state management
   - Configuration loading and date range management

2. **`chart.js`** (162 lines) - Chart rendering and interactions
   - `Chart` class: D3.js bubble chart rendering
   - Interactive tooltips and hover effects
   - Legend creation and category filtering
   - Responsive chart sizing and positioning

### Configuration & Data

3. **`config.json`** (87 lines) - Application configuration
   - Chart styling and dimensions
   - Severity tiers and color schemes
   - Data source configuration
   - Default categories and UI settings

4. **`fake_itsm_tickets_6k.csv`** (6,002 lines) - Sample ITSM data
   - Real-world formatted service desk tickets
   - Categories, priorities, resolution times
   - Business impact calculations

### UI & Presentation

5. **`index.html`** (138 lines) - Main application interface
   - Bootstrap 5 responsive layout
   - Interactive controls and statistics panel
   - D3.js and chart container setup

## How to Use

1. **Start Local Server**: 
   ```bash
   python3 -m http.server 8000
   # Open browser to http://localhost:8000
   ```

2. **Select Data Mode**: 
   - **Real CSV Data**: View actual service desk data from CSV file
   - **Synthetic Data**: Computer-generated data matching real patterns
   - **Enhanced Realistic Data**: Smart simulation with logical correlations

3. **Adjust Controls**: 
   - **Sample Size**: Choose 50-500 data points to display
   - **Date Range**: Use sliders to filter by date range (Real CSV mode only)

4. **Explore Visualization**: 
   - Bubble size = number of issues
   - X-position = average resolution time (hours)
   - Y-position = estimated daily business impact (USD)
   - Border color = severity level (🔴 High, 🟡 Medium, 🟢 Low)

5. **Interactive Features**:
   - Hover over bubbles for detailed tooltips
   - Click legend items to filter categories
   - View real-time statistics in dashboard

## Data Structure

The application processes ITSM ticket data with the following key fields:

### CSV Data Format
- **category**: Main service category (e.g., "Software Service", "Hardware", "Network Services")
- **sub_category**: Specific issue type (e.g., "Login Issue", "Account Disabled")
- **severity**: Impact level (Low $200/day, Medium $1,000/day, High $5,000/day)
- **est_per_day_cost_usd**: Calculated daily financial impact
- **resolution_hours**: Time to resolve each ticket
- **created_time/resolved_time**: Ticket timestamps for date filtering
- **RequestID**: Individual ticket identifiers

### Generated Statistics
- **Total Issues**: Sum of all reported issues
- **Total Daily Impact**: Combined business impact across categories
- **Avg Resolve Time**: Mean resolution time across all issues
- **High Severity Items**: Count of critical issues
- **Categories Analyzed**: Number of service categories displayed

## Data Modes Explained

### 1. Real CSV Data (Default)
- **Source**: Actual ITSM ticket data from CSV file
- **Categories**: 264+ real service desk categories
- **Values**: Real business impacts and resolution times
- **Date Filtering**: Interactive date range selection
- **Use Case**: Production analysis of service desk performance

### 2. Synthetic Data
- **Source**: Computer-generated data matching real patterns
- **Categories**: Uses categories from CSV or defaults
- **Values**: Statistically similar to real data but randomized
- **Use Case**: Demo/testing without exposing real data

### 3. Enhanced Realistic Data
- **Source**: Smart simulation with logical correlations
- **Logic**: More issues → longer resolution times, higher impacts
- **Use Case**: Training scenarios and what-if analysis

## Chart Interpretation

### Strategic Quadrants
- **Top-Left**: High impact, quick resolution - well-performing critical services
- **Top-Right**: High impact, slow resolution - priority improvement areas ⚠️
- **Bottom-Left**: Low impact, quick resolution - efficient routine services
- **Bottom-Right**: Low impact, slow resolution - process optimization candidates

### Visual Elements
- **Bubble Color**: Service category (each color = different service area)
- **Bubble Size**: Issue frequency (larger = more reported issues)
- **X-Axis**: Resolution time in hours (shorter is better)
- **Y-Axis**: Daily business impact in USD (higher = more critical)
- **Border Color**: Severity tier (Red/Yellow/Green)

## Technologies Used

- **D3.js v7**: Interactive data visualization and bubble charts
- **Bootstrap 5**: Responsive UI framework and components
- **Vanilla JavaScript**: Modern ES6+ classes and async/await
- **CSV Processing**: Client-side parsing and date filtering
- **No External Dependencies**: Minimal, self-contained codebase

## Performance & Design

- **Consolidated Codebase**: Only 2 JavaScript files, both under 500 lines
- **No Global Variables**: Clean encapsulation with ES6 classes
- **Responsive Design**: Dynamic chart sizing and mobile-friendly
- **Memory Efficient**: Selective data loading and filtering
- **Fast Rendering**: Optimized D3.js chart updates and interactions