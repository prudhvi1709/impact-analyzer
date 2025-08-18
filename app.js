class ImpactAnalyzer {
    constructor() {
        this.margin = { top: 60, right: 200, bottom: 60, left: 60 };
        this.width = 1160 - this.margin.left - this.margin.right;
        this.height = 540 - this.margin.top - this.margin.bottom;
        
        this.svg = d3.select('#chart')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom);
        
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        
        this.tooltip = d3.select('#tooltip');
        this.expandedCategory = null;
        this.isPlaying = false;
        this.playInterval = null;
        
        this.dateRange = getDateRange();
        this.currentStartDate = this.dateRange.min;
        this.currentEndDate = this.dateRange.max;
        
        this.setupChart();
        this.setupControls();
        this.updateVisualization();
    }
    
    setupChart() {
        // Scales
        this.xScale = d3.scaleLinear().domain([0, 700000]).range([0, this.width]);
        this.yScale = d3.scaleLinear().domain([0, 2500000]).range([this.height, 0]);
        this.radiusScale = d3.scaleSqrt().domain([0, 500]).range([8, 60]);
        
        // Format function for currency
        const formatCurrency = d => d >= 1000000 ? `$${(d/1000000).toFixed(0)}M` : d >= 1000 ? `$${(d/1000).toFixed(0)}K` : `$${d}`;
        
        // Axes
        this.g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale).tickFormat(formatCurrency));
        
        this.g.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(this.yScale).tickFormat(formatCurrency));
        
        // Axis labels
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', `translate(${this.width/2}, ${this.height + 40})`)
            .style('text-anchor', 'middle')
            .text('Effort per Issue (USD)');
        
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', -40)
            .attr('x', -this.height/2)
            .style('text-anchor', 'middle')
            .text('Impact per Day (USD)');
        
        // Grid lines
        [this.xScale, this.yScale].forEach((scale, i) => {
            this.g.append('g')
                .attr('class', 'grid')
                .attr('transform', i ? '' : `translate(0,${this.height})`)
                .call((i ? d3.axisLeft : d3.axisBottom)(scale)
                    .tickSize(i ? -this.width : -this.height)
                    .tickFormat(''))
                .selectAll('line')
                .attr('class', 'grid-line');
        });
        
        // Quadrant labels
        const labels = [
            { text: 'Quick Wins\\n(Low Effort, High Impact)', x: 10, y: 20, anchor: 'start' },
            { text: 'Major Projects\\n(High Effort, High Impact)', x: this.width - 10, y: 20, anchor: 'end' },
            { text: 'Fill-ins\\n(Low Effort, Low Impact)', x: 10, y: this.height - 40, anchor: 'start' },
            { text: 'Thankless Tasks\\n(High Effort, Low Impact)', x: this.width - 10, y: this.height - 40, anchor: 'end' }
        ];
        
        labels.forEach(label => {
            const textElement = this.g.append('text')
                .attr('class', 'quadrant-label')
                .attr('x', label.x)
                .attr('y', label.y)
                .style('text-anchor', label.anchor);
            
            label.text.split('\\n').forEach((line, i) => {
                textElement.append('tspan')
                    .attr('x', label.x)
                    .attr('dy', i * 12)
                    .text(line);
            });
        });
        
        // Legend
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width + this.margin.left + 20}, 80)`);
        
        legend.append('text')
            .style('font-weight', 'bold')
            .text('Categories');
        
        const categories = getCategories();
        const legendItems = legend.selectAll('.legend-item')
            .data(categories)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${20 + i * 20})`);
        
        legendItems.append('circle')
            .attr('cx', 6)
            .attr('r', 6)
            .style('fill', d => categoryColors[d]);
        
        legendItems.append('text')
            .attr('x', 20)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .text(d => d);
    }
    
    setupControls() {
        const startSlider = d3.select('#startDate');
        const endSlider = d3.select('#endDate');
        const playButton = d3.select('#playButton');
        
        const totalDays = Math.ceil((this.dateRange.max - this.dateRange.min) / (1000 * 60 * 60 * 24));
        
        startSlider.attr('max', totalDays).on('input', () => this.onDateRangeChange());
        endSlider.attr('max', totalDays).attr('value', totalDays).on('input', () => this.onDateRangeChange());
        playButton.on('click', () => this.togglePlay());
        
        this.updateDateLabels();
        this.updateSliderTrack();
    }
    
    getBubblePosition(d) {
        if (d.subcategory) {
            return { x: this.xScale(d.effortPerIssue), y: this.yScale(d.impactPerDay) };
        } else {
            const avgImpactPerDay = d.subcategories.reduce((sum, sub) => sum + (sub.impactPerDay * sub.count), 0) / d.count;
            return { x: this.xScale(d.totalEffort / d.count), y: this.yScale(avgImpactPerDay) };
        }
    }
    
    updateVisualization() {
        const rawData = aggregateDataForPeriod(this.currentStartDate, this.currentEndDate);
        const currentData = this.expandedCategory ? 
            rawData.filter(d => d.category === this.expandedCategory) : 
            aggregateByCategory(rawData);
        
        const bubbles = this.g.selectAll('.bubble')
            .data(currentData, d => d.subcategory || d.category);
        
        // Remove old bubbles
        bubbles.exit().transition().duration(500).attr('r', 0).style('opacity', 0).remove();
        
        // Add new bubbles
        const newBubbles = bubbles.enter()
            .append('circle')
            .attr('class', d => `bubble ${d.subcategory ? 'subcategory' : 'category'}`)
            .attr('r', 0)
            .style('fill', d => categoryColors[d.category])
            .style('opacity', 0);
        
        // Update all bubbles
        bubbles.merge(newBubbles)
            .on('click', (event, d) => {
                this.expandedCategory = d.subcategory ? null : d.category;
                this.updateVisualization();
            })
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.tooltip.classed('visible', false))
            .transition().duration(500)
            .attr('cx', d => this.getBubblePosition(d).x)
            .attr('cy', d => this.getBubblePosition(d).y)
            .attr('r', d => this.radiusScale(d.count))
            .style('opacity', 1);
    }
    
    showTooltip(event, d) {
        const isSubcategory = !!d.subcategory;
        let content = `<h4>${d.category}</h4>`;
        
        if (isSubcategory) {
            content += `<p><strong>Subcategory:</strong> ${d.subcategory}</p>`;
            content += `<p><strong>Issues:</strong> ${d.count}</p>`;
            content += `<p><strong>Effort per Issue:</strong> $${d.effortPerIssue.toLocaleString()}</p>`;
            content += `<p><strong>Impact per Day:</strong> $${d.impactPerDay.toLocaleString()}</p>`;
        } else {
            const avgEffort = Math.round(d.totalEffort / d.count);
            const avgImpact = Math.round(d.totalImpact / d.count);
            content += `<p><strong>Issues:</strong> ${d.count}</p>`;
            content += `<p><strong>Avg Effort:</strong> $${avgEffort.toLocaleString()}</p>`;
            content += `<p><strong>Avg Impact:</strong> $${avgImpact.toLocaleString()}</p>`;
        }
        
        this.tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(content)
            .classed('visible', true);
    }
    
    onDateRangeChange() {
        const startSlider = d3.select('#startDate');
        const endSlider = d3.select('#endDate');
        let startDays = +startSlider.property('value');
        let endDays = +endSlider.property('value');
        
        if (startDays >= endDays) {
            startDays = endDays - 1;
            startSlider.property('value', startDays);
        }
        
        this.currentStartDate = new Date(this.dateRange.min.getTime() + startDays * 24 * 60 * 60 * 1000);
        this.currentEndDate = new Date(this.dateRange.min.getTime() + endDays * 24 * 60 * 60 * 1000);
        
        this.updateDateLabels();
        this.updateSliderTrack();
        this.updateVisualization();
    }
    
    updateDateLabels() {
        d3.select('#startLabel').text(this.currentStartDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
        d3.select('#endLabel').text(this.currentEndDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
    }
    
    updateSliderTrack() {
        const startSlider = d3.select('#startDate');
        const endSlider = d3.select('#endDate');
        const startPercent = (+startSlider.property('value') / +startSlider.property('max')) * 100;
        const endPercent = (+endSlider.property('value') / +endSlider.property('max')) * 100;
        
        d3.select('.slider-track')
            .style('left', startPercent + '%')
            .style('width', (endPercent - startPercent) + '%');
    }
    
    togglePlay() {
        const playButton = d3.select('#playButton');
        
        if (this.isPlaying) {
            this.isPlaying = false;
            playButton.text('▶ Play').classed('playing', false);
            if (this.playInterval) {
                clearInterval(this.playInterval);
                this.playInterval = null;
            }
        } else {
            this.isPlaying = true;
            playButton.text('⏸ Pause').classed('playing', true);
            
            const startSlider = d3.select('#startDate');
            const endSlider = d3.select('#endDate');
            const maxDays = +endSlider.property('max');
            const duration = +endSlider.property('value') - +startSlider.property('value');
            
            this.playInterval = setInterval(() => {
                let currentEnd = +endSlider.property('value');
                if (currentEnd >= maxDays) {
                    this.togglePlay();
                    return;
                }
                
                const newStart = Math.min(+startSlider.property('value') + 10, maxDays - duration);
                const newEnd = Math.min(currentEnd + 10, maxDays);
                
                startSlider.property('value', newStart);
                endSlider.property('value', newEnd);
                this.onDateRangeChange();
            }, 100);
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.querySelector('.chart-container');
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 18px; color: #666;">Loading data...</div>';
    
    if (await loadData()) {
        container.innerHTML = '<svg id="chart"></svg><div class="tooltip" id="tooltip"></div>';
        new ImpactAnalyzer();
    } else {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 18px; color: #e74c3c;">Error loading data. Check console for details.</div>';
    }
});