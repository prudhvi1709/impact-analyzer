// Main application logic - data management and coordination
class DataManager {
  constructor(config) {
    this.config = config;
    this.csvData = null;
    this.availableDates = [];
    this.currentData = [];
    this.startDateIndex = 0;
    this.endDateIndex = 0;
  }

  async loadConfiguration() {
    const response = await fetch('config.json');
    return await response.json();
  }

  async loadCSV() {
    try {
      const response = await fetch(this.config.dataSource.fileName);
      const text = await response.text();
      this.csvData = this._parseCSV(text);
      
      this.availableDates = [...new Set(this.csvData.map(row => row.created_time.split(' ')[0]))].sort();
      this.startDateIndex = 0;
      this.endDateIndex = Math.min(this.availableDates.length - 1, 30);
      
      return this.csvData;
    } catch (error) {
      console.error('Error loading CSV:', error);
      return null;
    }
  }

  _parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      return row;
    });
  }

  generateData(mode, sampleSize, startIdx, endIdx) {
    this.startDateIndex = startIdx;
    this.endDateIndex = endIdx;
    
    this.currentData = mode === "real" && this.csvData 
      ? this._generateRealData(sampleSize) 
      : this._generateSyntheticData(mode, sampleSize);
    
    return this.currentData;
  }

  _generateRealData(sampleSize) {
    if (!this.csvData) return [];

    const startDate = this.availableDates[this.startDateIndex];
    const endDate = this.availableDates[this.endDateIndex];
    const filtered = this.csvData.filter(row => {
      const rowDate = row.created_time.split(' ')[0];
      return rowDate >= startDate && rowDate <= endDate;
    });
    
    if (!filtered.length) return [];
    
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(sampleSize, shuffled.length));
    
    return selected.map((item, i) => ({
      category: item.category || "Unknown",
      subCategory: item.sub_category || "",
      numIssues: 1,
      businessImpact: parseFloat(item.est_per_day_cost_usd) || 1000,
      avgResolveTime: item.resolved_time ? 
        this._calculateHours(item.created_time, item.resolved_time) : 
        parseFloat(item.resolution_hours) || 24,
      severity: item.severity || "Medium",
      requestId: item.RequestID,
      status: item.request_status,
      id: i,
    }));
  }

  _calculateHours(start, end) {
    try {
      return Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60);
    } catch {
      return 24;
    }
  }

  _generateSyntheticData(mode, sampleSize) {
    const categories = this.csvData
      ? [...new Set(this.csvData.map(item => item.category).filter(Boolean))]
      : this.config.defaultCategories;

    return Array.from({ length: sampleSize }, (_, i) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const numIssues = this._generateSyntheticIssues();
      const severity = this._getSeverity();
      
      return {
        category,
        numIssues,
        businessImpact: this._getBusinessImpact(mode, numIssues, severity),
        avgResolveTime: this._getResolveTime(mode, numIssues, severity),
        severity: severity.severity,
        id: i,
      };
    });
  }

  _generateSyntheticIssues() {
    const ranges = [
      { threshold: 0.25, base: 1, range: 9 },
      { threshold: 0.5, base: 10, range: 52 },
      { threshold: 0.75, base: 62, range: 268 },
      { threshold: 0.9, base: 330, range: 1282 },
      { threshold: 0.95, base: 1612, range: 1123 },
      { threshold: 1.0, base: 2735, range: 5364 }
    ];
    
    const rand = Math.random();
    const range = ranges.find(r => rand < r.threshold);
    return Math.max(1, Math.round(range.base + Math.random() * range.range));
  }

  _getSeverity() {
    const tiers = this.config.severityTiers;
    const rand = Math.random();
    
    if (rand < tiers[2].probability) return tiers[2]; // High
    if (rand < tiers[2].probability + tiers[1].probability) return tiers[1]; // Medium
    return tiers[0]; // Low
  }

  _getBusinessImpact(mode, numIssues, severity) {
    if (mode === "enhanced") {
      const issueMultiplier = Math.log(numIssues + 1) / Math.log(10);
      return Math.round(severity.dailyImpact * issueMultiplier * (0.8 + Math.random() * 0.4));
    }
    
    const baseImpact = numIssues * (15 + Math.random() * 35);
    return Math.max(500, Math.round(baseImpact + (Math.random() - 0.5) * baseImpact * 0.6));
  }

  _getResolveTime(mode, numIssues, severity) {
    if (mode === "enhanced") {
      const baseTimes = { Low: 24, Medium: 48, High: 96 };
      const complexityFactor = Math.log(numIssues + 1) / Math.log(10);
      return Math.round(baseTimes[severity.severity] * complexityFactor * (0.5 + Math.random()) * 10) / 10;
    }
    
    const urgencyFactor = Math.log(numIssues * 50) / Math.log(10);
    return Math.round(Math.max(1, 100 - urgencyFactor * 10 + Math.random() * 80) * 10) / 10;
  }

  getDateRange() {
    return this.availableDates.length > 0 
      ? `${this.availableDates[this.startDateIndex]} to ${this.availableDates[this.endDateIndex]}`
      : '';
  }

  getStats(data) {
    return {
      totalIssues: d3.sum(data, d => d.numIssues),
      totalImpact: d3.sum(data, d => d.businessImpact),
      avgResolveTime: d3.mean(data, d => d.avgResolveTime),
      highSeverityCount: data.filter(d => d.severity === "High").length,
      categoriesCount: data.length
    };
  }
}

