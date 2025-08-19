// Configuration
const margin = { top: 60, right: 80, bottom: 80, left: 120 };
const width = 1200 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;

// Color scale for categories
const colorScale = d3.scaleOrdinal(d3.schemeSet3);

// Severity color mapping
const severityColors = {
  High: "#dc3545",
  Medium: "#ffc107",
  Low: "#28a745",
};

// Distribution parameters from actual data analysis
const issuesDistribution = {
  min: 1,
  max: 8099,
  mean: 467.72,
  median: 62,
  std: 1029.89,
  percentiles: {
    10: 1.6,
    25: 7,
    50: 62,
    75: 330,
    90: 1612.6,
    95: 2735,
    99: 4381.88,
  },
};

// Enhanced categories from all sheets
const categories = [
  "Software Service",
  "Hardware",
  "Network Services",
  "Security Services",
  "Email Services",
  "Server Services",
  "Login Issue",
  "SAP",
  "Data Services",
  "Mobile Services",
  "Account Management",
  "Change Request",
  "DevOps Automation",
  "LM Admin Service Desk",
  "LM InfoWeb Helpdesk",
  "Hardware Asset Allocation",
  "Telephony",
  "Others",
  "PMS",
  "Corporate Support",
  "AAAS Services",
  "ACCOPS",
  "Concur Concerns",
  "Darwin Box Concern",
  "FMS Support",
  "LLM Foundry",
  "LM Back Up and Restore",
  "LM CCA",
  "LM Common Request",
  "LM Computers",
  "LM Hybrid Working",
  "LM ISMS Incident",
  "LM Onboarding",
  "LM Printer and Scanner",
  "Prohance",
  "S/4 HANA",
  "Soc",
  "Springer Nature Bflux",
  "TechSol",
  "WFH",
];

// Severity tiers and their probabilities
const severityTiers = [
  { severity: "Low", dailyImpact: 200, probability: 0.6 },
  { severity: "Medium", dailyImpact: 1000, probability: 0.3 },
  { severity: "High", dailyImpact: 5000, probability: 0.1 },
];

let currentData = [];
let realData = null;
let filteredCategories = new Set();
let currentDataMode = "real";

// Load real Excel data
async function loadRealData() {
  try {
    const response = await fetch('excel_data.json');
    const data = await response.json();
    realData = data;
    return data;
  } catch (error) {
    console.error('Error loading real data:', error);
    return null;
  }
}

function generateSyntheticIssues() {
  const rand = Math.random();

  if (rand < 0.25) {
    return Math.max(1, Math.round(1 + Math.random() * 9));
  } else if (rand < 0.5) {
    return Math.round(10 + Math.random() * 52);
  } else if (rand < 0.75) {
    return Math.round(62 + Math.random() * 268);
  } else if (rand < 0.9) {
    return Math.round(330 + Math.random() * 1282);
  } else if (rand < 0.95) {
    return Math.round(1612 + Math.random() * 1123);
  } else {
    return Math.round(2735 + Math.random() * 5364);
  }
}

function generateData() {
  if (currentDataMode === "real" && realData) {
    return generateRealData();
  } else {
    return generateSyntheticData();
  }
}

function generateRealData() {
  if (!realData || !realData.Summary) {
    console.error('Real data not available');
    return [];
  }

  const sampleSize = parseInt(document.getElementById("sampleSize").value);
  const summaryData = realData.Summary;
  
  // Sample from the real data
  const data = [];
  const shuffled = [...summaryData].sort(() => 0.5 - Math.random());
  const selectedData = shuffled.slice(0, Math.min(sampleSize, shuffled.length));
  
  selectedData.forEach((item, i) => {
    // Handle null/undefined values properly
    const numIssues = item["# of issues"] || 0;
    const businessImpact = item["est per-day business impact (USD)"] || 0;
    const avgResolveTime = item["avg time to resolve (hours)"] || 0;
    
    data.push({
      category: item.category || "Unknown",
      subCategory: item.sub_category || "",
      numIssues: numIssues,
      businessImpact: businessImpact,
      avgResolveTime: avgResolveTime,
      severity: item.severity_mode || "Low",
      id: i,
    });
  });

  currentData = data;
  updateStats(data);
  createChart(data);
  return data;
}

