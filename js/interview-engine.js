// Interview Engine
class InterviewEngine {
    constructor(definition) {
        this.definition = definition;
        this.state = {
            answers: {},
            currentQuestionIndex: 0,
            visitedQuestions: [],
            completed: false
        };
        this.observers = [];
        
        // Debug configuration - set to true to enable detailed logging
        this.DEBUG_MODE = typeof window !== 'undefined' && 
                         (window.location?.search?.includes('debug=true') || 
                          (typeof localStorage !== 'undefined' && localStorage.getItem('interview_debug') === 'true'));
        
        this.debugLog('InterviewEngine initialized', {
            totalQuestions: definition?.questions?.length || 0,
            hasVariables: !!definition?.variables,
            hasTemplates: !!definition?.templates,
            debugMode: this.DEBUG_MODE
        });
    }

    // Debug logging method
    debugLog(message, data = null) {
        if (!this.DEBUG_MODE) return;
        
        const timestamp = new Date().toISOString().substr(11, 12);
        console.group(`[${timestamp}] InterviewEngine: ${message}`);
        
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                console.log(`  ${key}:`, value);
            });
        }
        
        // Always show current state summary
        console.log('Current State:', {
            questionIndex: this.state.currentQuestionIndex,
            totalAnswers: Object.keys(this.state.answers).length,
            visitedCount: this.state.visitedQuestions.length,
            completed: this.state.completed
        });
        
        console.groupEnd();
    }

    // Initialize from saved state or URL
    initialize(savedState = null) {
        this.debugLog('Initializing engine', {
            hasSavedState: !!savedState,
            savedStateKeys: savedState ? Object.keys(savedState) : null
        });
        
        if (savedState) {
            this.state = { ...this.state, ...savedState };
        }
        this.notifyObservers();
    }

    // Get current question based on conditions
    getCurrentQuestion() {
        const questions = this.definition.questions;
        let questionIndex = this.state.currentQuestionIndex;

        this.debugLog('Getting current question', {
            startingIndex: questionIndex,
            totalQuestions: questions.length
        });

        // Skip questions that don't meet conditions
        while (questionIndex < questions.length) {
            const question = questions[questionIndex];
            const shouldShow = this.shouldShowQuestion(question);
            
            this.debugLog('Evaluating question', {
                questionId: question.id,
                questionIndex: questionIndex,
                questionType: question.type,
                hasCondition: !!question.show_if,
                shouldShow: shouldShow,
                condition: question.show_if || 'none'
            });
            
            if (shouldShow) {
                this.debugLog('Selected question', {
                    selectedQuestion: question.id,
                    questionText: question.question,
                    variable: question.variable
                });
                return question;
            }
            questionIndex++;
        }

        // No more questions
        this.debugLog('🏁 Interview completed - no more questions');
        this.state.completed = true;
        return null;
    }

    // Check if question should be shown based on conditions
    shouldShowQuestion(question) {
        if (!question.show_if) {
            this.debugLog('No condition - showing question', {
                questionId: question.id
            });
            return true;
        }

        try {
            // Simple condition evaluation (safe subset)
            const condition = question.show_if;
            const result = this.evaluateExpression(condition, { returnBoolean: true });

            this.debugLog('Condition evaluation result', {
                questionId: question.id,
                condition: condition,
                result: result
            });

            return result;
        } catch (e) {
            this.debugLog('Condition evaluation error', {
                questionId: question.id,
                condition: question.show_if,
                error: e.message,
                defaulting: 'true'
            });
            console.error('Error evaluating condition:', e);
            return true;
        }
    }

    // Parse string value to appropriate type
    parseValue(valueStr) {
        const trimmed = valueStr.trim();
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        if (trimmed.match(/^['"](.*)['"]$/)) {
            return trimmed.slice(1, -1);
        }
        if (!isNaN(trimmed)) {
            return Number(trimmed);
        }
        return trimmed;
    }

    // Unified expression evaluator for both conditions and answer fields
    evaluateExpression(expression, options = { returnBoolean: false }) {
        this.debugLog('Evaluating expression', {
            expression: expression,
            returnBoolean: options.returnBoolean
        });

        const matches = expression.match(/(\w+)\s*(===|!==|>=|<=|==|!=|>|<|\+|-|\*|\/)\s*(.+)/);
        if (!matches) {
            this.debugLog('Could not parse expression', {
                expression: expression,
                reason: 'No regex match found'
            });
            if (options.returnBoolean) {
                console.warn('Could not parse condition:', expression);
                return false;
            }
            return null;
        }

        const [, varName, operator, valueStr] = matches;
        const currentValue = this.state.answers[varName];
        const compareValue = this.parseValue(valueStr);

        this.debugLog('Expression parsing result', {
            expression: expression,
            variable: varName,
            currentValue: currentValue,
            valueType: typeof currentValue,
            operator: operator,
            compareValue: compareValue,
            compareType: typeof compareValue
        });

        let result;
        switch (operator) {
            case '===':
                result = currentValue === compareValue;
                break;
            case '!==':
                result = currentValue !== compareValue;
                break;
            case '==':
                result = currentValue == compareValue;
                break;
            case '!=':
                result = currentValue != compareValue;
                break;
            case '>':
                result = Number(currentValue) > Number(compareValue);
                break;
            case '<':
                result = Number(currentValue) < Number(compareValue);
                break;
            case '>=':
                result = Number(currentValue) >= Number(compareValue);
                break;
            case '<=':
                result = Number(currentValue) <= Number(compareValue);
                break;
            case '+':
                result = Number(currentValue) + Number(compareValue);
                break;
            case '-':
                result = Number(currentValue) - Number(compareValue);
                break;
            case '*':
                result = Number(currentValue) * Number(compareValue);
                break;
            case '/':
                result = Number(currentValue) / Number(compareValue);
                break;

            default:
                result = options.returnBoolean ? false : null;
        }

        this.debugLog('Expression evaluation complete', {
            expression: expression,
            finalResult: result,
            resultType: typeof result,
            operator: operator,
            leftValue: currentValue,
            rightValue: compareValue
        });

        return result;
    }

    // Set answer for current question
    setAnswer(questionId, value) {
        const previousValue = this.state.answers[questionId];
        this.state.answers[questionId] = value;
        
        this.debugLog('Answer set', {
            questionId: questionId,
            newValue: value,
            valueType: typeof value,
            previousValue: previousValue,
            totalAnswers: Object.keys(this.state.answers).length
        });
        
        this.updateComputedFields();
        this.notifyObservers();
    }

    // Update computed fields based on current answers
    updateComputedFields() {
        if (this.definition.variables) {
            this.definition.variables.forEach(variable => {
                if (variable.computed) {
                    try {
                        const result = this.evaluateExpression(variable.computed);
                        this.state.answers[variable.name] = result;
                    } catch (e) {
                        console.error('Error computing field:', e);
                    }
                }
            });
        }

        // Also check questions for computed fields (backward compatibility)
        this.definition.questions.forEach(question => {
            if (question.computed) {
                try {
                    const result = this.evaluateExpression(question.computed);
                    this.state.answers[question.variable] = result;
                } catch (e) {
                    console.error('Error computing field:', e);
                }
            }
        });
    }

    // Navigate to next question
    nextQuestion() {
        if (!this.state.completed) {
            const previousIndex = this.state.currentQuestionIndex;
            this.state.visitedQuestions.push(this.state.currentQuestionIndex);
            this.state.currentQuestionIndex++;
            
            this.debugLog('Moving to next question', {
                fromIndex: previousIndex,
                toIndex: this.state.currentQuestionIndex,
                visitedQuestions: [...this.state.visitedQuestions]
            });
            
            // Check if we should skip any questions
            const currentQuestion = this.getCurrentQuestion();
            if (!currentQuestion) {
                this.state.completed = true;
                this.debugLog('Interview completed after navigation');
            }
            
            this.notifyObservers();
        } else {
            this.debugLog('Cannot navigate - interview already completed');
        }
    }

    // Navigate to previous question
    previousQuestion() {
        if (this.state.visitedQuestions.length > 0) {
            const previousIndex = this.state.currentQuestionIndex;
            this.state.currentQuestionIndex = this.state.visitedQuestions.pop();
            this.state.completed = false;
            
            this.debugLog('Moving to previous question', {
                fromIndex: previousIndex,
                toIndex: this.state.currentQuestionIndex,
                remainingVisited: [...this.state.visitedQuestions],
                wasCompleted: previousIndex >= this.definition.questions.length
            });
            
            this.notifyObservers();
        } else {
            this.debugLog('Cannot go back - no visited questions');
        }
    }

    // Get progress percentage
    getProgress() {
        const totalQuestions = this.definition.questions.length;
        
        if (this.state.completed) {
            return 100;
        }
        
        const currentPosition = this.state.currentQuestionIndex;
        return Math.round((currentPosition / totalQuestions) * 100);
    }

    // Observer pattern for state changes
    subscribe(observer) {
        this.observers.push(observer);
    }

    notifyObservers() {
        this.observers.forEach(observer => observer(this.state));
    }

    // Get current state for saving
    getState() {
        return {
            answers: this.state.answers,
            currentQuestionIndex: this.state.currentQuestionIndex,
            visitedQuestions: this.state.visitedQuestions,
            completed: this.state.completed
        };
    }

    // Reset interview to initial state
    reset() {
        const previousAnswerCount = Object.keys(this.state.answers).length;
        const previousIndex = this.state.currentQuestionIndex;
        
        this.state = {
            answers: {},
            currentQuestionIndex: 0,
            visitedQuestions: [],
            completed: false
        };
        
        this.debugLog('Interview reset', {
            previousAnswerCount: previousAnswerCount,
            previousIndex: previousIndex,
            wasCompleted: this.state.completed
        });
        
        this.notifyObservers();
    }
}

// Export for Node.js testing, ignore in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InterviewEngine;
}
