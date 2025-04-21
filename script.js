class DeadlockDetector {
    constructor() {
        this.processes = 0;
        this.resources = 0;
        this.allocationMatrix = [];
        this.maximumMatrix = [];
        this.totalInstances = [];
        this.network = null;
        this.nodes = new vis.DataSet();
        this.edges = new vis.DataSet();
        this.animationInProgress = false;
        this.processTypes = ['CPU', 'Memory', 'I/O', 'Network', 'Database'];
        this.resourceTypes = ['Shared', 'Exclusive', 'Preemptible', 'Non-preemptible', 'Renewable'];
        
        this.initializeEventListeners();
        this.showLoadingIndicator(false);
        this.addTooltips();
        this.addAnimationClasses();
    }

    initializeEventListeners() {
        document.getElementById('generateMatrices').addEventListener('click', () => this.generateMatrices());
        document.getElementById('detectDeadlock').addEventListener('click', () => this.detectDeadlock());
        document.getElementById('visualizeRAG').addEventListener('click', () => this.visualizeRAG());
        document.getElementById('suggestSolution').addEventListener('click', () => this.suggestSolution());
        document.getElementById('findMinResources').addEventListener('click', () => this.findMinResources());
        document.getElementById('addProcess').addEventListener('click', () => this.addProcess());
        document.getElementById('addResource').addEventListener('click', () => this.addResource());
    }

    addTooltips() {
        // Add tooltips to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.setAttribute('title', button.textContent.trim());
        });
    }

    addAnimationClasses() {
        // Add animation classes to elements
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach((button, index) => {
            button.style.setProperty('--button-index', index);
        });

        const resultBoxes = document.querySelectorAll('.result-box');
        resultBoxes.forEach((box, index) => {
            box.style.setProperty('--box-index', index);
        });
    }

    showLoadingIndicator(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (show) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }

    generateMatrices() {
        this.processes = parseInt(document.getElementById('processCount').value);
        this.resources = parseInt(document.getElementById('resourceCount').value);

        if (isNaN(this.processes) || isNaN(this.resources) || this.processes < 1 || this.resources < 1) {
            this.showNotification('Please enter valid numbers for processes and resources (minimum 1)', 'error');
            return;
        }

        // Generate Total Instances Matrix
        const totalInstancesDiv = document.getElementById('totalInstances');
        totalInstancesDiv.innerHTML = '';
        for (let i = 0; i < this.resources; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.value = '3';
            input.id = `total-${i}`;
            input.placeholder = `R${i} instances`;
            
            const select = document.createElement('select');
            select.id = `resource-type-${i}`;
            select.className = 'resource-type-select';
            
            this.resourceTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                select.appendChild(option);
            });
            
            inputGroup.appendChild(input);
            inputGroup.appendChild(select);
            totalInstancesDiv.appendChild(inputGroup);
        }

        // Generate Allocation Matrix
        this.generateMatrix('allocationMatrix', this.processes, this.resources, 'alloc');

        // Generate Maximum Matrix
        this.generateMatrix('maximumMatrix', this.processes, this.resources, 'max');
        
        this.showNotification('Matrices generated successfully!', 'success');
    }

    generateMatrix(containerId, rows, cols, prefix) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        // Add process type selection
        const processTypesDiv = document.createElement('div');
        processTypesDiv.className = 'process-types';
        for (let i = 0; i < rows; i++) {
            const select = document.createElement('select');
            select.id = `process-type-${i}`;
            select.className = 'process-type-select';
            
            this.processTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                select.appendChild(option);
            });
            
            processTypesDiv.appendChild(select);
        }
        container.appendChild(processTypesDiv);
        
        // Add matrix
        const matrixDiv = document.createElement('div');
        matrixDiv.className = 'matrix';
        for (let i = 0; i < rows; i++) {
            const row = document.createElement('div');
            row.className = 'matrix-row';
            row.style.setProperty('--row-index', i);
            for (let j = 0; j < cols; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.value = '1';
                input.id = `${prefix}-${i}-${j}`;
                input.placeholder = `P${i} R${j}`;
                row.appendChild(input);
            }
            matrixDiv.appendChild(row);
        }
        container.appendChild(matrixDiv);
    }

    getMatrixValues(prefix) {
        const matrix = [];
        for (let i = 0; i < this.processes; i++) {
            const row = [];
            for (let j = 0; j < this.resources; j++) {
                const value = parseInt(document.getElementById(`${prefix}-${i}-${j}`).value);
                if (isNaN(value) || value < 0) {
                    this.showNotification(`Please enter valid numbers in the ${prefix} matrix`, 'error');
                    return null;
                }
                row.push(value);
            }
            matrix.push(row);
        }
        return matrix;
    }

    getTotalInstances() {
        const instances = [];
        for (let i = 0; i < this.resources; i++) {
            const value = parseInt(document.getElementById(`total-${i}`).value);
            if (isNaN(value) || value < 0) {
                this.showNotification('Please enter valid numbers for total instances', 'error');
                return null;
            }
            instances.push(value);
        }
        return instances;
    }

    getProcessTypes() {
        const types = [];
        for (let i = 0; i < this.processes; i++) {
            const type = document.getElementById(`process-type-${i}`).value;
            types.push(type);
        }
        return types;
    }

    getResourceTypes() {
        const types = [];
        for (let i = 0; i < this.resources; i++) {
            const type = document.getElementById(`resource-type-${i}`).value;
            types.push(type);
        }
        return types;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Set the appropriate icon based on notification type
        let iconClass = '';
        if (type === 'success') {
            iconClass = 'fas fa-check-circle';
        } else if (type === 'error') {
            iconClass = 'fas fa-exclamation-circle';
        } else {
            iconClass = 'fas fa-info-circle';
        }
        
        notification.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${message}</span>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    visualizeRAG() {
        this.showLoadingIndicator(true);
        
        this.allocationMatrix = this.getMatrixValues('alloc');
        this.maximumMatrix = this.getMatrixValues('max');
        this.totalInstances = this.getTotalInstances();
        const processTypes = this.getProcessTypes();
        const resourceTypes = this.getResourceTypes();
        
        if (!this.allocationMatrix || !this.maximumMatrix || !this.totalInstances) {
            this.showLoadingIndicator(false);
            return;
        }

        // Clear previous graph
        this.nodes.clear();
        this.edges.clear();

        // Add process nodes with animation
        for (let i = 0; i < this.processes; i++) {
            setTimeout(() => {
                this.nodes.add({
                    id: `P${i}`,
                    label: `P${i} (${processTypes[i]})`,
                    color: '#97C2FC',
                    shape: 'circle',
                    font: {
                        size: 18,
                        face: 'Poppins',
                        color: '#ffffff'
                    },
                    shadow: true,
                    size: 35
                });
            }, i * 200);
        }

        // Add resource nodes with animation
        for (let i = 0; i < this.resources; i++) {
            setTimeout(() => {
                this.nodes.add({
                    id: `R${i}`,
                    label: `R${i} (${resourceTypes[i]})\n${this.totalInstances[i]}`,
                    color: '#FB7E81',
                    shape: 'diamond',
                    font: {
                        size: 16,
                        face: 'Poppins',
                        color: '#ffffff'
                    },
                    shadow: true,
                    size: 40
                });
            }, (this.processes + i) * 200);
        }

        // Create network
        const container = document.getElementById('graphContainer');
        const data = {
            nodes: this.nodes,
            edges: this.edges
        };
        const options = {
            nodes: {
                size: 35,
                font: {
                    size: 16,
                    face: 'Poppins',
                    color: '#ffffff'
                },
                borderWidth: 2,
                shadow: true
            },
            edges: {
                width: 2.5,
                font: {
                    size: 14,
                    face: 'Poppins',
                    color: '#ffffff'
                },
                shadow: true,
                smooth: {
                    type: 'curvedCW',
                    roundness: 0.2
                }
            },
            physics: {
                stabilization: true,
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 200
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200
            }
        };

        if (this.network) {
            this.network.destroy();
        }
        
        setTimeout(() => {
            this.network = new vis.Network(container, data, options);
            
            // Add event listeners for network
            this.network.on('stabilizationProgress', (params) => {
                if (params.iterations % 10 === 0) {
                    this.showLoadingIndicator(true);
                }
            });
            
            this.network.on('stabilizationIterationsDone', () => {
                this.showLoadingIndicator(false);
                
                // Add edges for allocation with animation
                let edgeCount = 0;
                for (let i = 0; i < this.processes; i++) {
                    for (let j = 0; j < this.resources; j++) {
                        if (this.allocationMatrix[i][j] > 0) {
                            setTimeout(() => {
                                this.edges.add({
                                    from: `R${j}`,
                                    to: `P${i}`,
                                    arrows: 'to',
                                    color: '#2B7CE9',
                                    label: this.allocationMatrix[i][j].toString(),
                                    font: {
                                        size: 14,
                                        face: 'Poppins',
                                        color: '#ffffff'
                                    },
                                    width: 3,
                                    shadow: true
                                });
                            }, edgeCount * 100);
                            edgeCount++;
                        }
                    }
                }

                // Add edges for requests with animation
                for (let i = 0; i < this.processes; i++) {
                    for (let j = 0; j < this.resources; j++) {
                        if (this.maximumMatrix[i][j] > this.allocationMatrix[i][j]) {
                            setTimeout(() => {
                                this.edges.add({
                                    from: `P${i}`,
                                    to: `R${j}`,
                                    arrows: 'to',
                                    color: '#FFA500',
                                    dashes: true,
                                    label: (this.maximumMatrix[i][j] - this.allocationMatrix[i][j]).toString(),
                                    font: {
                                        size: 14,
                                        face: 'Poppins',
                                        color: '#ffffff'
                                    },
                                    width: 2,
                                    shadow: true
                                });
                            }, edgeCount * 100);
                            edgeCount++;
                        }
                    }
                }
                
                this.showNotification('Resource Allocation Graph generated successfully!', 'success');
                
                // Add legend
                this.addLegend();
            });
        }, 100);
    }
    
    addLegend() {
        const legend = document.createElement('div');
        legend.className = 'graph-legend';
        legend.innerHTML = `
            <div class="legend-item">
                <div class="legend-color process"></div>
                <span>Process</span>
            </div>
            <div class="legend-item">
                <div class="legend-color resource"></div>
                <span>Resource</span>
            </div>
            <div class="legend-item">
                <div class="legend-color allocation"></div>
                <span>Allocation</span>
            </div>
            <div class="legend-item">
                <div class="legend-color request"></div>
                <span>Request</span>
            </div>
        `;
        
        const container = document.getElementById('graphContainer');
        container.parentNode.appendChild(legend);
    }

    detectDeadlock() {
        if (!this.allocationMatrix || !this.maximumMatrix) {
            this.showNotification('Please generate and fill in the matrices first', 'error');
            return;
        }
        
        const cycles = this.findCycles();
        const deadlockStatus = document.getElementById('deadlockStatus');
        const processTypes = this.getProcessTypes();
        const resourceTypes = this.getResourceTypes();
        
        if (cycles.length > 0) {
            let cycleDetails = cycles.map(cycle => {
                let details = cycle.map(node => {
                    if (node.startsWith('P')) {
                        const index = parseInt(node.substring(1));
                        return `${node} (${processTypes[index]})`;
                    } else {
                        const index = parseInt(node.substring(1));
                        return `${node} (${resourceTypes[index]})`;
                    }
                });
                return details.join(' → ');
            });
            
            deadlockStatus.innerHTML = `
                <h3><i class="fas fa-exclamation-triangle"></i> Deadlock Detected!</h3>
                <p>Found ${cycles.length} cycle(s):</p>
                <ul>
                    ${cycleDetails.map(cycle => `<li>${cycle}</li>`).join('')}
                </ul>
            `;
            deadlockStatus.style.borderLeftColor = 'var(--danger-color)';
            
            // Highlight cycles in the graph
            this.highlightCycles(cycles);
            
            this.showNotification('Deadlock detected in the system!', 'error');
        } else {
            deadlockStatus.innerHTML = `
                <h3><i class="fas fa-check-circle"></i> No Deadlock Detected</h3>
                <p>The system is in a safe state.</p>
            `;
            deadlockStatus.style.borderLeftColor = 'var(--success-color)';
            
            this.showNotification('No deadlock detected. System is safe.', 'success');
        }
    }

    findCycles() {
        const graph = this.buildGraph();
        const cycles = [];
        const visited = new Set();
        const path = [];

        const dfs = (node, start) => {
            if (path.length > 0 && node === start) {
                cycles.push([...path]);
                return;
            }

            if (visited.has(node)) return;

            visited.add(node);
            path.push(node);

            for (const neighbor of graph[node] || []) {
                dfs(neighbor, start);
            }

            path.pop();
            visited.delete(node);
        };

        for (let i = 0; i < this.processes; i++) {
            dfs(`P${i}`, `P${i}`);
        }

        return cycles;
    }
    //This function builds the graph for the deadlock detection
    buildGraph() {
        const graph = {};

        // Add allocation edges
        for (let i = 0; i < this.processes; i++) {
            for (let j = 0; j < this.resources; j++) {
                if (this.allocationMatrix[i][j] > 0) {
                    if (!graph[`R${j}`]) graph[`R${j}`] = [];
                    graph[`R${j}`].push(`P${i}`);
                }
            }
        }

        // Add request edges
        for (let i = 0; i < this.processes; i++) {
            for (let j = 0; j < this.resources; j++) {
                if (this.maximumMatrix[i][j] > this.allocationMatrix[i][j]) {
                    if (!graph[`P${i}`]) graph[`P${i}`] = [];
                    graph[`P${i}`].push(`R${j}`);
                }
            }
        }

        return graph;
    }

    highlightCycles(cycles) {
        if (!this.network) {
            this.showNotification('Please visualize the RAG first', 'error');
            return;
        }
        
        const edges = this.edges.get();
        edges.forEach(edge => {
            edge.color = '#2B7CE9';
        });

        cycles.forEach(cycle => {
            for (let i = 0; i < cycle.length; i++) {
                const from = cycle[i];
                const to = cycle[(i + 1) % cycle.length];
                
                const edge = edges.find(e => 
                    (e.from === from && e.to === to) || 
                    (e.from === to && e.to === from)
                );
                
                if (edge) {
                    edge.color = '#FF0000';
                    this.edges.update(edge);
                }
            }
        });

        this.network.setData({
            nodes: this.nodes,
            edges: this.edges
        });
        
        // Animate the cycles
        this.animateCycles(cycles);
    }
    
    animateCycles(cycles) {
        if (this.animationInProgress) return;
        this.animationInProgress = true;
        
        const edges = this.edges.get();
        const redEdges = edges.filter(edge => edge.color === '#FF0000');
        
        // Reset all edges to original color
        redEdges.forEach(edge => {
            edge.color = '#2B7CE9';
            this.edges.update(edge);
        });
        
        // Animate each cycle
        let cycleIndex = 0;
        const animateCycle = () => {
            if (cycleIndex >= cycles.length) {
                this.animationInProgress = false;
                return;
            }
            
            const cycle = cycles[cycleIndex];
            let edgeIndex = 0;
            
            const animateEdge = () => {
                if (edgeIndex >= cycle.length) {
                    // Cycle complete, move to next cycle
                    cycleIndex++;
                    setTimeout(animateCycle, 1000);
                    return;
                }
                
                const from = cycle[edgeIndex];
                const to = cycle[(edgeIndex + 1) % cycle.length];
                
                const edge = redEdges.find(e => 
                    (e.from === from && e.to === to) || 
                    (e.from === to && e.to === from)
                );
                
                if (edge) {
                    edge.color = '#FF0000';
                    this.edges.update(edge);
                }
                
                edgeIndex++;
                setTimeout(animateEdge, 300);
            };
            
            animateEdge();
        };
        
        animateCycle();
    }
 //This function suggests solutions for the deadlock
    suggestSolution() {
        if (!this.allocationMatrix || !this.maximumMatrix) {
            this.showNotification('Please generate and fill in the matrices first', 'error');
            return;
        }
        
        const cycles = this.findCycles();
        const suggestions = document.getElementById('suggestions');
        const processTypes = this.getProcessTypes();
        const resourceTypes = this.getResourceTypes();
        
        if (cycles.length === 0) {
            suggestions.innerHTML = '<h3><i class="fas fa-check-circle"></i> No Deadlock Detected</h3><p>No solutions needed.</p>';
            return;
        }

        const solutions = [];
        cycles.forEach(cycle => {
            // Find processes in the cycle
            const processes = cycle.filter(node => node.startsWith('P'));
            const resources = cycle.filter(node => node.startsWith('R'));
            
            // Get process and resource types
            const processType = processTypes[parseInt(processes[0].substring(1))];
            const resourceType = resourceTypes[parseInt(resources[0].substring(1))];
            
            // Suggest based on resource type
            if (resourceType === 'Preemptible') {
                solutions.push(`<i class="fas fa-exchange-alt"></i> Preempt resource ${resources[0]} (${resourceType}) from process ${processes[0]} (${processType})`);
            } else if (resourceType === 'Non-preemptible') {
                solutions.push(`<i class="fas fa-clock"></i> Wait for process ${processes[0]} (${processType}) to release resource ${resources[0]} (${resourceType})`);
            } else if (resourceType === 'Exclusive') {
                solutions.push(`<i class="fas fa-trash-alt"></i> Kill process ${processes[0]} (${processType}) to break the deadlock with exclusive resource ${resources[0]}`);
            } else {
                solutions.push(`<i class="fas fa-random"></i> Consider resource allocation order to prevent deadlock with ${resourceType} resource ${resources[0]}`);
            }
            
            // Suggest based on process type
            if (processType === 'CPU') {
                solutions.push(`<i class="fas fa-tachometer-alt"></i> Adjust CPU scheduling priority for process ${processes[0]}`);
            } else if (processType === 'I/O') {
                solutions.push(`<i class="fas fa-hdd"></i> Implement I/O scheduling to prevent deadlock with process ${processes[0]}`);
            } else if (processType === 'Database') {
                solutions.push(`<i class="fas fa-database"></i> Use transaction timeouts for database process ${processes[0]}`);
            }
        });

        suggestions.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> Suggested Solutions:</h3>
            <ul>
                ${solutions.map(solution => `<li>${solution}</li>`).join('')}
            </ul>
        `;
        
        this.showNotification('Solution suggestions generated', 'success');
    }
    //This function finds the minimum resources needed to avoid deadlock
    findMinResources() {
        if (!this.allocationMatrix || !this.maximumMatrix || !this.totalInstances) {
            this.showNotification('Please generate and fill in the matrices first', 'error');
            return;
        }
        
        this.showLoadingIndicator(true);
        
        const minResources = [...this.totalInstances];
        let found = false;
        const resourceTypes = this.getResourceTypes();
        
        // Use setTimeout to prevent UI freezing during calculation
        setTimeout(() => {
            while (!found) {
                // Try increasing each resource by 1
                for (let i = 0; i < this.resources; i++) {
                    minResources[i]++;
                    
                    // Check if this configuration is safe
                    if (this.isSafeState(minResources)) {
                        found = true;
                        break;
                    }
                }
            }
            
            const resourcesBox = document.getElementById('minResources');
            resourcesBox.innerHTML = `
                <h3><i class="fas fa-calculator"></i> Minimum Resources Needed:</h3>
                <ul>
                    ${minResources.map((count, i) => `<li><i class="fas fa-cube"></i> R${i} (${resourceTypes[i]}): ${count}</li>`).join('')}
                </ul>
            `;
            
            this.showLoadingIndicator(false);
            this.showNotification('Minimum resources calculated successfully', 'success');
        }, 100);
    }
    //This function checks if the current state is safe
    isSafeState(available) {
        const work = [...available];
        const finish = new Array(this.processes).fill(false);
        const need = this.calculateNeedMatrix();
        
        while (true) {
            let found = false;
            
            for (let i = 0; i < this.processes; i++) {
                if (!finish[i] && this.canAllocate(need[i], work)) {
                    for (let j = 0; j < this.resources; j++) {
                        work[j] += this.allocationMatrix[i][j];
                    }
                    finish[i] = true;
                    found = true;
                }
            }
            
            if (!found) break;
        }
        
        return finish.every(f => f);
    }
    //This function calculates the need matrix
    calculateNeedMatrix() {
        const need = [];
        for (let i = 0; i < this.processes; i++) {
            const row = [];
            for (let j = 0; j < this.resources; j++) {
                row.push(this.maximumMatrix[i][j] - this.allocationMatrix[i][j]);
            }
            need.push(row);
        }
        return need;
    }
    //This function checks if the process can allocate the resources
    canAllocate(need, available) {
        return need.every((n, i) => n <= available[i]);
    }
    //This function adds a process
    addProcess() {
        this.processes++;
        document.getElementById('processCount').value = this.processes;
        this.generateMatrices();
        this.showNotification(`Added process P${this.processes-1}`, 'success');
    }
    //This function adds a resource
    addResource() {
        this.resources++;
        document.getElementById('resourceCount').value = this.resources;
        this.generateMatrices();
        this.showNotification(`Added resource R${this.resources-1}`, 'success');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const detector = new DeadlockDetector();
}); 