function generateSyntheticData() {
  const sampleSize = parseInt(document.getElementById("sampleSize").value);
  const data = [];

  for (let i = 0; i < sampleSize; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const numIssues = generateSyntheticIssues();

    // Determine severity based on probability
    let severityTier = severityTiers[0]; // Default to Low
    const severityRand = Math.random();
    if (severityRand < severityTiers[2].probability) {
      severityTier = severityTiers[2]; // High
    } else if (
      severityRand <
      severityTiers[2].probability + severityTiers[1].probability
    ) {
      severityTier = severityTiers[1]; // Medium
    }

    // Calculate business impact
    let businessImpact;
    if (currentDataMode === "enhanced") {
      // More realistic correlation with number of issues
      const baseImpact = severityTier.dailyImpact;
      const issueMultiplier = Math.log(numIssues + 1) / Math.log(10);
      businessImpact = Math.round(
        baseImpact * issueMultiplier * (0.8 + Math.random() * 0.4)
      );
    } else {
      // Original synthetic approach
      const baseImpact = numIssues * (15 + Math.random() * 35);
      businessImpact = Math.max(
        500,
        Math.round(baseImpact + (Math.random() - 0.5) * baseImpact * 0.6)
      );
    }

    // Generate resolve time (influenced by severity and complexity)
    let avgResolveTime;
    if (currentDataMode === "enhanced") {
      const baseTimes = { Low: 24, Medium: 48, High: 96 };
      const baseTime = baseTimes[severityTier.severity];
      const complexityFactor = Math.log(numIssues + 1) / Math.log(10);
      avgResolveTime =
        Math.round(baseTime * complexityFactor * (0.5 + Math.random()) * 10) /
        10;
    } else {
      const urgencyFactor = Math.log(businessImpact) / Math.log(10);
      const baseTime = Math.max(
        1,
        100 - urgencyFactor * 10 + Math.random() * 80
      );
      avgResolveTime = Math.round(baseTime * 10) / 10;
    }

    data.push({
      category,
      numIssues,
      businessImpact,
      avgResolveTime,
      severity: severityTier.severity,
      id: i,
    });
  }

  currentData = data;
  updateStats(data);
  createChart(data);
  return data;
}

