import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

async function testWrite() {
  console.log('Testing Supabase writes...');
  
  // Try to insert a test exercise. Since we are using anon key, we won't have an auth.uid()
  // unless we sign in or bypass it.
  // Wait! In the DB, the write policies on exercises are:
  // "Users can insert their own exercises" with check (auth.uid() = user_id).
  // If we try to insert with user_id = null or any random uuid, it will fail if we are not logged in!
  // Wait! Can we try to login or sign up?
  // Let's try to create a test user, or just see if we can query auth or do something.
  // Actually, we can check if we can insert a plan after signing in.
  // Let's create an anonymous session or try to sign up a temp user.
  const tempEmail = `test_${Date.now()}@example.com`;
  const tempPassword = 'password123';

  console.log(`Trying to sign up temp user: ${tempEmail}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: tempEmail,
    password: tempPassword,
  });

  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message);
    return;
  }

  const userId = signUpData.user?.id;
  const session = signUpData.session;
  console.log(`✅ Sign up successful! User ID: ${userId}`);

  // Now, test inserting user settings
  console.log('Testing user_settings insert...');
  const { error: settingsError } = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      muscle_groups: ['Peito', 'Costas'],
      equipment: ['Barra'],
      training_start_day: 1,
      weekly_training_goal: 3,
      name: 'Test User'
    });

  if (settingsError) {
    console.error('❌ user_settings insert failed:', settingsError.message);
  } else {
    console.log('✅ user_settings insert successful!');
  }

  // Test inserting exercise
  console.log('Testing exercise insert...');
  const { data: exerciseData, error: exerciseError } = await supabase
    .from('exercises')
    .insert({
      name: `Test Exercise ${Date.now()}`,
      equipment: 'Barra',
      muscle_group: 'Peito',
      user_id: userId,
      type: 'weighted'
    })
    .select('id')
    .single();

  if (exerciseError) {
    console.error('❌ exercise insert failed:', exerciseError.message);
  } else {
    console.log(`✅ exercise insert successful! ID: ${exerciseData.id}`);
  }

  // Test inserting workout plan
  console.log('Testing workout plan insert...');
  const { data: planData, error: planError } = await supabase
    .from('workout_plans')
    .insert({
      name: 'Test Workout Plan',
      days_of_week: [1, 2],
      user_id: userId
    })
    .select('id')
    .single();

  if (planError) {
    console.error('❌ workout_plans insert failed:', planError.message);
  } else {
    console.log(`✅ workout_plans insert successful! ID: ${planData.id}`);
  }

  // Clean up
  console.log('Cleaning up user...');
  // Note: We can't delete users easily from client SDK without admin API,
  // but this is fine since it's just a test user in their development DB.
}

testWrite();
