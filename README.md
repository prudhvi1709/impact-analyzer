# Impact Analyzer

A interactive visualization tool for analyzing and prioritizing service request categories based on impact and effort.

## Features

- **Zoomable Scatterplot**: X-axis shows effort, Y-axis shows impact (top-left = quick wins: low-effort, high-impact)
- **Category Bubbles**: Each category is represented by a colored bubble, with size proportional to the square root of issue count
- **Interactive Drill-down**: Click any category to "explode" it into subcategories with smooth animations
- **Hover Tooltips**: Detailed information about issues, effort, and impact on hover
- **Date Range Filtering**: Use the range slider to filter data by date periods
- **Animated Timeline**: Play button for automated timeline progression
- **Quadrant Labels**: Clear labeling of effort/impact quadrants for strategic prioritization

## How to Use

1. **Open the application**: Start a local web server and navigate to `http://localhost:8001`

2. **Explore Categories**: 
   - Each colored bubble represents a service request category
   - Bubble size indicates the number of issues
   - Position shows effort vs impact relationship

3. **Drill Down**: 
   - Click any category bubble to see its subcategories
   - Subcategories animate from the center outward
   - Click any subcategory to collapse back to category view

4. **Filter by Date**:
   - Use the dual-handle range slider to select date periods
   - Bubbles smoothly resize based on issue counts in the selected period
   - Date labels show the current selection

5. **Animate Timeline**:
   - Click the "Play" button to automatically progress through time
   - The range window moves forward while preserving duration
   - Click "Pause" to stop the animation

## Data Structure

The application uses two realistic enterprise CSV files:

### types.csv (119 enterprise service types)
- **Category**: 12 enterprise categories ranging from Critical Infrastructure to User Support
- **Subcategory**: 119 specific business scenarios (e.g., "Data Center Power Outage", "Payroll Processing Issues")
- **Effort_Per_Issue**: Realistic resolution costs ($45 - $25,000 per issue)
- **Impact_Per_Day**: Daily business impact costs ($85 - $500,000 per day if unresolved)

### summary.csv (14,203 realistic incidents over 2 years)
- **Date**: Daily incidents from 2023-01-01 to 2024-12-31
- **Category**: Matches types.csv categories
- **Subcategory**: Matches types.csv subcategories
- **Count**: Realistic incident volumes (1-45 issues per day)
- **Days_To_Fix**: Enterprise resolution times (1-60 days based on complexity)

### Enterprise Categories & Characteristics
- **Critical Infrastructure**: Rare but catastrophic ($1.57B total impact over 2 years)
- **Compliance and Governance**: Quarterly spikes, long resolution times
- **High Impact Systems**: Customer-facing systems, high urgency
- **Security Incidents**: 24/7 occurrence, immediate response required
- **User Support - Standard**: High volume, quick resolution (70% same-day)
- **User Support - Critical**: Business-critical user issues
- **Software Development**: Release cycle patterns, Friday deployment issues
- **Business Operations**: Month-end spikes, financial priority
- **Data and Analytics**: ETL failures, reporting issues
- **Communications**: Marketing campaign dependencies
- **Infrastructure Support**: Planned maintenance, hardware lifecycle
- **Medium Impact Systems**: Internal tools, moderate business impact

### Realistic Patterns Included
- **Seasonal Effects**: Holiday seasons, quarter-end compliance spikes, summer hardware issues
- **Weekly Patterns**: Monday spikes, weekend reductions, Friday deployment risks  
- **Business Context**: Executive priority, financial system urgency, major incident cascading
- **Resolution Complexity**: Emergency response vs. investigation time, escalation patterns

## Strategic Quadrants with Realistic Distribution

### 🟢 **Quick Wins (20 scenarios)** - Top-Left: Low Effort, High Impact
- **Examples**: Password policy automation, database connection pooling, monitoring alerts
- **Characteristics**: $750-$3,800 effort, $18K-$72K daily impact, 1-5 day implementation
- **Strategy**: Immediate priority - high ROI initiatives

### 🔵 **Major Projects (30 scenarios)** - Top-Right: High Effort, High Impact  
- **Examples**: Data warehouse migration, zero-trust security, ERP overhaul
- **Characteristics**: $120K-$420K effort, $125K-$850K daily impact, 30-180 day timelines
- **Strategy**: Strategic planning required - significant business transformation

### 🟠 **Fill-ins (45 scenarios)** - Bottom-Left: Low Effort, Low Impact
- **Examples**: Email signatures, desktop wallpaper, printer toner, basic training
- **Characteristics**: $38-$250 effort, $95-$1,100 daily impact, 1-3 day tasks
- **Strategy**: Do during downtime - routine maintenance work

### 🔴 **Thankless Tasks (20 scenarios)** - Bottom-Right: High Effort, Low Impact
- **Examples**: Legacy system maintenance, manual data migration, custom workarounds
- **Characteristics**: $24K-$62K effort, $1,400-$3,800 daily impact, 10-45+ day cycles
- **Strategy**: Avoid, automate, or redesign - poor ROI investments

### 📊 **Enterprise Impact Analysis (2-year period)**
- **Total Business Impact**: $20.9B across all quadrants
- **Most Strategic ROI**: Major Projects (87.8:1 impact-to-effort ratio)
- **Best Quick Wins**: Executive support automation (27.6:1 ROI)
- **Worst Investment**: Thankless Tasks (4.2:1 ROI - avoid these!)

### 🎯 **Strategic Recommendations**
1. **Prioritize Green (Quick Wins)**: 3,009 incidents, $494M impact, fast implementation
2. **Plan Blue (Major Projects)**: 1,611 incidents, $19.9B impact, requires strategic investment
3. **Batch Orange (Fill-ins)**: 11,791 incidents, $190M impact, low-priority maintenance
4. **Eliminate Red (Thankless Tasks)**: 1,019 incidents, $267M impact, redesign these processes

## Running Locally

```bash
# Start a simple HTTP server
python3 -m http.server 8001

# Open browser to http://localhost:8001
```

## Technologies Used

- **D3.js v7**: Data visualization and animations
- **HTML5/CSS3**: Structure and styling
- **Vanilla JavaScript**: Application logic and interactions