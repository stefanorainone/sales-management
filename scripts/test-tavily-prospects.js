#!/usr/bin/env node

/**
 * Test script for Tavily-powered real prospect suggestions
 *
 * Tests:
 * 1. API endpoint responds
 * 2. Returns real prospects when Tavily is configured
 * 3. Falls back gracefully when Tavily is not configured
 */

const fetch = require('node-fetch');

// Test data - sample relationships
const testRelationships = [
  {
    id: 'test-1',
    name: 'Mario Rossi',
    company: 'Tech Italia SRL',
    role: 'CTO',
    strength: 'active',
    importance: 'high',
    category: 'decision_maker',
    valueBalance: 'balanced',
    lastContact: new Date().toISOString(),
    nextAction: 'Follow up on project',
    actionsHistory: 5,
    noteCount: 3
  },
  {
    id: 'test-2',
    name: 'Laura Bianchi',
    company: 'Digital Innovators',
    role: 'CEO',
    strength: 'strong',
    importance: 'critical',
    category: 'champion',
    valueBalance: 'giving_more',
    lastContact: new Date().toISOString(),
    nextAction: 'Quarterly review',
    actionsHistory: 12,
    noteCount: 8
  }
];

async function testProspectSuggestions() {
  console.log('🧪 Testing Tavily-powered Prospect Suggestions\n');

  const apiUrl = 'http://localhost:3000/api/ai/relationship-suggestions';

  try {
    console.log('📤 Sending request to API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ relationships: testRelationships })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ API Response received\n');
    console.log('📊 Results:');
    console.log(`   - Existing relation tasks: ${data.suggestions?.existingRelations?.length || 0}`);
    console.log(`   - New prospects: ${data.suggestions?.newProspects?.length || 0}\n`);

    // Check if we got real prospects
    if (data.suggestions?.newProspects?.length > 0) {
      console.log('🎯 New Prospects Found:');
      data.suggestions.newProspects.forEach((prospect, idx) => {
        console.log(`\n${idx + 1}. ${prospect.nome}`);
        console.log(`   Company: ${prospect.azienda}`);
        console.log(`   Role: ${prospect.ruolo}`);
        console.log(`   Sector: ${prospect.settore}`);
        console.log(`   Why: ${prospect.motivo}`);
        console.log(`   Source: ${prospect.fonte}`);

        // Validate source is not fake
        const isFakeSource = prospect.fonte.includes('esempio.com') ||
                            prospect.fonte.includes('sample.com') ||
                            prospect.fonte.includes('test.com');

        if (isFakeSource) {
          console.log('   ⚠️  WARNING: Fake source detected!');
        } else {
          console.log('   ✅ Source appears valid');
        }
      });
    } else {
      console.log('ℹ️  No new prospects returned');
      console.log('   This is expected if TAVILY_API_KEY is not configured');
      console.log('   Or if no relevant prospects were found');
    }

    // Check existing relation tasks
    if (data.suggestions?.existingRelations?.length > 0) {
      console.log('\n\n📝 Tasks for Existing Relations:');
      data.suggestions.existingRelations.forEach((task, idx) => {
        console.log(`\n${idx + 1}. ${task.task}`);
        console.log(`   For: ${task.relazione}`);
        console.log(`   Why: ${task.motivo}`);
      });
    }

    console.log('\n\n✅ Test completed successfully!');

    // Check if Tavily is configured
    if (!process.env.TAVILY_API_KEY) {
      console.log('\n💡 Tip: To get real prospects, configure TAVILY_API_KEY');
      console.log('   See TAVILY_SETUP.md for instructions');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the dev server is running:');
      console.log('   npm run dev');
    }

    process.exit(1);
  }
}

// Run test
testProspectSuggestions();
