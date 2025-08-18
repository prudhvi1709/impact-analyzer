// Global data variables
let typesData = [];
let summaryData = [];

// Load CSV data
const loadData = async () => {
    try {
        // Load types data
        const typesResponse = await fetch('types.csv');
        const typesText = await typesResponse.text();
        typesData = parseCSV(typesText).map(row => ({
            category: row.Category,
            subcategory: row.Subcategory,
            effortPerIssue: +row.Effort_Per_Issue,
            impactPerDay: +row.Impact_Per_Day
        }));

        // Load summary data
        const summaryResponse = await fetch('summary.csv');
        const summaryText = await summaryResponse.text();
        summaryData = parseCSV(summaryText).map(row => ({
            date: new Date(row.Date),
            category: row.Category,
            subcategory: row.Subcategory,
            count: +row.Count,
            daysToFix: +row.Days_To_Fix
        }));

        console.log(`Loaded ${typesData.length} type definitions and ${summaryData.length} summary records`);
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
};

// Simple CSV parser
const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j];
        }
        data.push(row);
    }
    
    return data;
};

// Strategic quadrant color palette
const categoryColors = {
    'Quick Wins': '#27ae60',           // Green - High ROI, prioritize
    'Major Projects': '#3498db',       // Blue - Strategic investments  
    'Fill-ins': '#f39c12',            // Orange - Low priority maintenance
    'Thankless Tasks': '#e74c3c',     // Red - Avoid or redesign
    'Critical Infrastructure': '#c0392b', // Dark Red - Emergency
    'High Impact Operations': '#2980b9',   // Blue - Business critical
    'Medium Impact Systems': '#f39c12',    // Orange - Moderate priority
    'Routine Support': '#95a5a6',          // Gray - High volume, low value
    'Executive Support': '#8e44ad',        // Purple - Executive priority
    'Compliance Systems': '#34495e'        // Dark Blue - Regulatory
};

// Helper function to get all unique categories
const getCategories = () => {
    return [...new Set(typesData.map(d => d.category))];
};

// Helper function to get subcategories for a category
const getSubcategories = (category) => {
    return typesData.filter(d => d.category === category);
};

// Helper function to aggregate data for visualization
const aggregateDataForPeriod = (startDate, endDate) => {
    // Filter summary data for the given period
    const filteredSummary = summaryData.filter(d => 
        d.date >= startDate && d.date <= endDate
    );
    
    // Aggregate by category and subcategory
    const aggregated = {};
    
    filteredSummary.forEach(item => {
        const key = `${item.category}|${item.subcategory}`;
        if (!aggregated[key]) {
            const typeInfo = typesData.find(t => 
                t.category === item.category && t.subcategory === item.subcategory
            );
            aggregated[key] = {
                category: item.category,
                subcategory: item.subcategory,
                count: 0,
                totalDays: 0,
                effortPerIssue: typeInfo.effortPerIssue,
                impactPerDay: typeInfo.impactPerDay
            };
        }
        aggregated[key].count += item.count;
        aggregated[key].totalDays += item.daysToFix * item.count;
    });
    
    // Convert to array and calculate totals
    return Object.values(aggregated).map(item => ({
        ...item,
        avgDaysToFix: item.count > 0 ? item.totalDays / item.count : 0,
        totalEffort: item.count * item.effortPerIssue,
        totalImpact: item.count * item.impactPerDay * (item.totalDays / item.count)
    }));
};

// Helper function to aggregate data by category only
const aggregateByCategory = (data) => {
    const categoryAggregates = {};
    
    data.forEach(item => {
        if (!categoryAggregates[item.category]) {
            categoryAggregates[item.category] = {
                category: item.category,
                count: 0,
                totalEffort: 0,
                totalImpact: 0,
                subcategories: []
            };
        }
        
        categoryAggregates[item.category].count += item.count;
        categoryAggregates[item.category].totalEffort += item.totalEffort;
        categoryAggregates[item.category].totalImpact += item.totalImpact;
        categoryAggregates[item.category].subcategories.push(item);
    });
    
    return Object.values(categoryAggregates);
};

// Get date range for sliders
const getDateRange = () => {
    const dates = summaryData.map(d => d.date);
    return {
        min: new Date(Math.min(...dates)),
        max: new Date(Math.max(...dates))
    };
};