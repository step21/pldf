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
        try { localStorage.removeItem(this.storageKey); } catch (_) { /* Storage may be disabled. */ }
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
            if (!minimal || typeof minimal.a !== 'object' || minimal.a === null || Array.isArray(minimal.a) ||
                !Number.isSafeInteger(minimal.c) || minimal.c < 0 || !Array.isArray(minimal.v) ||
                minimal.v.some(i => !Number.isSafeInteger(i) || i < 0)) return null;
            
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
        url.searchParams.delete('state');
        url.hash = new URLSearchParams({ state: compressed }).toString();
        return url.toString();
    }

    // Load state from URL
    loadFromURL() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const compressed = params.get('state');
        
        if (compressed) {
            return this.decompressState(compressed);
        }
        
        return null;
    }

    // Default is memory-only: navigation must not persist answers.
    saveState() {
        return false;
    }

    // Reset all state
    resetState() {
        this.clearStorage();
        const url = new URL(window.location.href);
        url.searchParams.delete('state');
        url.hash = '';
        window.history.replaceState(null, '', url.toString());
    }
}

// Export for Node.js testing, ignore in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
