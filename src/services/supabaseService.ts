import { supabase } from '../lib/supabase';
import { WorkoutPlan, WorkoutSession, Exercise, PlannedExercise } from '../types';

export const supabaseService = {
  async getExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');
    
    if (error) throw error;
    
    return (data || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      equipment: e.equipment,
      muscleGroup: e.muscle_group,
      description: e.description,
      imageUrl: e.image_url,
      videoUrl: e.video_url,
      type: e.type || 'weighted'
    }));
  },

  async ensureExercise(exercise: Exercise, userId?: string): Promise<string> {
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', exercise.name)
      .single();

    if (existing) return existing.id;

    const { data: newExercise, error } = await supabase
      .from('exercises')
      .insert({
        name: exercise.name,
        equipment: exercise.equipment,
        muscle_group: exercise.muscleGroup,
        description: exercise.description,
        image_url: exercise.imageUrl,
        video_url: exercise.videoUrl,
        user_id: userId || null
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
        video_url: exercise.videoUrl,
        type: exercise.type || 'weighted'
      })
      .eq('id', exercise.id);

    if (error) throw error;
  },

  async deleteExercise(id: string): Promise<boolean> {
    const { error, count } = await supabase
      .from('exercises')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw error;
    return count !== null && count > 0;
  },

  async getUserSettings(userId: string): Promise<{ muscleGroups: string[], equipment: string[], trainingStartDay: number, weeklyTrainingGoal: number, name?: string, weight?: number, height?: number, age?: number, gender?: string, activityLevel?: string, goal?: string } | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    if (!data) return null;

    return {
      muscleGroups: data.muscle_groups || [],
      equipment: data.equipment || [],
      trainingStartDay: data.training_start_day ?? 1,
      weeklyTrainingGoal: data.weekly_training_goal ?? 3,
      name: data.name,
      weight: data.weight,
      height: data.height,
      age: data.age,
      gender: data.gender,
      activityLevel: data.activity_level,
      goal: data.goal
    };
  },

  async saveUserSettings(userId: string, settings: { muscleGroups: string[], equipment: string[], trainingStartDay?: number, weeklyTrainingGoal?: number, name?: string, weight?: number, height?: number, age?: number, gender?: string, activityLevel?: string, goal?: string }): Promise<void> {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        muscle_groups: settings.muscleGroups,
        equipment: settings.equipment,
        training_start_day: settings.trainingStartDay ?? 1,
        weekly_training_goal: settings.weeklyTrainingGoal ?? 3,
        name: settings.name,
        weight: settings.weight,
        height: settings.height,
        age: settings.age,
        gender: settings.gender,
        activity_level: settings.activityLevel,
        goal: settings.goal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
  },

  async getWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
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
      `)
      .eq('user_id', userId);

    if (error) throw error;

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
    const { error: planError } = await supabase
      .from('workout_plans')
      .update({
        name: plan.name,
        days_of_week: plan.daysOfWeek
      })
      .eq('id', plan.id);

    if (planError) throw planError;

    const { error: deleteError } = await supabase
      .from('planned_exercises')
      .delete()
      .eq('plan_id', plan.id);

    if (deleteError) throw deleteError;

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
    const { error: sessionError } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('plan_id', planId);

    if (sessionError) throw sessionError;

    const { error: exerciseError } = await supabase
      .from('planned_exercises')
      .delete()
      .eq('plan_id', planId);

    if (exerciseError) throw exerciseError;

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