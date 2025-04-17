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
    