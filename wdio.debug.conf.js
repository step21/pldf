const path = require('path');

exports.config = {
    // Test runner - use local runner for simplicity
    runner: 'local',

    // Specs patterns
    specs: [
        './test/integration/**/*.spec.js'
    ],

    // Browser capabilities - NON-HEADLESS for debugging
    capabilities: [{
        maxInstances: 1,
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                // Removed --headless for debugging
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content',
                '--window-size=1280,720',
                '--start-maximized',
                '--disable-extensions',
                '--disable-plugins'
            ]
        },
        acceptInsecureCerts: true
    }],

    // Test framework
    framework: 'mocha',

    // Reporter with more verbose output
    reporters: ['spec'],

    // Mocha options - increased timeout for debugging
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000 // Longer timeout for manual observation
    },

    // Base URL for tests
    baseUrl: 'http://localhost:4000',

    // Wait settings - longer waits for debugging
    waitforTimeout: 15000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

    // Services - using built-in chromedriver
    services: [],

    // Hook functions
    onPrepare: function (config, capabilities) {
        console.log('🔍 Starting WebDriverIO DEBUG tests...');
        console.log('🔍 Browser will open in non-headless mode for observation');
    },

    before: function (capabilities, specs) {
        // Set up global test helpers
        global.expect = require('chai').expect;
        console.log('🔍 Browser session started - you can now observe the test execution');
    },

    beforeTest: function (test, context) {
        // Set implicit wait
        browser.setTimeout({ 'implicit': 5000 });
        console.log(`🔍 Starting test: ${test.title}`);
    },

    afterTest: function(test, context, { error, result, duration, passed, retries }) {
        if (error) {
            console.log(`❌ Test failed: ${test.title}`);
            console.log(`❌ Error: ${error.message}`);
            // Take screenshot on failure
            try {
                const screenshotPath = `./test-results/debug-failure-${Date.now()}.png`;
                browser.saveScreenshot(screenshotPath);
                console.log(`📸 Screenshot saved: ${screenshotPath}`);
            } catch (e) {
                console.log('Could not take screenshot:', e.message);
            }

            // Pause on failure for manual inspection
            console.log('🔍 Test failed - browser will pause for 10 seconds for inspection...');
            browser.pause(10000);
        } else {
            console.log(`✅ Test passed: ${test.title}`);
        }
    },

    onComplete: function(exitCode, config, capabilities, results) {
        console.log('🏁 WebDriverIO DEBUG tests completed');
        console.log('🔍 Browser will close in 5 seconds...');
    }
};