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
            return { valid: true };
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

        const num = parseInt(value, 10);
        if (isNaN(num)) {
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

        const num = parseFloat(value);
        if (isNaN(num)) {
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
