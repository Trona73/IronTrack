export type Equipment = string;

export type MuscleGroup = string;

export interface Exercise {
  id: string;
  name: string;
  equipment: Equipment;
  muscleGroup: MuscleGroup;
  imageUrl?: string;
  description?: string;
  videoUrl?: string;
}

export interface PlannedSet {
  reps: number;
  weight: number;
}

export interface PlannedExercise {
  id: string; // unique id for this instance in the plan
  exerciseId: string;
  sets: PlannedSet[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  exercises: PlannedExercise[];
}

export interface CompletedSet {
  reps: number;
  weight: number;
  completedAt: string; // ISO string
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
  durationSeconds: number;
}

export interface UserProfile {
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
}

export interface WorkoutSession {
  id: string;
  planId: string;
  startTime: string;
  endTime?: string;
  exercises: CompletedExercise[];
}
