// State Manager - Handle state persistence and URL encoding
class StateManager {
    constructor() {
        this.storageKey = 'interview_state';
    }

    // Save state to localStorage
    saveToStorage(state) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    }

    // Load state from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return null;
        }
    }

    // Clear stored state
    clearStorage() {
        localStorage.removeItem(this.storageKey);
    }

    // Compress state for URL
    compressState(state) {
        const minimal = {
            a: state.answers,
            c: state.currentQuestionIndex,
            v: state.visitedQuestions
        };
        
        const json = JSON.stringify(minimal);
        return LZString.compressToEncodedURIComponent(json);
    }

    // Decompress state from URL
    decompressState(compressed) {
        try {
            const json = LZString.decompressFromEncodedURIComponent(compressed);
            const minimal = JSON.parse(json);
            
            return {
                answers: minimal.a || {},
                currentQuestionIndex: minimal.c || 0,
                visitedQuestions: minimal.v || []
            };
        } catch (e) {
            console.error('Failed to decompress state:', e);
            return null;
        }
    }

    // Generate shareable URL
    generateShareURL(state) {
        const compressed = this.compressState(state);
        const url = new URL(window.location.href);
        url.searchParams.set('state', compressed);
        return url.toString();
    }

    // Load state from URL
    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const compressed = params.get('state');
        
        if (compressed) {
            return this.decompressState(compressed);
        }
        
        return null;
    }

    // Save state to both storage and URL
    saveState(state) {
        this.saveToStorage(state);
        const url = this.generateShareURL(state);
        window.history.replaceState(state, '', url);
    }

    // Reset all state
    resetState() {
        this.clearStorage();
        const url = new URL(window.location.href);
        url.searchParams.delete('state');
        window.history.replaceState(null, '', url.toString());
    }
}

// Export for Node.js testing, ignore in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
