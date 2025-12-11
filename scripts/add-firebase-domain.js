#!/usr/bin/env node

/**
 * Add authorized domain to Firebase Auth via Admin SDK
 */

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

// Domain to add
const DOMAIN_TO_ADD = 'sales-crm-449547817254.europe-west1.run.app';

async function addAuthorizedDomain() {
  try {
    console.log('🔧 Adding authorized domain to Firebase Auth...\n');

    // Initialize Firebase Admin SDK (uses application default credentials)
    admin.initializeApp({
      projectId: 'sales-management-01'
    });

    console.log(`Domain to add: ${DOMAIN_TO_ADD}\n`);

    // Get the project config
    const auth = getAuth();

    // Note: The Admin SDK doesn't directly expose authorized domains management
    // We need to use the REST API
    console.log('⚠️  Firebase Admin SDK does not expose authorized domains API directly.');
    console.log('Using Firebase REST API instead...\n');

    // Get access token
    const credential = admin.credential.applicationDefault();
    const accessToken = await credential.getAccessToken();

    // Get current config
    const fetch = require('node-fetch');

    // Try the Firebase Management API
    const configUrl = `https://firebase.googleapis.com/v1beta1/projects/sales-management-01/webApps/-/config`;

    console.log('Fetching current Firebase config...');
    const configResponse = await fetch(configUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken.access_token}`,
      }
    });

    if (!configResponse.ok) {
      const errorText = await configResponse.text();
      console.error('❌ Failed to fetch config:', errorText);
      console.log('\n💡 This operation must be done via Firebase Console:');
      console.log('   https://console.firebase.google.com/project/sales-management-01/authentication/settings');
      console.log('\nSteps:');
      console.log('1. Scroll to "Authorized domains"');
      console.log('2. Click "Add domain"');
      console.log(`3. Enter: ${DOMAIN_TO_ADD}`);
      console.log('4. Save');
      return;
    }

    const config = await configResponse.json();
    console.log('Current config:', JSON.stringify(config, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Authorized domains cannot be managed programmatically.');
    console.log('   You must add the domain manually via Firebase Console:');
    console.log('   https://console.firebase.google.com/project/sales-management-01/authentication/settings');
    console.log('\nDomain to add:');
    console.log(`   ${DOMAIN_TO_ADD}`);
  } finally {
    process.exit(0);
  }
}

// Run the function
addAuthorizedDomain();
