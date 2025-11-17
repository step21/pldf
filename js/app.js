// Main Application
class InterviewApp {
    constructor() {
        this.engine = null;
        this.stateManager = new StateManager();
        this.templateProcessor = new TemplateProcessor();
        this.validator = new Validator();
        this.visualizer = new Visualizer();
        
        this.elements = {
            questionArea: document.getElementById('question-area'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            progressFill: document.getElementById('progress-fill'),
            visualizationContainer: document.getElementById('visualization-container'),
            documentPreview: document.getElementById('document-preview'),
            previewContent: document.getElementById('preview-content'),
            mermaidDiagram: document.getElementById('mermaid-diagram')
        };
        
        this.currentValidation = { valid: true };
        this.init();
    }

    async init() {
        // Load interview definition
        const definition = await this.loadDefinition();
        if (!definition) {
            this.showLoadError();
            return;
        }
        
        this.engine = new InterviewEngine(definition);
        this.engine.subscribe(state => this.render());
        
        // Check for saved state
        const urlState = this.stateManager.loadFromURL();
        const savedState = urlState || this.stateManager.loadFromStorage();
        
        if (savedState) {
            this.engine.initialize(savedState);
        }
        
        this.setupEventListeners();
        this.render();
    }

    async loadDefinition() {
        // Try to load from URL parameter first
        const params = new URLSearchParams(window.location.search);
        const definitionUrl = params.get('interview') || 'interviews/sample.yml';
        
        try {
            const response = await fetch(definitionUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText} - Failed to fetch ${definitionUrl}`);
            }
            
            const yamlText = await response.text();
            
            if (!yamlText.trim()) {
                throw new Error(`Empty YAML file: ${definitionUrl}`);
            }
            
            const definition = jsyaml.load(yamlText);
            
            if (!definition || !definition.questions) {
                throw new Error(`Invalid YAML structure: Missing questions array in ${definitionUrl}`);
            }
            
            return definition;
        } catch (error) {
            // Log detailed error information
            console.error('=== INTERVIEW LOAD FAILURE ===');
            console.error('URL:', definitionUrl);
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);
            console.error('===============================');
            return null;
        }
    }


    setupEventListeners() {
        this.elements.prevBtn.addEventListener('click', () => this.handlePrevious());
        this.elements.nextBtn.addEventListener('click', () => this.handleNext());
        document.getElementById('reset-btn').addEventListener('click', () => this.handleReset());
        
        // Save state on before unload
        window.addEventListener('beforeunload', () => {
            if (this.engine) {
                this.stateManager.saveState(this.engine.getState());
            }
        });

        document.getElementById('download-md').addEventListener('click', () => this.downloadMarkdown());
        document.getElementById('download-html').addEventListener('click', () => this.downloadHTML());
        document.getElementById('copy-url').addEventListener('click', () => this.copyShareURL());
    }

    render() {
        if (!this.engine) {
            this.elements.questionArea.innerHTML = '<p>Loading interview...</p>';
            return;
        }
        
        const question = this.engine.getCurrentQuestion();
        
        if (question) {
            this.renderQuestion(question);
            this.updateNavigation();
            this.updateProgress();
        } else if (this.engine.state.completed) {
            this.renderCompletion();
        }
    }

    renderQuestion(question) {
        const currentValue = this.engine.state.answers[question.variable] || '';
        
        let html = `<div class="question" data-question-id="${question.id}">`;
        html += `<label for="${question.variable}">${question.question}`;
        if (question.required) {
            html += ' <span style="color: red;">*</span>';
        }
        html += '</label>';
        
        // Render input based on type
        switch (question.type) {
            case 'text':
                html += `<input type="text" id="${question.variable}" value="${currentValue}" />`;
                break;
                
            case 'email':    // does this type actually exist in docassemble?
                html += `<input type="email" id="${question.variable}" value="${currentValue}" />`;
                break;
                
            case 'integer':
            case 'number':
                html += `<input type="number" id="${question.variable}" value="${currentValue}" />`;
                break;
                
            case 'yesno':
                html += `
                    <div class="radio-group">
                        <label>
                            <input type="radio" name="${question.variable}" value="true" 
                                ${currentValue === true ? 'checked' : ''} /> Yes
                        </label>
                        <label>
                            <input type="radio" name="${question.variable}" value="false" 
                                ${currentValue === false ? 'checked' : ''} /> No
                        </label>
                    </div>
                `;
                break;
                
            case 'dropdown':
                html += `<select id="${question.variable}">`;
                html += '<option value="">Select an option</option>';
                question.options.forEach(option => {
                    const selected = currentValue === option.value ? 'selected' : '';
                    html += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                });
                html += '</select>';
                break;
                
            case 'radio':
                html += '<div class="radio-group">';
                question.options.forEach(option => {
                    const checked = currentValue === option.value ? 'checked' : '';
                    html += `
                        <label>
                            <input type="radio" name="${question.variable}" 
                                value="${option.value}" ${checked} /> ${option.label}
                        </label>
                    `;
                });
                html += '</div>';
                break;
                
            case 'checkboxes':
                html += '<div class="checkbox-group">';
                const checkedValues = Array.isArray(currentValue) ? currentValue : [];
                question.options.forEach(option => {
                    const checked = checkedValues.includes(option.value) ? 'checked' : '';
                    html += `
                        <label>
                            <input type="checkbox" name="${question.variable}" 
                                value="${option.value}" ${checked} /> ${option.label}
                        </label>
                    `;
                });
                html += '</div>';
                break;
        }
        
        // Add validation error message area
        if (!this.currentValidation.valid) {
            html += `<div class="error">${this.currentValidation.message}</div>`;
        }
        
        html += '</div>';
        
        this.elements.questionArea.innerHTML = html;
        this.attachInputListeners(question);
    }

    attachInputListeners(question) {
        const inputs = this.elements.questionArea.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const value = this.getInputValue(question);
                
                // Validate input
                this.currentValidation = this.validator.validate(question, value);
                
                if (this.currentValidation.valid) {
                    this.engine.setAnswer(question.variable, value);
                    this.clearError();
                } else {
                    this.showError(this.currentValidation.message);
                }
            });
            
            // Add Enter key handler for text inputs
            if (input.type === 'text' || input.type === 'number' || input.type === 'email') {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        
                        // Get current value and validate
                        const value = this.getInputValue(question);
                        this.currentValidation = this.validator.validate(question, value);
                        
                        if (this.currentValidation.valid) {
                            this.engine.setAnswer(question.variable, value);
                            this.clearError();
                            this.handleNext();
                        } else {
                            this.showError(this.currentValidation.message);
                        }
                    }
                });
            }
        });
    }

    getInputValue(question) {
        switch (question.type) {
            case 'text':
            case 'email':
            case 'dropdown':
                return document.getElementById(question.variable).value;
                
            case 'integer':
                return parseInt(document.getElementById(question.variable).value, 10);
                
            case 'number':
                return parseFloat(document.getElementById(question.variable).value);
                
            case 'yesno':
            case 'radio':
                const checked = document.querySelector(`input[name="${question.variable}"]:checked`);
                if (question.type === 'yesno') {
                    return checked ? (checked.value === 'true') : undefined;
                }
                return checked ? checked.value : undefined;
                
            case 'checkboxes':
                const checkboxes = document.querySelectorAll(`input[name="${question.variable}"]:checked`);
                return Array.from(checkboxes).map(cb => cb.value);
                
            default:
                return null;
        }
    }

    showError(message) {
        const errorDiv = this.elements.questionArea.querySelector('.error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    clearError() {
        const errorDiv = this.elements.questionArea.querySelector('.error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    showLoadError() {
        // Create error UI with warning icon
        const errorHtml = `
            <div class="load-error-container">
                <div class="warning-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </div>
                <h2>Interview Failed to Load</h2>
                <p>The interview definition could not be loaded. Please check the console for detailed error information.</p>
                <button id="retry-load-btn" class="retry-button">Retry</button>
            </div>
        `;
        
        this.elements.questionArea.innerHTML = errorHtml;
        
        // Hide navigation buttons
        this.elements.prevBtn.style.display = 'none';
        this.elements.nextBtn.style.display = 'none';
        
        // Retry Button
        document.getElementById('retry-load-btn').addEventListener('click', () => {
            location.reload();
        });
    }

    updateNavigation() {
        if (!this.engine) return;
        this.elements.prevBtn.disabled = this.engine.state.visitedQuestions.length === 0;
        this.elements.nextBtn.textContent = this.engine.state.completed ? 'Finish' : 'Next';
    }

    updateProgress() {
        if (!this.engine) return;
        const progress = this.engine.getProgress();
        this.elements.progressFill.style.width = `${progress}%`;
    }

    handlePrevious() {
        if (!this.engine) return;
        this.engine.previousQuestion();
        this.render();
    }

    handleNext() {
        if (!this.engine) return;
        
        // Validate current answer
        const question = this.engine.getCurrentQuestion();
        if (question) {
            // Get the current input value, not the stored value
            const value = this.getInputValue(question);
            const validation = this.validator.validate(question, value);
            
            if (!validation.valid) {
                this.currentValidation = validation;
                this.showError(validation.message);
                return;
            }
            
            // Save the validated value
            this.engine.setAnswer(question.variable, value);
        }
        
        this.currentValidation = { valid: true };
        this.engine.nextQuestion();
        this.stateManager.saveState(this.engine.getState());
        this.render();
    }

    async renderCompletion() {
        this.elements.questionArea.innerHTML = '<h2>Interview Complete!</h2>';
        this.elements.visualizationContainer.style.display = 'block';
        await this.visualizer.renderDiagram('mermaid-diagram', this.engine.definition, this.engine.state);
        
        const template = this.engine.definition.templates?.[0];
        if (template) {
            const result = await this.templateProcessor.generateDocument(
                this.engine.definition,
                this.engine.state.answers,
                template.content
            );
            
            this.elements.documentPreview.style.display = 'block';
            this.elements.previewContent.innerHTML = result.html;
            
            this.generatedDocument = result;
        }
    }

    downloadMarkdown() {
        if (this.generatedDocument) {
            this.templateProcessor.downloadAsMarkdown(
                this.generatedDocument.markdown,
                'interview-document.md'
            );
        }
    }

    downloadHTML() {
        if (this.generatedDocument) {
            this.templateProcessor.downloadAsHTML(
                this.generatedDocument.html,
                'interview-document.html'
            );
        }
    }

    copyShareURL() {
        if (!this.engine) return;
        
        const url = this.stateManager.generateShareURL(this.engine.getState());
        
        navigator.clipboard.writeText(url).then(() => {
            alert('Share URL copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy URL:', err);
            alert('Failed to copy URL. Please copy manually: ' + url);
        });
    }

    handleReset() {
        if (confirm('Are you sure you want to reset the interview? All progress will be lost.')) {
            if (this.engine) {
                this.engine.reset();
            }
            this.stateManager.resetState();
            this.currentValidation = { valid: true };
            this.elements.visualizationContainer.style.display = 'none';
            this.elements.documentPreview.style.display = 'none';
            
            this.render();
        }
    }
}

// Export for Node.js testing, ignore in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InterviewApp;
} else {
    // Initialize app when DOM is ready (browser only)
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new InterviewApp();
    });
}
