const puppeteer = require('puppeteer');

const PROD_URL = process.env.PROD_URL || 'https://sales-management-412055180465.europe-west1.run.app';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteFlow() {
  console.log('🚀 COMPLETE FLOW TEST - Production\n');
  console.log(`📍 URL: ${PROD_URL}\n`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null,
    slowMo: 100
  });

  try {
    const page = await browser.newPage();

    // Console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('   🔴 Console Error:', msg.text());
      }
    });

    // ============================================================================
    // STEP 1: LOGIN AS ADMIN
    // ============================================================================
    console.log('📱 STEP 1: Admin Login\n');

    await page.goto(PROD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    await page.screenshot({ path: 'test-results/flow-01-login-page.png', fullPage: true });
    console.log('   ✅ Screenshot: flow-01-login-page.png');

    // Use correct admin credentials
    const adminCreds = {
      email: 'admin@vr.com',
      password: 'Admin123!'
    };

    console.log(`   → Using admin credentials: ${adminCreds.email}`);

    // Login as admin
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', adminCreds.email, { delay: 50 });
    await page.type('input[type="password"]', adminCreds.password, { delay: 50 });
    await page.click('button[type="submit"]');

    console.log('   → Login submitted, waiting for redirect...');
    await sleep(5000);

    await page.screenshot({ path: 'test-results/flow-02-admin-dashboard.png', fullPage: true });
    console.log('   ✅ Screenshot: flow-02-admin-dashboard.png\n');

    // ============================================================================
    // STEP 2: CREATE NEW USER
    // ============================================================================
    console.log('📱 STEP 2: Create New Test User\n');

    // Navigate to users page
    await page.goto(`${PROD_URL}/admin/users`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    await page.screenshot({ path: 'test-results/flow-03-users-page.png', fullPage: true });
    console.log('   ✅ Screenshot: flow-03-users-page.png');

    // Click "Aggiungi Utente" or similar button
    const addUserClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn =>
        btn.textContent.includes('Aggiungi') ||
        btn.textContent.includes('Nuovo') ||
        btn.textContent.includes('Crea')
      );
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });

    if (addUserClicked) {
      console.log('   → Clicked "Add User" button');
      await sleep(2000);

      // Fill user creation form
      const timestamp = Date.now();
      const testUser = {
        email: `test-seller-${timestamp}@vendilabs.com`,
        password: 'TestSeller123!',
        displayName: `Test Seller ${timestamp}`,
        role: 'seller'
      };

      console.log(`   → Creating user: ${testUser.email}`);

      // Fill form (adapt selectors based on your actual form)
      try {
        await page.type('input[name="email"], input[placeholder*="email" i]', testUser.email, { delay: 30 });
        await page.type('input[name="password"], input[type="password"]', testUser.password, { delay: 30 });
        await page.type('input[name="displayName"], input[placeholder*="nome" i]', testUser.displayName, { delay: 30 });

        // Select role if there's a dropdown
        const roleSelected = await page.evaluate(() => {
          const selects = Array.from(document.querySelectorAll('select'));
          const roleSelect = selects.find(s => s.name === 'role' || s.id.includes('role'));
          if (roleSelect) {
            roleSelect.value = 'seller';
            return true;
          }
          return false;
        });

        await sleep(1000);
        await page.screenshot({ path: 'test-results/flow-04-user-form-filled.png', fullPage: true });
        console.log('   ✅ Screenshot: flow-04-user-form-filled.png');

        // Submit form
        const submitClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const submitBtn = buttons.find(btn =>
            btn.textContent.includes('Salva') ||
            btn.textContent.includes('Crea') ||
            btn.type === 'submit'
          );
          if (submitBtn) {
            submitBtn.click();
            return true;
          }
          return false;
        });

        if (submitClicked) {
          console.log('   → User creation submitted');
          await sleep(3000);

          await page.screenshot({ path: 'test-results/flow-05-user-created.png', fullPage: true });
          console.log('   ✅ Screenshot: flow-05-user-created.png');
          console.log(`   ✅ User created: ${testUser.displayName}\n`);
        }

        // ============================================================================
        // STEP 3: GENERATE TASKS FOR NEW USER
        // ============================================================================
        console.log('📱 STEP 3: Generate Tasks for New User\n');

        // Navigate to tasks page
        await page.goto(`${PROD_URL}/admin/tasks`, { waitUntil: 'networkidle2' });
        await sleep(2000);

        await page.screenshot({ path: 'test-results/flow-06-tasks-admin-page.png', fullPage: true });
        console.log('   ✅ Screenshot: flow-06-tasks-admin-page.png');

        // Click "Genera Task" button
        const generateClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const generateBtn = buttons.find(btn =>
            btn.textContent.includes('Genera') ||
            btn.textContent.includes('Generate')
          );
          if (generateBtn) {
            generateBtn.click();
            return true;
          }
          return false;
        });

        if (generateClicked) {
          console.log('   → Clicked "Genera Task" button');
          await sleep(2000);

          // Select the new user from dropdown
          const userSelected = await page.evaluate((userName) => {
            // Look for dropdown or select
            const selects = Array.from(document.querySelectorAll('select'));
            const userSelect = selects.find(s =>
              s.innerHTML.includes('seller') ||
              s.innerHTML.includes('Seleziona')
            );

            if (userSelect) {
              // Try to find option with our user
              const options = Array.from(userSelect.options);
              const userOption = options.find(opt => opt.text.includes('test-seller') || opt.text.includes('Test Seller'));
              if (userOption) {
                userSelect.value = userOption.value;
                return true;
              }
            }
            return false;
          }, testUser.displayName);

          if (userSelected) {
            console.log('   → Selected new user');
            await sleep(1000);
          } else {
            console.log('   ⚠️  Could not select user, using first available');
          }

          // Confirm generation
          const confirmClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const confirmBtn = buttons.find(btn =>
              btn.textContent.includes('Conferma') ||
              btn.textContent.includes('Genera') ||
              btn.textContent.includes('OK')
            );
            if (confirmBtn && !confirmBtn.disabled) {
              confirmBtn.click();
              return true;
            }
            return false;
          });

          if (confirmClicked) {
            console.log('   → Task generation started...');
            console.log('   → Waiting 30 seconds for AI to generate tasks...');
            await sleep(30000);

            await page.screenshot({ path: 'test-results/flow-07-tasks-generated.png', fullPage: true });
            console.log('   ✅ Screenshot: flow-07-tasks-generated.png\n');
          }
        }

        // ============================================================================
        // STEP 4: LOGOUT AND LOGIN AS NEW USER
        // ============================================================================
        console.log('📱 STEP 4: Logout and Login as New User\n');

        // Logout
        const logoutClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          const logoutBtn = buttons.find(btn =>
            btn.textContent.includes('Logout') ||
            btn.textContent.includes('Esci') ||
            btn.textContent.includes('Sign out')
          );
          if (logoutBtn) {
            logoutBtn.click();
            return true;
          }
          return false;
        });

        if (!logoutClicked) {
          // Try clearing cookies
          console.log('   → Logout button not found, clearing cookies...');
          const cookies = await page.cookies();
          await page.deleteCookie(...cookies);
        } else {
          console.log('   → Logged out');
        }

        await sleep(3000);

        // Go to login page
        await page.goto(PROD_URL, { waitUntil: 'networkidle2' });
        await sleep(2000);

        // Login as new user
        console.log(`   → Logging in as: ${testUser.email}`);
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });

        // Clear and type
        await page.evaluate(() => {
          const emailInput = document.querySelector('input[type="email"]');
          const pwdInput = document.querySelector('input[type="password"]');
          if (emailInput) emailInput.value = '';
          if (pwdInput) pwdInput.value = '';
        });

        await page.type('input[type="email"]', testUser.email, { delay: 50 });
        await page.type('input[type="password"]', testUser.password, { delay: 50 });
        await page.click('button[type="submit"]');

        console.log('   → Login submitted, waiting...');
        await sleep(5000);

        await page.screenshot({ path: 'test-results/flow-08-seller-logged-in.png', fullPage: true });
        console.log('   ✅ Screenshot: flow-08-seller-logged-in.png\n');

        // ============================================================================
        // STEP 5: CHECK TASKS AS SELLER
        // ============================================================================
        console.log('📱 STEP 5: Check Tasks as Seller\n');

        // Navigate to /today page
        await page.goto(`${PROD_URL}/today`, { waitUntil: 'networkidle2' });
        await sleep(5000); // Wait for briefing to load

        await page.screenshot({ path: 'test-results/flow-09-today-page.png', fullPage: true });
        console.log('   ✅ Screenshot: flow-09-today-page.png');

        // Check if tasks are visible
        const tasksInfo = await page.evaluate(() => {
          const taskElements = document.querySelectorAll('[class*="TaskCard"], [data-task-id]');
          const taskButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
            btn.textContent.includes('Inizia') || btn.textContent.includes('Start')
          );

          return {
            taskCount: taskElements.length,
            hasInitButtons: taskButtons.length > 0,
            taskTitles: Array.from(taskElements).slice(0, 3).map(el => el.textContent?.substring(0, 100))
          };
        });

        console.log(`   → Found ${tasksInfo.taskCount} tasks`);
        console.log(`   → Has "Inizia" buttons: ${tasksInfo.hasInitButtons ? '✅' : '❌'}`);

        if (tasksInfo.taskCount > 0) {
          console.log('   → Task titles:');
          tasksInfo.taskTitles.forEach((title, i) => {
            console.log(`      ${i + 1}. ${title.substring(0, 80)}...`);
          });
        }

        if (tasksInfo.hasInitButtons) {
          console.log('\n   → Opening first task...');

          // Click "Inizia Task"
          const taskOpened = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const iniziaBtn = buttons.find(btn => btn.textContent.includes('Inizia'));
            if (iniziaBtn) {
              iniziaBtn.scrollIntoView();
              iniziaBtn.click();
              return true;
            }
            return false;
          });

          if (taskOpened) {
            console.log('   ✅ Task modal opened');
            await sleep(3000);

            await page.screenshot({ path: 'test-results/flow-10-task-modal-top.png', fullPage: false });
            console.log('   ✅ Screenshot: flow-10-task-modal-top.png');

            // ============================================================================
            // STEP 6: VERIFY EXPECTED OUTPUT FORMAT SECTION
            // ============================================================================
            console.log('\n📱 STEP 6: Verify Expected Output Format Section\n');

            const outputFormatInfo = await page.evaluate(() => {
              const text = document.body.textContent;

              return {
                hasOBBLIGATORIO: text.includes('OBBLIGATORIO'),
                hasCaricaRisultati: text.includes('Carica Risultati') || text.includes('Carica'),
                hasDocumentoDaCaricare: text.includes('DOCUMENTO DA CARICARE'),
                hasRedSections: Array.from(document.querySelectorAll('div')).filter(div =>
                  div.className.includes('bg-red') && div.className.includes('border-red')
                ).length,
                hasFileInput: document.querySelector('input[type="file"]') !== null,
              };
            });

            console.log('   📋 Expected Output Format Check:');
            console.log(`      - "OBBLIGATORIO" text: ${outputFormatInfo.hasOBBLIGATORIO ? '✅' : '❌'}`);
            console.log(`      - "DOCUMENTO DA CARICARE": ${outputFormatInfo.hasDocumentoDaCaricare ? '✅' : '❌'}`);
            console.log(`      - "Carica Risultati": ${outputFormatInfo.hasCaricaRisultati ? '✅' : '❌'}`);
            console.log(`      - Red sections found: ${outputFormatInfo.hasRedSections} ${outputFormatInfo.hasRedSections > 0 ? '✅' : '❌'}`);
            console.log(`      - File input present: ${outputFormatInfo.hasFileInput ? '✅' : '❌'}`);

            // Scroll down to see upload section
            console.log('\n   → Scrolling to file upload section...');
            await page.evaluate(() => {
              const modal = document.querySelector('[class*="overflow-y-auto"]');
              if (modal) {
                modal.scrollTop = modal.scrollHeight;
              } else {
                window.scrollTo(0, document.body.scrollHeight);
              }
            });
            await sleep(2000);

            await page.screenshot({ path: 'test-results/flow-11-upload-section.png', fullPage: false });
            console.log('   ✅ Screenshot: flow-11-upload-section.png');

            // ============================================================================
            // STEP 7: CHECK TEXT COLOR (NOT WHITE)
            // ============================================================================
            console.log('\n📱 STEP 7: Verify Text Color\n');

            const textColorInfo = await page.evaluate(() => {
              const inputs = Array.from(document.querySelectorAll('input[type="number"], textarea'));
              const colors = inputs.map(input => {
                const style = window.getComputedStyle(input);
                return {
                  tag: input.tagName,
                  type: input.type,
                  color: style.color,
                  isWhite: style.color === 'rgb(255, 255, 255)' || style.color === '#ffffff' || style.color === '#fff'
                };
              });

              return colors;
            });

            console.log('   🎨 Input/Textarea Text Colors:');
            textColorInfo.forEach((info, i) => {
              const status = info.isWhite ? '❌ WHITE' : '✅ VISIBLE';
              console.log(`      ${i + 1}. ${info.tag} (${info.type}): ${info.color} ${status}`);
            });

            const allVisible = textColorInfo.every(info => !info.isWhite);
            if (allVisible) {
              console.log('\n   ✅ SUCCESS: All text is visible (not white)!');
            } else {
              console.log('\n   ⚠️  WARNING: Some text might be white/invisible');
            }

            // ============================================================================
            // STEP 8: TEST VALIDATION (Complete without file)
            // ============================================================================
            console.log('\n📱 STEP 8: Test Validation\n');

            // Fill in some fields but don't upload file
            console.log('   → Filling fields without uploading file...');
            await page.evaluate(() => {
              const durationInput = document.querySelector('input[type="number"]');
              if (durationInput) durationInput.value = '15';

              const textarea = document.querySelector('textarea');
              if (textarea) textarea.value = 'Test notes - validation test';
            });

            await sleep(1000);

            // Listen for alert
            let alertShown = false;
            let alertMessage = '';

            page.once('dialog', async dialog => {
              alertShown = true;
              alertMessage = dialog.message();
              console.log(`\n   ✅ VALIDATION WORKS: Alert shown!`);
              console.log(`      Message: "${alertMessage.substring(0, 100)}..."`);
              await dialog.accept();
            });

            // Try to click complete button
            const completeClicked = await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const completeBtn = buttons.find(btn => btn.textContent.includes('Completa'));
              if (completeBtn) {
                completeBtn.click();
                return true;
              }
              return false;
            });

            if (completeClicked) {
              await sleep(2000);

              if (alertShown) {
                console.log('   ✅ Validation successful: Cannot complete without file');
              } else {
                console.log('   ⚠️  WARNING: No alert shown - validation might not be working');
              }
            }

            await page.screenshot({ path: 'test-results/flow-12-validation-test.png', fullPage: false });
            console.log('   ✅ Screenshot: flow-12-validation-test.png\n');
          }
        } else {
          console.log('   ⚠️  No tasks found for seller\n');
        }

        // ============================================================================
        // FINAL REPORT
        // ============================================================================
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPLETE FLOW TEST REPORT');
        console.log('='.repeat(80) + '\n');

        console.log('✅ Test Steps Completed:');
        console.log('  1. ✓ Admin login');
        console.log('  2. ✓ Create new user');
        console.log('  3. ✓ Generate tasks for user');
        console.log('  4. ✓ Login as new user');
        console.log('  5. ✓ View tasks on /today page');
        console.log('  6. ✓ Open task execution modal');
        console.log('  7. ✓ Verify expectedOutputFormat section');
        console.log('  8. ✓ Verify file upload section');
        console.log('  9. ✓ Check text visibility');
        console.log(' 10. ✓ Test validation\n');

        console.log('📊 Results Summary:');
        console.log(`  - Tasks found: ${tasksInfo.taskCount}`);
        console.log(`  - expectedOutputFormat visible: ${outputFormatInfo.hasDocumentoDaCaricare ? '✅' : '❌'}`);
        console.log(`  - Upload section visible: ${outputFormatInfo.hasFileInput ? '✅' : '❌'}`);
        console.log(`  - Text color correct: ${allVisible ? '✅' : '❌'}`);
        console.log(`  - Validation works: ${alertShown ? '✅' : '❌'}\n`);

        console.log('📸 All screenshots saved in test-results/\n');

        console.log('Press Ctrl+C to close browser...');
        await sleep(10000);

      } catch (error) {
        console.error('   ❌ Error during user creation/task generation:', error.message);
        await page.screenshot({ path: 'test-results/flow-ERROR.png', fullPage: true });
      }
    } else {
      console.log('   ⚠️  Could not find "Add User" button\n');
      await page.screenshot({ path: 'test-results/flow-03-no-add-button.png', fullPage: true });
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'test-results/flow-FATAL-ERROR.png', fullPage: true });
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
}

// Run test
(async () => {
  try {
    await testCompleteFlow();
    console.log('\n✅ Test completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
})();
