// Validator - Input validation
class Validator {
    constructor() {
        this.validators = {
            text: this.validateText,
            integer: this.validateInteger,
            number: this.validateNumber,
            email: this.validateEmail,
            yesno: this.validateYesNo,
            dropdown: this.validateDropdown,
            radio: this.validateRadio,
            checkboxes: this.validateCheckboxes
        };
    }

    // Main validation method
    validate(question, value) {
        const validator = this.validators[question.type];
        if (!validator) {
            return { valid: false, message: 'Unsupported question type' };
        }
        const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        if (empty) return question.required ? { valid: false, message: 'This field is required' } : { valid: true };
        if (['text', 'email'].includes(question.type) && typeof value !== 'string') return { valid: false, message: 'Expected text' };
        if (question.type === 'yesno' && typeof value !== 'boolean') return { valid: false, message: 'Please select Yes or No' };
        if (['radio', 'dropdown', 'checkboxes'].includes(question.type)) {
            const values = question.type === 'checkboxes' ? value : [value];
            if (!Array.isArray(values) || values.some(v => !(question.options || []).some(o => o.value === v))) return { valid: false, message: 'Invalid selection' };
        }

        return validator.call(this, value, question);
    }

    // Text validation
    validateText(value, question) {
        const rules = question.validation || {};
        
        if (question.required && (!value || value.trim() === '')) {
            return { valid: false, message: 'This field is required' };
        }

        if (rules.minLength && value.length < rules.minLength) {
            return { valid: false, message: `Minimum length is ${rules.minLength} characters` };
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            return { valid: false, message: `Maximum length is ${rules.maxLength} characters` };
        }

        if (rules.pattern) {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(value)) {
                return { valid: false, message: rules.patternMessage || 'Invalid format' };
            }
        }

        return { valid: true };
    }

    // Integer validation
    validateInteger(value, question) {
        const rules = question.validation || {};
        
        if (question.required && (value === '' || value === null || value === undefined)) {
            return { valid: false, message: 'This field is required' };
        }

        const num = Number(value);
        if (!Number.isFinite(num) || !Number.isInteger(num)) {
            return { valid: false, message: 'Please enter a valid number' };
        }

        if (rules.min !== undefined && num < rules.min) {
            return { valid: false, message: `Minimum value is ${rules.min}` };
        }

        if (rules.max !== undefined && num > rules.max) {
            return { valid: false, message: `Maximum value is ${rules.max}` };
        }

        return { valid: true };
    }

    // Number (decimal) validation
    validateNumber(value, question) {
        const rules = question.validation || {};
        
        if (question.required && (value === '' || value === null || value === undefined)) {
            return { valid: false, message: 'This field is required' };
        }

        const num = Number(value);
        if (!Number.isFinite(num)) {
            return { valid: false, message: 'Please enter a valid number' };
        }

        if (rules.min !== undefined && num < rules.min) {
            return { valid: false, message: `Minimum value is ${rules.min}` };
        }

        if (rules.max !== undefined && num > rules.max) {
            return { valid: false, message: `Maximum value is ${rules.max}` };
        }

        return { valid: true };
    }

    // Email validation
    validateEmail(value, question) {
        if (question.required && (!value || value.trim() === '')) {
            return { valid: false, message: 'This field is required' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }

        return { valid: true };
    }

    // Yes/No validation
    validateYesNo(value, question) {
        if (question.required && value === undefined) {
            return { valid: false, message: 'Please select an option' };
        }

        return { valid: true };
    }

    // Dropdown validation
    validateDropdown(value, question) {
        if (question.required && !value) {
            return { valid: false, message: 'Please select an option' };
        }

        return { valid: true };
    }

    // Radio validation
    validateRadio(value, question) {
        if (question.required && !value) {
            return { valid: false, message: 'Please select an option' };
        }

        return { valid: true };
    }

    // Checkboxes validation
    validateCheckboxes(value, question) {
        const rules = question.validation || {};
        
        if (question.required && (!value || value.length === 0)) {
            return { valid: false, message: 'Please select at least one option' };
        }

        if (rules.minSelect && value.length < rules.minSelect) {
            return { valid: false, message: `Please select at least ${rules.minSelect} options` };
        }

        if (rules.maxSelect && value.length > rules.maxSelect) {
            return { valid: false, message: `Please select no more than ${rules.maxSelect} options` };
        }

        return { valid: true };
    }
}

// Export for Node.js testing, ignore in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
}