function updateStats(data) {
  const totalIssues = d3.sum(data, (d) => d.numIssues);
  const totalImpact = d3.sum(data, (d) => d.businessImpact);
  const avgResolveTime = d3.mean(data, (d) => d.avgResolveTime);
  const highSeverityCount = data.filter((d) => d.severity === "High").length;

  const statsPanel = document.getElementById("statsPanel");
  statsPanel.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalIssues.toLocaleString()}</div>
            <div class="stat-label">Total Issues</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">$${(totalImpact / 1000).toFixed(0)}K</div>
            <div class="stat-label">Total Daily Impact</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avgResolveTime.toFixed(1)}h</div>
            <div class="stat-label">Avg Resolve Time</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${highSeverityCount}</div>
            <div class="stat-label">High Severity Items</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.length}</div>
            <div class="stat-label">Categories Analyzed</div>
        </div>
    `;
}

function createChart(data) {
  d3.select("#chart").selectAll("*").remove();

  const svg = d3
    .select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.avgResolveTime))
    .nice()
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.businessImpact))
    .nice()
    .range([height, 0]);

  const radiusScale = d3
    .scaleSqrt()
    .domain(d3.extent(data, (d) => d.numIssues))
    .range([4, 35]);

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => `$${d3.format(".2s")(d)}`);

  g.append("g").attr("transform", `translate(0,${height})`).call(xAxis);

  g.append("g").call(yAxis);

  // Axis labels
  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", `translate(${width / 2}, ${height + 50})`)
    .style("text-anchor", "middle")
    .text("Average Time to Resolve (hours)");

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -70)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .text("Estimated Per-Day Business Impact (USD)");

  // Chart title
  g.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", -30)
    .text(
      `Service Desk Issues: Business Impact vs Resolution Time (${currentDataMode === 'real' ? 'Real Excel' : currentDataMode} data)`
    );

  // Bubbles
  const tooltip = d3.select("#tooltip");

  g.selectAll(".bubble")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "bubble")
    .attr("cx", (d) => xScale(d.avgResolveTime))
    .attr("cy", (d) => yScale(d.businessImpact))
    .attr("r", (d) => radiusScale(d.numIssues))
    .attr("fill", (d) =>
      filteredCategories.size === 0 || filteredCategories.has(d.category)
        ? colorScale(d.category)
        : "#cccccc"
    )
    .attr("opacity", (d) =>
      filteredCategories.size === 0 || filteredCategories.has(d.category)
        ? 0.7
        : 0.2
    )
    .attr("stroke", (d) => severityColors[d.severity])
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 1).attr("stroke-width", 3);

      tooltip
        .style("opacity", 1)
        .html(
          `
                    <strong>${d.category}</strong><br/>
                    ${d.subCategory ? `<strong>Sub-category:</strong> ${d.subCategory}<br/>` : ''}
                    <strong>Severity:</strong> ${d.severity}<br/>
                    <strong>Issues:</strong> ${d.numIssues.toLocaleString()}<br/>
                    <strong>Business Impact:</strong> $${d.businessImpact.toLocaleString()}/day<br/>
                    <strong>Avg Resolve Time:</strong> ${
                      d.avgResolveTime
                    } hours<br/>
                    <strong>Total Exposure:</strong> $${Math.round(
                      (d.businessImpact * d.avgResolveTime) / 24
                    ).toLocaleString()}
                `
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .attr("opacity", (d) =>
          filteredCategories.size === 0 || filteredCategories.has(d.category)
            ? 0.7
            : 0.2
        )
        .attr("stroke-width", 2);

      tooltip.style("opacity", 0);
    });

  createLegend(data);
}

function createLegend(data) {
  const legend = d3.select("#legend");
  legend.selectAll("*").remove();

  const uniqueCategories = [...new Set(data.map((d) => d.category))].sort();

  uniqueCategories.forEach((category) => {
    const item = legend
      .append("div")
      .attr(
        "class",
        `legend-item ${
          filteredCategories.size > 0 && !filteredCategories.has(category)
            ? "inactive"
            : ""
        }`
      )
      .on("click", function () {
        if (filteredCategories.has(category)) {
          filteredCategories.delete(category);
        } else {
          filteredCategories.add(category);
        }

        if (filteredCategories.size === uniqueCategories.length) {
          filteredCategories.clear();
        }

        createChart(currentData);
      });

    item
      .append("div")
      .attr("class", "legend-color")
      .style("background-color", colorScale(category));

    item.append("span").text(category);
  });
}

function updateDataMode() {
  currentDataMode = document.getElementById("dataMode").value;
  
  // Update button text
  const generateBtn = document.getElementById("generateBtn");
  if (currentDataMode === "real") {
    generateBtn.textContent = "Refresh Real Data";
  } else {
    generateBtn.textContent = "Generate New Synthetic Data";
  }
  
  generateData();
}

function updateSampleSize() {
  const size = document.getElementById("sampleSize").value;
  document.getElementById("currentSampleSize").textContent = size;
  generateData();
}

// Make functions globally available
window.generateData = generateData;
window.updateDataMode = updateDataMode;
window.updateSampleSize = updateSampleSize;

// Initialize
async function initializeApp() {
  // Load real data first
  await loadRealData();
  
  // Update button text based on data availability
  const generateBtn = document.getElementById("generateBtn");
  if (currentDataMode === "real") {
    generateBtn.textContent = "Refresh Real Data";
  } else {
    generateBtn.textContent = "Generate New Synthetic Data";
  }
  
  // Generate initial visualization
  generateData();
}

// Start the app
initializeApp();