// UI Manager for DOM updates and event handling
class UIManager {
  constructor(config, dataManager) {
    this.config = config;
    this.dataManager = dataManager;
  }

  updateFromConfig() {
    document.querySelector('h1').textContent = this.config.ui.title;
    
    const actualCategoryCount = this.dataManager.csvData
      ? new Set(this.dataManager.csvData.map(item => item.category).filter(Boolean)).size
      : this.config.dataSource.totalCategories;
      
    document.querySelector('.alert').innerHTML = `
      <strong>Data Source:</strong> ${this.config.dataSource.description} (${actualCategoryCount} categories analyzed)<br>
      <strong>Visualization:</strong> Interactive bubble chart showing business impact vs resolution time<br>
      <strong>Methodology:</strong> ${this.config.ui.methodology}
    `;
    
    this._updateSeverityLegend();
  }

  _updateSeverityLegend() {
    const severityLegend = document.getElementById('severityLegend');
    severityLegend.innerHTML = '';
    
    this.config.severityTiers.forEach(tier => {
      const item = document.createElement('div');
      item.className = 'd-flex align-items-center gap-2';
      item.innerHTML = `
        <div style="width: 12px; height: 12px; background: ${this.config.chart.colors.severity[tier.severity]}; border-radius: 50%;"></div>
        <span class="small">${tier.severity} Impact ($${tier.dailyImpact.toLocaleString()}/day)</span>
      `;
      severityLegend.appendChild(item);
    });
  }

  updateStats(data) {
    const stats = this.dataManager.getStats(data);
    const cards = [
      { value: stats.totalIssues.toLocaleString(), label: "Total Issues" },
      { value: `$${(stats.totalImpact / 1000).toFixed(0)}K`, label: "Total Daily Impact" },
      { value: `${stats.avgResolveTime.toFixed(1)}h`, label: "Avg Resolve Time" },
      { value: stats.highSeverityCount, label: "High Severity Items" },
      { value: stats.categoriesCount, label: "Categories Analyzed" }
    ];

    document.getElementById("statsPanel").innerHTML = cards
      .map(card => `
        <div class="col-md">
          <div class="card text-center bg-light">
            <div class="card-body py-3">
              <h4 class="text-primary mb-1">${card.value}</h4>
              <small class="text-muted">${card.label}</small>
            </div>
          </div>
        </div>
      `).join('');
  }

  initializeDateSliders() {
    if (!this.dataManager.availableDates.length) return;
    
    const startSlider = document.getElementById("startDateSlider");
    const endSlider = document.getElementById("endDateSlider");
    const maxIndex = this.dataManager.availableDates.length - 1;
    
    startSlider.max = endSlider.max = maxIndex;
    startSlider.value = this.dataManager.startDateIndex;
    endSlider.value = this.dataManager.endDateIndex;
    
    document.getElementById("minDate").textContent = this.dataManager.availableDates[0];
    document.getElementById("maxDate").textContent = this.dataManager.availableDates[maxIndex];
    
    this.updateDateRange(this.dataManager.startDateIndex, this.dataManager.endDateIndex);
  }

