
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  bio?: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  streak_days: number;
  chronotype?: 'lion' | 'bear' | 'wolf' | 'dolphin' | null;
}

export enum TaskType {
  DAILY = 'daily',
  HABIT = 'habit',
  TODO = 'todo'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  type: TaskType;
  priority: TaskPriority;
  due_date?: string;
  time?: string;
  repeat_days?: string[];
  last_completed_date?: string;
  energy_level?: 'high' | 'medium' | 'low';
  points: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target_count: number;
  current_count: number;
  reward_xp: number;
  is_completed: boolean;
  expires_at: string;
}

export interface FocusSession {
  id: string;
  duration_minutes: number;
  completed_at: string;
  mode: 'focus' | 'short_break' | 'long_break';
}

// Supabase Database Types Helper
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile
        Insert: UserProfile
        Update: Partial<UserProfile>
        Relationships: []
      }
      tasks: {
        Row: Task
        Insert: Task
        Update: Partial<Task>
        Relationships: []
      }
      focus_sessions: {
        Row: FocusSession
        Insert: FocusSession
        Update: Partial<FocusSession>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}