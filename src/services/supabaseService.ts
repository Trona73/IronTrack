import { supabase } from '../lib/supabase';
import { WorkoutPlan, WorkoutSession, Exercise, PlannedExercise } from '../types';

export const supabaseService = {
  async getExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');
    
    if (error) throw error;
    return data || [];
  },

  async ensureExercise(exercise: Exercise): Promise<string> {
    // 1. Try to find by name
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', exercise.name)
      .single();

    if (existing) return existing.id;

    // 2. If not found, create
    const { data: newExercise, error } = await supabase
      .from('exercises')
      .insert({
        name: exercise.name,
        equipment: exercise.equipment,
        muscle_group: exercise.muscleGroup,
        description: exercise.description,
        image_url: exercise.imageUrl,
        video_url: exercise.videoUrl
      })
      .select('id')
      .single();

    if (error) throw error;
    return newExercise.id;
  },

  async updateExercise(exercise: Exercise): Promise<void> {
    const { error } = await supabase
      .from('exercises')
      .update({
        name: exercise.name,
        equipment: exercise.equipment,
        muscle_group: exercise.muscleGroup,
        description: exercise.description,
        image_url: exercise.imageUrl,
        video_url: exercise.videoUrl
      })
      .eq('id', exercise.id);

    if (error) throw error;
  },

  async deleteExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    const { data: plans, error } = await supabase
      .from('workout_plans')
      .select(`
        *,
        planned_exercises (
          id,
          exercise_id,
          sets,
          "order"
        )
      `);

    if (error) throw error;

    // Transform to match app types
    return plans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      daysOfWeek: plan.days_of_week || [],
      exercises: (plan.planned_exercises || [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((pe: any) => ({
          id: pe.id,
          exerciseId: pe.exercise_id,
          sets: pe.sets
        }))
    }));
  },

  async createWorkoutPlan(plan: WorkoutPlan, userId: string): Promise<WorkoutPlan> {
    // 1. Create Plan
    const { data: planData, error: planError } = await supabase
      .from('workout_plans')
      .insert({
        name: plan.name,
        days_of_week: plan.daysOfWeek,
        user_id: userId
      })
      .select()
      .single();

    if (planError) throw planError;

    // 2. Create Planned Exercises
    if (plan.exercises.length > 0) {
      const plannedExercises = plan.exercises.map((ex, index) => ({
        plan_id: planData.id,
        exercise_id: ex.exerciseId,
        sets: ex.sets,
        "order": index
      }));

      const { error: exError } = await supabase
        .from('planned_exercises')
        .insert(plannedExercises);

      if (exError) throw exError;
    }

    return { ...plan, id: planData.id };
  },

  async updateWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    // 1. Update Plan details
    const { error: planError } = await supabase
      .from('workout_plans')
      .update({
        name: plan.name,
        days_of_week: plan.daysOfWeek
      })
      .eq('id', plan.id);

    if (planError) throw planError;

    // 2. Delete existing exercises (simple strategy: delete all and recreate)
    // In a real app, you might want to diff and update/insert/delete
    const { error: deleteError } = await supabase
      .from('planned_exercises')
      .delete()
      .eq('plan_id', plan.id);

    if (deleteError) throw deleteError;

    // 3. Insert new exercises
    if (plan.exercises.length > 0) {
      const plannedExercises = plan.exercises.map((ex, index) => ({
        plan_id: plan.id,
        exercise_id: ex.exerciseId,
        sets: ex.sets,
        "order": index
      }));

      const { error: insertError } = await supabase
        .from('planned_exercises')
        .insert(plannedExercises);

      if (insertError) throw insertError;
    }
  },

  async deleteWorkoutPlan(planId: string): Promise<void> {
    // 1. Delete related workout sessions first to avoid foreign key constraint error
    const { error: sessionError } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('plan_id', planId);

    if (sessionError) throw sessionError;

    // 2. Delete related planned exercises
    const { error: exerciseError } = await supabase
      .from('planned_exercises')
      .delete()
      .eq('plan_id', planId);

    if (exerciseError) throw exerciseError;

    // 3. Delete the plan itself
    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
  },

  async saveWorkoutSession(session: WorkoutSession, userId: string): Promise<void> {
    const { error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        plan_id: session.planId,
        start_time: session.startTime,
        end_time: session.endTime,
        exercises: session.exercises
      });

    if (error) throw error;
  }
};
