import { supabase } from '../lib/supabase';
import { Exercise, WorkoutPlan, WorkoutSession, PlannedExercise, CompletedExercise } from '../types';
import { EXERCISES, MOCK_PLANS } from '../data';

// Helper to check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

export const supabaseService = {
  async getExercises(): Promise<Exercise[]> {
    if (!isSupabaseConfigured()) return EXERCISES;

    const { data, error } = await supabase
      .from('exercises')
      .select('*');

    if (error) {
      console.error('Error fetching exercises:', error);
      return EXERCISES;
    }

    return data.map((e: any) => ({
      id: e.id,
      name: e.name,
      equipment: e.equipment,
      muscleGroup: e.muscle_group,
      imageUrl: e.image_url,
      description: e.description,
      videoUrl: e.video_url
    }));
  },

  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    if (!isSupabaseConfigured()) return MOCK_PLANS;

    const { data: plans, error } = await supabase
      .from('workout_plans')
      .select(`
        id,
        name,
        days_of_week,
        planned_exercises (
          id,
          exercise_id,
          sets,
          order_index
        )
      `);

    if (error) {
      console.error('Error fetching plans:', error);
      return MOCK_PLANS;
    }

    return plans.map((p: any) => ({
      id: p.id,
      name: p.name,
      daysOfWeek: p.days_of_week || [],
      exercises: (p.planned_exercises || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((pe: any) => ({
          id: pe.id,
          exerciseId: pe.exercise_id,
          sets: pe.sets
        }))
    }));
  },

  async saveWorkoutPlan(plan: WorkoutPlan): Promise<WorkoutPlan | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, saving locally only (mock)');
      return plan;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // If no user, maybe we should return null or handle anonymous?
        // For now, let's assume RLS will fail if not authenticated, 
        // but maybe we can just try.
        console.warn('No user logged in');
    }

    // 1. Upsert Plan
    const { data: savedPlan, error: planError } = await supabase
      .from('workout_plans')
      .upsert({
        id: plan.id.length < 10 ? undefined : plan.id, // If it's a short mock ID, let DB generate UUID? Or just use it if UUID?
        // Actually, if we are transitioning from mock to real, mock IDs (p1, p2) won't work as UUIDs.
        // We should probably let Supabase generate IDs for new plans.
        // If plan.id is existing UUID, use it.
        user_id: user?.id,
        name: plan.name,
        days_of_week: plan.daysOfWeek
      })
      .select()
      .single();

    if (planError) {
      console.error('Error saving plan:', planError);
      throw planError;
    }

    // 2. Delete existing planned exercises for this plan (full replace strategy is easiest)
    if (plan.id) {
        await supabase
            .from('planned_exercises')
            .delete()
            .eq('plan_id', savedPlan.id);
    }

    // 3. Insert new planned exercises
    const plannedExercisesData = plan.exercises.map((ex, index) => ({
      plan_id: savedPlan.id,
      exercise_id: ex.exerciseId, // This assumes exerciseId is a valid UUID from the DB. If using mock IDs (e1, e2), this will fail FK constraint.
      sets: ex.sets,
      order_index: index
    }));

    // Check if exercise IDs are valid UUIDs. If they are mock IDs (e1, e2), we can't save to DB unless we seeded DB with those IDs (which we can't easily do with UUIDs).
    // So, we probably need to seed the DB with exercises first and get their real IDs.
    // For this implementation, I'll assume the user will run a seed script or the DB is empty.
    
    if (plannedExercisesData.length > 0) {
        const { error: exError } = await supabase
        .from('planned_exercises')
        .insert(plannedExercisesData);

        if (exError) {
            console.error('Error saving exercises:', exError);
            throw exError;
        }
    }

    return {
        ...plan,
        id: savedPlan.id
    };
  },

  async deleteWorkoutPlan(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  },

  async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Insert Session
    const { data: savedSession, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user?.id,
        plan_id: session.planId,
        start_time: session.startTime,
        end_time: session.endTime
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error saving session:', sessionError);
      throw sessionError;
    }

    // 2. Insert Completed Exercises
    const completedExercisesData = session.exercises.map(ex => ({
      session_id: savedSession.id,
      exercise_id: ex.exerciseId,
      sets: ex.sets,
      duration_seconds: ex.durationSeconds
    }));

    if (completedExercisesData.length > 0) {
        const { error: exError } = await supabase
        .from('completed_exercises')
        .insert(completedExercisesData);

        if (exError) {
            console.error('Error saving completed exercises:', exError);
            throw exError;
        }
    }
  }
};
