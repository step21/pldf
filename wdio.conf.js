const path = require('path');

exports.config = {
    // Test runner - use local runner for simplicity
    runner: 'local',
    
    // Specs patterns
    specs: [
        './test/integration/**/*.spec.js'
    ],
    
    // Browser capabilities
    capabilities: [{
        maxInstances: 1,
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--headless',
                '--no-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content',
                '--window-size=1920,1080'
            ]
        },
        acceptInsecureCerts: true
    }],
    
    // Test framework
    framework: 'mocha',
    
    // Reporter
    reporters: ['spec'],
    
    // Mocha options
    mochaOpts: {
        ui: 'bdd',
        timeout: 30000
    },
    
    // Base URL for tests
    baseUrl: 'http://localhost:4000',
    
    // Wait settings
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    
    // Services - using built-in chromedriver
    services: [],
    
    // Hook functions
    onPrepare: function (config, capabilities) {
        console.log('🚀 Starting WebDriverIO tests...');
    },
    
    before: function (capabilities, specs) {
        // Set up global test helpers
        global.expect = require('chai').expect;
    },
    
    beforeTest: function (test, context) {
        // Set implicit wait
        browser.setTimeout({ 'implicit': 5000 });
    },
    
    afterTest: function(test, context, { error, result, duration, passed, retries }) {
        if (error) {
            console.log(`❌ Test failed: ${test.title}`);
            // Take screenshot on failure
            try {
                browser.saveScreenshot(`./test-results/failure-${test.title}-${Date.now()}.png`);
            } catch (e) {
                console.log('Could not take screenshot:', e.message);
            }
        }
    },
    
    onComplete: function(exitCode, config, capabilities, results) {
        console.log('🏁 WebDriverIO tests completed');
    }
};
