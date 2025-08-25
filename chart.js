// Chart rendering and interactions
class Chart {
  constructor(config) {
    this.config = config;
    this.margin = config.chart.margin;
    this.height = config.chart.height - this.margin.top - this.margin.bottom;
    this.colorScale = d3.scaleOrdinal(d3[config.chart.colors.scheme]);
    this.severityColors = config.chart.colors.severity;
    this.filteredCategories = new Set();
  }

  render(data, dateRange) {
    d3.select("#chart").selectAll("*").remove();

    const container = document.querySelector('#chart').parentElement;
    const containerWidth = container.getBoundingClientRect().width;
    const dynamicWidth = containerWidth - this.margin.left - this.margin.right;

    const svg = d3.select("#chart")
      .attr("width", containerWidth)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    const g = svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this._createScales(data, dynamicWidth);
    this._createAxes(g, dynamicWidth);
    this._createLabels(g, dynamicWidth, dateRange);
    this._createBubbles(g, data);
    this._createLegend(data);
  }

  _createScales(data, width) {
    this.xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.avgResolveTime))
      .nice()
      .range([0, width]);

    this.yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.businessImpact))
      .nice()
      .range([this.height, 0]);

    this.radiusScale = d3.scaleSqrt()
      .domain(d3.extent(data, d => d.numIssues))
      .range([4, 35]);
  }

  _createAxes(g, width) {
    g.append("g")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale));

    g.append("g")
      .call(d3.axisLeft(this.yScale).tickFormat(d => `$${d3.format(".2s")(d)}`));
  }

  _createLabels(g, width, dateRange) {
    g.append("text")
      .attr("transform", `translate(${width / 2}, ${this.height + 50})`)
      .style("text-anchor", "middle")
      .text("Average Time to Resolve (hours)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -70)
      .attr("x", -this.height / 2)
      .style("text-anchor", "middle")
      .text("Estimated Per-Day Business Impact (USD)");

    g.append("text")
      .attr("x", width / 2)
      .attr("y", -30)
      .text(`Service Desk Issues: Business Impact vs Resolution Time (${dateRange})`);
  }

  _createBubbles(g, data) {
    const tooltip = d3.select("#tooltip");

    g.selectAll(".bubble")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("cx", d => this.xScale(d.avgResolveTime))
      .attr("cy", d => this.yScale(d.businessImpact))
      .attr("r", d => this.radiusScale(d.numIssues))
      .attr("fill", d => this._getBubbleColor(d))
      .attr("opacity", d => this._getBubbleOpacity(d))
      .attr("stroke", d => this.severityColors[d.severity])
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => this._showTooltip(event, d, tooltip, g))
      .on("mouseout", () => this._hideTooltip(tooltip, g));

    d3.select("#chart").on("mouseleave", () => this._hideTooltip(tooltip, g));
  }

  _getBubbleColor(d) {
    return this.filteredCategories.size === 0 || this.filteredCategories.has(d.category)
      ? this.colorScale(d.category) : "#cccccc";
  }

  _getBubbleOpacity(d) {
    return this.filteredCategories.size === 0 || this.filteredCategories.has(d.category) ? 0.7 : 0.2;
  }

  _showTooltip(event, d, tooltip, g) {
    // Hide tooltip first
    tooltip.classed("d-none", true);
    
    g.selectAll(".bubble")
      .attr("opacity", bubbleD => this._getBubbleOpacity(bubbleD))
      .attr("stroke-width", 2);
    
    d3.select(event.target).attr("opacity", 1).attr("stroke-width", 3);

    tooltip.html(`
      <strong>${d.category}</strong><br/>
      ${d.subCategory ? `<strong>Sub-category:</strong> ${d.subCategory}<br/>` : ''}
      <strong>Severity:</strong> ${d.severity}<br/>
      ${d.requestId ? `<strong>Request ID:</strong> ${d.requestId}<br/>` : ''}
      ${d.status ? `<strong>Status:</strong> ${d.status}<br/>` : ''}
      <strong>Issues:</strong> ${d.numIssues.toLocaleString()}<br/>
      <strong>Business Impact:</strong> $${d.businessImpact.toLocaleString()}/day<br/>
      <strong>Avg Resolve Time:</strong> ${d.avgResolveTime} hours<br/>
      <strong>Total Exposure:</strong> $${Math.round((d.businessImpact * d.avgResolveTime) / 24).toLocaleString()}
    `);

    const position = this._getTooltipPosition(event);
    tooltip.classed("d-none", false)
      .style("left", position.left + "px")
      .style("top", position.top + "px");
  }

  _hideTooltip(tooltip, g) {
    g.selectAll(".bubble")
      .attr("opacity", d => this._getBubbleOpacity(d))
      .attr("stroke-width", 2);
    tooltip.classed("d-none", true);
  }

  _getTooltipPosition(event) {
    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    const viewportWidth = document.documentElement.clientWidth || document.body.clientWidth;
    
    let left = event.pageX + 10;
    const top = 10; // Always position at top of viewport
    
    // Adjust horizontal position if tooltip would go off-screen
    const tooltipElement = document.getElementById("tooltip");
    const tooltipWidth = tooltipElement.offsetWidth || 320; // fallback to max-width
    
    if (left + tooltipWidth > viewportWidth + scrollLeft) {
      left = event.pageX - tooltipWidth - 10;
    }
    if (left < scrollLeft) left = scrollLeft + 10;
    
    return { left, top };
  }

  _createLegend(data) {
    const legend = d3.select("#legend");
    legend.selectAll("*").remove();

    const uniqueCategories = [...new Set(data.map(d => d.category))].sort();

    uniqueCategories.forEach(category => {
      const itemDiv = document.createElement('div');
      const isInactive = this.filteredCategories.size > 0 && !this.filteredCategories.has(category);
      itemDiv.className = `d-flex align-items-center gap-1 badge ${isInactive ? "bg-secondary" : "bg-primary"}`;
      itemDiv.style.cursor = 'pointer';
      itemDiv.style.opacity = isInactive ? '0.5' : '1';
      
      itemDiv.innerHTML = `
        <div class="rounded-circle" style="width: 12px; height: 12px; background-color: ${this.colorScale(category)};"></div>
        <span class="small">${category}</span>
      `;
      
      itemDiv.addEventListener('click', () => this._toggleCategory(category, data, uniqueCategories));
      itemDiv.addEventListener('mouseenter', () => {
        if (!isInactive) itemDiv.style.opacity = '0.7';
      });
      itemDiv.addEventListener('mouseleave', () => {
        itemDiv.style.opacity = isInactive ? '0.5' : '1';
      });
      
      legend.node().appendChild(itemDiv);
    });
  }

  _toggleCategory(category, data, uniqueCategories) {
    if (this.filteredCategories.has(category)) {
      this.filteredCategories.delete(category);
    } else {
      this.filteredCategories.add(category);
    }

    if (this.filteredCategories.size === uniqueCategories.length) {
      this.filteredCategories.clear();
    }

    // Re-render with current data - using global app reference
    app.refreshChart();
  }
}