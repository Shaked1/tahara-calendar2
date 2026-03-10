#!/usr/bin/env node

/**
 * סקריפט להרצת migrations על Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Tahara Calendar Database...\n');

console.log('📋 Steps to set up your database:\n');

console.log('1. Go to https://supabase.com and log in to your project');
console.log('2. Click on "SQL Editor" in the left sidebar');
console.log('3. Click "New query"');
console.log('4. Copy the contents of: supabase/migrations/001_initial_schema.sql');
console.log('5. Paste into the SQL Editor');
console.log('6. Click "Run" (or press Ctrl/Cmd + Enter)\n');

console.log('✅ You should see: "Success. No rows returned"\n');

console.log('📝 Note: Make sure you have set up your .env.local file with:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY\n');

console.log('📖 For detailed instructions, see: INSTALLATION.md\n');

// בדיקה שקבצי migration קיימים
const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
if (fs.existsSync(migrationPath)) {
  console.log('✓ Migration file found at:', migrationPath);
} else {
  console.log('⚠ Warning: Migration file not found at:', migrationPath);
}

console.log('\n✨ Ready to start!');
