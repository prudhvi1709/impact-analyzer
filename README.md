# Service Desk Impact Analysis

An interactive visualization tool for analyzing service desk issues based on business impact and resolution time, using real Excel data from service-desk-summary.xlsx.

## Features

- **Bubble Chart Visualization**: X-axis shows resolution time, Y-axis shows business impact
- **Real Data Integration**: Uses actual service desk data from Excel file (264 categories analyzed)
- **Interactive Bubbles**: Each bubble represents a service category, size shows issue count
- **Rich Tooltips**: Shows category, sub-category, severity, issues count, business impact, and resolution time
- **Data Mode Selection**: Switch between Real Excel Data, Synthetic Data, and Enhanced Realistic Data
- **Sample Size Control**: Choose 50, 100, 200, or 500 data points to display
- **Category Filtering**: Click legend items to show/hide specific categories
- **Statistics Dashboard**: Real-time stats on total issues, impact, resolution times, and severity

## How to Use

1. **Open the application**: Start a local web server and navigate to `http://localhost:8000`

2. **Select Data Mode**: 
   - **Real Excel Data**: View actual service desk data from your Excel file
   - **Synthetic Data**: Computer-generated data matching your real data patterns
   - **Enhanced Realistic Data**: Smart simulation with logical correlations

3. **Adjust Sample Size**: Choose how many data points to display (50-500)

4. **Explore the Visualization**: 
   - Each bubble represents a service category/sub-category
   - Bubble size = number of issues
   - X-position = average resolution time (hours)
   - Y-position = estimated daily business impact (USD)
   - Border color = severity level (Red=High, Yellow=Medium, Green=Low)

5. **Interactive Features**:
   - Hover over bubbles for detailed information
   - Click legend items to filter categories
   - View real-time statistics in the dashboard

## Data Structure

The application uses real service desk data from `service-desk-summary.xlsx` with multiple sheets:

### Summary Sheet (264 service categories)
- **category**: Main service category (e.g., "ACCOPS", "SAP", "Network Services")
- **sub_category**: Specific issue type (e.g., "Accops Account Disabled", "Login Issue")
- **# of issues**: Number of reported issues per category
- **severity_mode**: Low ($200/day), Medium ($1,000/day), High ($5,000/day)
- **est per-day business impact (USD)**: Calculated daily financial impact
- **avg time to resolve (hours)**: Average resolution time

### Sample Raw Data Sheet (2,000 individual tickets)
- **RequestID**: Individual ticket identifiers
- **priority**: Ticket priority level
- **category/sub_category**: Service classification
- **resolution_hours**: Time to resolve each ticket
- **severity**: Inferred severity level
- **est_per_day_cost_usd**: Per-ticket impact calculation

## Data Modes Explained

### 1. Real Excel Data (Default)
- **Source**: Actual data from service-desk-summary.xlsx
- **Categories**: 264 real service desk categories
- **Values**: Real business impacts ($200-$5000/day) and resolution times
- **Use Case**: Production analysis of actual service desk performance

### 2. Synthetic Data
- **Source**: Computer-generated data matching real data patterns
- **Categories**: Predefined IT service categories
- **Values**: Statistically similar to real data but randomly generated
- **Use Case**: Demo/testing without exposing real organizational data

### 3. Enhanced Realistic Data
- **Source**: Smart simulation with logical correlations
- **Categories**: Same as synthetic mode
- **Values**: More realistic relationships (more issues = longer resolution)
- **Use Case**: Training scenarios and what-if analysis

### Real Service Categories Include:
- **ACCOPS**: Remote access and connectivity issues
- **SAP**: Enterprise resource planning system issues
- **Network Services**: Infrastructure and connectivity
- **Security Services**: Information security incidents
- **Hardware**: Physical equipment problems
- **Email Services**: Communication system issues
- **Login Issues**: Authentication and access problems
- **And 257+ more categories...**

## Visualization Insights

### Chart Interpretation
- **X-Axis**: Average Time to Resolve (hours) - shorter is better
- **Y-Axis**: Estimated Per-Day Business Impact (USD) - higher indicates more critical
- **Bubble Size**: Number of issues - larger bubbles = more frequent problems
- **Color**: Service category - each color represents a different service area
- **Border**: Severity level (🔴 High, 🟡 Medium, 🟢 Low)

### Strategic Analysis
- **Top-Left Quadrant**: High impact, quick resolution - well-performing critical services
- **Top-Right Quadrant**: High impact, slow resolution - priority improvement areas
- **Bottom-Left Quadrant**: Low impact, quick resolution - efficient routine services
- **Bottom-Right Quadrant**: Low impact, slow resolution - process optimization candidates

### Key Metrics Dashboard
- **Total Issues**: Sum of all reported issues
- **Total Daily Impact**: Combined business impact across all categories
- **Avg Resolve Time**: Mean resolution time across all issues
- **High Severity Items**: Count of high-impact issues requiring immediate attention
- **Categories Analyzed**: Number of service categories in current view

## Running Locally

```bash
# Start a simple HTTP server
python3 -m http.server 8000

# Open browser to http://localhost:8000
```

### Files Required
- `index.html` - Main application interface
- `script.js` - Visualization logic and data processing
- `service-desk-summary.xlsx` - Real service desk data
- `excel_data.json` - Processed JSON data (auto-generated)

## Technologies Used

- **D3.js v7**: Interactive data visualization and bubble charts
- **HTML5/CSS3**: Responsive interface and styling
- **Vanilla JavaScript**: Data processing and interactivity
- **Python pandas**: Excel file processing (for JSON conversion)
- **HTTP Server**: Local development and data serving