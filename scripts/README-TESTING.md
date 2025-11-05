# Puppeteer Test Scripts

This directory contains Puppeteer test scripts to verify the complete functionality of the Sales CRM application.

## Test Scripts

### 1. `test-task-completion-local.js` - Local Development Testing

**Purpose**: Test the complete task completion flow on your local development server.

**Prerequisites**:
- Dev server must be running: `npm run dev`
- Puppeteer must be installed: `npm install puppeteer`

**Usage**:
```bash
# Start the dev server in one terminal
npm run dev

# Run the test in another terminal
node scripts/test-task-completion-local.js
```

**What it tests**:
1. ✅ Dev server is reachable
2. ✅ Login with admin credentials
3. ✅ Navigate to /today page
4. ✅ Find and click "Inizia Task" button
5. ✅ Fill in task completion form (notes, duration, outcome)
6. ✅ Test file upload handling
7. ✅ Complete task and handle any dialogs
8. ✅ Verify completion state

**Features**:
- Runs with browser visible (headless: false)
- Takes screenshots at each step
- Keeps browser open for 10 seconds at the end for inspection
- Handles Firebase Storage upload errors gracefully

---

### 2. `test-task-completion.js` - Production Testing

**Purpose**: Test the complete task completion flow on the deployed Cloud Run instance.

**Prerequisites**:
- Application must be deployed to Cloud Run
- Puppeteer must be installed: `npm install puppeteer`

**Usage**:
```bash
node scripts/test-task-completion.js
```

**Configuration**:
The script uses these default values:
- URL: `https://sales-management-01-651164440715.europe-west1.run.app`
- Email: `admin@vr.com`
- Password: `Admin123!`

To test a different environment, set the `BASE_URL` environment variable:
```bash
BASE_URL=https://your-app-url.com node scripts/test-task-completion.js
```

**What it tests**:
Same flow as the local test, but against the production deployment.

**Features**:
- Runs with browser visible for debugging
- Takes screenshots at each step
- Handles network delays appropriately
- Tests complete end-to-end flow

---

## Test Results

All screenshots are saved to the `test-results/` directory with descriptive names:

**Local test screenshots**:
- `local-step1-login-page.png`
- `local-step2-credentials-entered.png`
- `local-step3-logged-in.png`
- ... and more

**Production test screenshots**:
- `step1-login-page.png`
- `step2-credentials-entered.png`
- `step3-logged-in.png`
- ... and more

---

## Common Issues and Solutions

### Issue: "Dev server not running"
**Solution**: Start the dev server first with `npm run dev`

### Issue: "No task start button found"
**Solution**:
1. Make sure tasks exist for today
2. Navigate to `/ai-tasks` first to generate tasks
3. Or manually create tasks via the admin panel

### Issue: "Upload timeout" or "Errore durante il caricamento"
**Solution**: This is expected if Firebase Storage is not configured. The test handles this gracefully and completes the task without files.

### Issue: "Element not found" or timeout errors
**Solution**:
1. Check that the application is fully loaded
2. Increase wait times in the script
3. Check browser console for JavaScript errors
4. Verify the DOM structure hasn't changed

---

## Extending the Tests

To add more test scenarios:

1. **Copy an existing test script** as a starting point
2. **Modify the test flow** to cover your scenario
3. **Add appropriate waits** between interactions
4. **Take screenshots** at critical points for debugging
5. **Handle dialogs** that might appear
6. **Add clear console output** to track progress

Example of adding a new test step:
```javascript
// Step X: Test new feature
console.log('🎯 Step X: Testing new feature...');
const newButton = await page.$('button.my-new-feature');
if (newButton) {
  await newButton.click();
  await wait(1000);
  await takeScreenshot(page, 'stepX-feature-tested');
  console.log('✅ New feature works!');
}
```

---

## Best Practices

1. **Always take screenshots** at each major step
2. **Use descriptive console logs** to track progress
3. **Handle errors gracefully** with try-catch blocks
4. **Wait for elements** before interacting with them
5. **Set up dialog handlers** before triggering actions that might show dialogs
6. **Use appropriate timeouts** for network operations
7. **Clean up resources** (close browser) in finally blocks

---

## Troubleshooting

### Puppeteer Installation Issues

If you encounter issues installing Puppeteer:

```bash
# Install with specific Chromium skip
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install puppeteer-core

# Or reinstall completely
npm uninstall puppeteer
npm install puppeteer
```

### Browser Launch Issues

If the browser fails to launch:

```bash
# On macOS, ensure you have the necessary permissions
# Check for security prompts

# On Linux, you might need additional dependencies
sudo apt-get install -y chromium-browser

# Try running with different args
args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
```

---

## CI/CD Integration

To run these tests in CI/CD:

1. Set `headless: true` in the browser launch options
2. Ensure all dependencies are installed
3. Set appropriate environment variables
4. Upload screenshots as artifacts on failure

Example GitHub Actions workflow:
```yaml
- name: Run Puppeteer Tests
  run: |
    npm install puppeteer
    node scripts/test-task-completion.js
  env:
    BASE_URL: ${{ secrets.PRODUCTION_URL }}

- name: Upload Screenshots on Failure
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-screenshots
    path: test-results/*.png
```

---

## Support

For issues with the test scripts:
1. Check the screenshots in `test-results/`
2. Review the console output
3. Verify the application is running correctly
4. Check that DOM selectors haven't changed
5. Open an issue with screenshot and error details
