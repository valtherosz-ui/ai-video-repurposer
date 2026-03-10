export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          original_filename: string
          storage_path: string
          duration: number
          file_size: number
          width: number
          height: number
          status: 'uploading' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_filename: string
          storage_path: string
          duration?: number
          file_size: number
          width?: number
          height?: number
          status?: 'uploading' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_filename?: string
          storage_path?: string
          duration?: number
          file_size?: number
          width?: number
          height?: number
          status?: 'uploading' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      transcripts: {
        Row: {
          id: string
          video_id: string
          content: string
          language: string
          segments: Json
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          content: string
          language?: string
          segments?: Json
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          content?: string
          language?: string
          segments?: Json
          created_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          video_id: string
          highlights: Json
          topics: Json
          sentiment: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          highlights?: Json
          topics?: Json
          sentiment?: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          highlights?: Json
          topics?: Json
          sentiment?: string
          created_at?: string
        }
      }
      clips: {
        Row: {
          id: string
          video_id: string
          title: string
          description: string
          start_time: number
          end_time: number
          storage_path: string
          thumbnail_path: string
          duration: number
          format: string
          resolution: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          title: string
          description?: string
          start_time: number
          end_time: number
          storage_path: string
          thumbnail_path: string
          duration?: number
          format?: string
          resolution?: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          title?: string
          description?: string
          start_time?: number
          end_time?: number
          storage_path?: string
          thumbnail_path?: string
          duration?: number
          format?: string
          resolution?: string
          created_at?: string
        }
      }
      processing_jobs: {
        Row: {
          id: string
          video_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          current_step: string
          progress: number
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          current_step?: string
          progress?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          current_step?: string
          progress?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}

export type Tables = Database['public']['Tables']
export type Profiles = Tables['profiles']['Row']
export type Videos = Tables['videos']['Row']
export type Transcripts = Tables['transcripts']['Row']
export type Analyses = Tables['analyses']['Row']
export type Clips = Tables['clips']['Row']
export type ProcessingJobs = Tables['processing_jobs']['Row']
