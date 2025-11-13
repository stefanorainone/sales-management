// Simple script to call the clear-tasks API endpoint
const BASE_URL = 'http://localhost:3001';

// Admin user ID (from test scripts)
const ADMIN_USER_ID = 'W6qGDo4btycGWpqhZPOvrLdguas2';

async function clearAllTasks() {
  console.log('🗑️  Calling API to clear all tasks...\n');
  console.log('⚠️  WARNING: This will delete ALL tasks permanently!');
  console.log('⏳ Starting deletion in 3 seconds... (Press Ctrl+C to cancel)\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const response = await fetch(`${BASE_URL}/api/admin/clear-tasks`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestingUserId: ADMIN_USER_ID,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to clear tasks');
    }

    console.log('✅ SUCCESS!');
    console.log(`📊 ${data.message}`);
    console.log(`📊 Tasks deleted: ${data.deletedCount}`);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

clearAllTasks();
