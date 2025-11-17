// Template Processor
class TemplateProcessor {
    constructor() {
        this.marked = (typeof window !== 'undefined' && window.marked) || global.marked;
        this.mustache = (typeof window !== 'undefined' && window.Mustache) || global.Mustache;
        
        // Configure marked options if available
        if (this.marked && this.marked.setOptions) {
            this.marked.setOptions({
                breaks: true,
                gfm: true
            });
        }
    }

    // Process template with data
    processTemplate(template, data) {
        const rendered = this.mustache.render(template, data);
        const html = this.marked.parse(rendered);
        
        return {
            markdown: rendered,
            html: html
        };
    }

    // Load template
    async loadTemplate(templateSource) {
        if (templateSource.startsWith('http') || templateSource.startsWith('/')) {
            // Load from URL
            try {
                const response = await fetch(templateSource);
                return await response.text();
            } catch (e) {
                console.error('Failed to load template:', e);
                return this.getDefaultTemplate();
            }
        } else {
            // Use as inline template
            return templateSource;
        }
    }

    // Default template
    getDefaultTemplate() {
        return `# {{metadata.title}}

## Summary Information

**Name:** {{user_name}}
**Date:** {{current_date}}

## Responses

{{#questions}}
### {{question}}
**Answer:** {{answer}}

{{/questions}}

---
*Generated on {{current_date}} at {{current_time}}*
`;
    }
    prepareTemplateData(definition, answers) {
        const now = new Date();        
        const questions = definition.questions.map(q => ({
            question: q.question,
            answer: answers[q.variable] || 'Not answered'
        }));

        return {
            metadata: definition.metadata || {},
            current_date: now.toLocaleDateString(),
            current_time: now.toLocaleTimeString(),
            questions: questions,
            ...answers // Include all answers as top-level variables
        };
    }

    // Generate document
    async generateDocument(definition, answers, templatePath = null) {
        const template = templatePath 
            ? await this.loadTemplate(templatePath)
            : this.getDefaultTemplate();
            
        const data = this.prepareTemplateData(definition, answers);
        return this.processTemplate(template, data);
    }

    // Export functions
    downloadAsMarkdown(content, filename = 'document.md') {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    downloadAsHTML(content, filename = 'document.html') {
        const fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Generated Document</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            line-height: 1.6;
        }
        h1, h2, h3 { color: #333; }
        hr { border: 1px solid #eee; }
    </style>
</head>
<body>
${content}
</body>
</html>`;
        
        const blob = new Blob([fullHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Export for Node.js testing, ignore in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateProcessor;
}
