// Visualizer - Create decision flow diagrams
class Visualizer {
    constructor() {
        this.mermaid = (typeof window !== 'undefined' && window.mermaid) || global.mermaid;
        if (this.mermaid && this.mermaid.initialize) {
            this.mermaid.initialize({ 
                startOnLoad: false,
                theme: 'default',
                flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true
                }
            });
        }
    }

    // Generate Mermaid diagram from interview definition
    generateDiagram(definition, currentState = null) {
        let mermaidCode = 'flowchart TD\n';

        // Start
        mermaidCode += '    Start([Start Interview]);\n';
        
        // Question node
        definition.questions.forEach((question, index) => {
            const nodeId = `Q${index}`;
            const nodeText = this.truncateText(question.question, 30);
            const nodeShape = this.getNodeShape(question.type);
            
            // Add shape and text
            mermaidCode += `    ${nodeId}${nodeShape[0]}${nodeText}${nodeShape[1]};\n`;
            
            // Add styling
            if (currentState && index === currentState.currentQuestionIndex) {
                mermaidCode += `    class ${nodeId} current;\n`;
            }
            
            if (currentState && currentState.answers[question.variable]) {
                mermaidCode += `    class ${nodeId} answered;\n`;
            }
        });
        
        // End
        mermaidCode += '    End([Complete Interview]);\n\n';
        
        // Add connections - simplified linear flow
        if (definition.questions.length > 0) {
            mermaidCode += '    Start --> Q0;\n';
            
            definition.questions.forEach((question, index) => {
                const nodeId = `Q${index}`;
                const nextIndex = index + 1;
                
                if (nextIndex < definition.questions.length) {
                    // Connect to next question
                    mermaidCode += `    ${nodeId} --> Q${nextIndex};\n`;
                } else {
                    // Connect last question to end
                    mermaidCode += `    ${nodeId} --> End;\n`;
                }
            });
        }
        
        mermaidCode += '\n    classDef current fill:#4CAF50,stroke:#333,stroke-width:4px,color:#fff;\n';
        mermaidCode += '    classDef answered fill:#2196F3,stroke:#333,stroke-width:2px,color:#fff;\n';
        
        return mermaidCode;
    }

    // Get node shape delimiters based on question type
    getNodeShape(questionType) {
        switch (questionType) {
            case 'yesno':
                return ['{', '}']; // Diamond for decisions
            case 'dropdown':
            case 'radio':
                return ['[', ']']; // Rectangle for choices
            default:
                return ['(', ')']; // Rounded rectangle for inputs
        }
    }

    // Format condition for display
    formatCondition(condition) {
        return condition
            .replace(/===|==/g, '=')
            .replace(/!==|!=/g, '≠')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/&&/g, ' AND ')
            .replace(/\|\|/g, ' OR ');
    }

    // Truncate and sanitize text for diagram
    truncateText(text, maxLength) {
        let cleanText = text
            .replace(/['"<>&\[\]{}()]/g, '') // Remove brackets and special chars
            .replace(/\?/g, '') // Remove question marks
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
            
        if (cleanText.length <= maxLength) return cleanText;
        return cleanText.substring(0, maxLength - 3) + '...';
    }

    // Render diagram to element
    async renderDiagram(elementId, definition, currentState = null) {
        const element = document.getElementById(elementId);
        
        if (!element) {
            console.error('Visualizer: Element not found with ID:', elementId);
            return;
        }
        
        if (!definition || !definition.questions || !Array.isArray(definition.questions)) {
            console.error('Visualizer: Invalid definition provided');
            element.innerHTML = '<p>Invalid interview definition</p>';
            return;
        }
        
        const mermaidCode = this.generateDiagram(definition, currentState);
        element.innerHTML = '<p>Generating diagram...</p>';
        
        // Generate unique ID
        const graphId = `mermaid-${Date.now()}`;
        
        try {
            const renderResult = await this.mermaid.render(graphId, mermaidCode);
            
            // Mermaid returns SVG as a string
            if (typeof renderResult === 'string' && renderResult.includes('<svg')) {
                element.innerHTML = renderResult;
            } else if (renderResult && renderResult.svg) {
                element.innerHTML = renderResult.svg;
            } else {
                console.error('Visualizer: Unexpected render result format');
                element.innerHTML = '<p>Failed to generate diagram</p>';
            }
        } catch (error) {
            console.error('Visualizer: Failed to render diagram:', error.message);
            element.innerHTML = '<p>Failed to generate diagram: ' + error.message + '</p>';
        }
    }

    // Export diagram as SVG
    exportSVG(elementId) {
        const element = document.getElementById(elementId);
        const svg = element.querySelector('svg');
        
        if (!svg) {
            console.error('No SVG found to export');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'interview-diagram.svg';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Export for Node.js testing, ignore in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Visualizer;
}