  updateDateRange(startIndex, endIndex) {
    if (!this.dataManager.availableDates.length) return;
    
    if (startIndex > endIndex) [startIndex, endIndex] = [endIndex, startIndex];
    
    this.dataManager.startDateIndex = parseInt(startIndex);
    this.dataManager.endDateIndex = parseInt(endIndex);
    
    const startDate = this.dataManager.availableDates[this.dataManager.startDateIndex];
    const endDate = this.dataManager.availableDates[this.dataManager.endDateIndex];
    const daysDiff = this.dataManager.endDateIndex - this.dataManager.startDateIndex + 1;
    
    document.getElementById("startDate").textContent = startDate;
    document.getElementById("endDate").textContent = endDate;
    document.getElementById("dayCount").textContent = daysDiff;
  }

  updateSampleSizeDisplay() {
    const size = document.getElementById("sampleSize").value;
    document.getElementById("currentSampleSize").textContent = size;
  }

  updateGenerateButton(mode) {
    const btn = document.getElementById("generateBtn");
    btn.textContent = mode === "real" ? "Refresh Real Data" : "Generate New Synthetic Data";
  }

  setupEventListeners(app) {
    document.getElementById('generateBtn').addEventListener('click', () => app.generateData());
    document.getElementById('dataMode').addEventListener('change', (e) => app.changeDataMode(e.target.value));
    document.getElementById('sampleSize').addEventListener('change', () => app.generateData());
    document.getElementById('startDateSlider').addEventListener('input', (e) => app.updateStartDate(e.target.value));
    document.getElementById('endDateSlider').addEventListener('input', (e) => app.updateEndDate(e.target.value));
  }
}

// Main application coordinator
class App {
  constructor() {
    this.config = null;
    this.dataManager = null;
    this.chart = null;
    this.ui = null;
    this.currentDataMode = "real";
  }

  async initialize() {
    try {
      this.config = await new DataManager().loadConfiguration();
      this.dataManager = new DataManager(this.config);
      this.chart = new Chart(this.config);
      this.ui = new UIManager(this.config, this.dataManager);

      await this.dataManager.loadCSV();
      this.ui.updateFromConfig();
      this.ui.updateGenerateButton(this.currentDataMode);
      this.ui.setupEventListeners(this);
      this.ui.initializeDateSliders();
      
      this.generateData();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      alert('Failed to load configuration. Please check config.json file.');
    }
  }

  generateData() {
    const sampleSize = parseInt(document.getElementById("sampleSize").value);
    const data = this.dataManager.generateData(
      this.currentDataMode, 
      sampleSize, 
      this.dataManager.startDateIndex, 
      this.dataManager.endDateIndex
    );

    this.ui.updateStats(data);
    this.ui.updateSampleSizeDisplay();
    
    const dateRange = this.currentDataMode === 'real' 
      ? `Real CSV data - ${this.dataManager.getDateRange()}` 
      : `${this.currentDataMode} data`;
    
    this.chart.render(data, dateRange);
  }

  changeDataMode(mode) {
    this.currentDataMode = mode;
    this.ui.updateGenerateButton(mode);
    this.generateData();
  }

  updateStartDate(index) {
    this.ui.updateDateRange(index, this.dataManager.endDateIndex);
    if (this.currentDataMode === "real") this.generateData();
  }

  updateEndDate(index) {
    this.ui.updateDateRange(this.dataManager.startDateIndex, index);
    if (this.currentDataMode === "real") this.generateData();
  }

  refreshChart() {
    const dateRange = this.currentDataMode === 'real' 
      ? `Real CSV data - ${this.dataManager.getDateRange()}` 
      : `${this.currentDataMode} data`;
    this.chart.render(this.dataManager.currentData, dateRange);
  }
}

// Global app instance for chart callbacks
const app = new App();
app.initialize();
