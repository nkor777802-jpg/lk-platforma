export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          condition_type: string
          condition_value: number | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          condition_type?: string
          condition_value?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          condition_type?: string
          condition_value?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      answer_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          sort_order: number
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          sort_order?: number
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          sort_order?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_by: string | null
          course_id: string | null
          created_at: string
          due_date: string | null
          id: string
          profession_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          course_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          profession_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          course_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          profession_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_history: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          sort_order: number
          title: string
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          module_type: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          module_type?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          module_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_common: boolean
          profession_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_common?: boolean
          profession_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_common?: boolean
          profession_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          head_name: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          head_name?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          head_name?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          material_id: string | null
          module_id: string | null
          profession_id: string | null
          progress_percent: number
          stage_key: string | null
          status: string
          updated_at: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          material_id?: string | null
          module_id?: string | null
          profession_id?: string | null
          progress_percent?: number
          stage_key?: string | null
          status?: string
          updated_at?: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          material_id?: string | null
          module_id?: string | null
          profession_id?: string | null
          progress_percent?: number
          stage_key?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      management: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          photo_url: string | null
          position: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          position: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          position?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      material_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      materials: {
        Row: {
          category_id: string | null
          created_at: string
          department_id: string | null
          description: string | null
          external_url: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_active: boolean
          is_mandatory_for_all: boolean
          material_type: string
          mime_type: string | null
          module_id: string | null
          profession_id: string | null
          sort_order: number
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          external_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_mandatory_for_all?: boolean
          material_type?: string
          mime_type?: string | null
          module_id?: string | null
          profession_id?: string | null
          sort_order?: number
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          external_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_mandatory_for_all?: boolean
          material_type?: string
          mime_type?: string | null
          module_id?: string | null
          profession_id?: string | null
          sort_order?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      practical_results: {
        Row: {
          attempt_id: string | null
          created_at: string
          id: string
          max_score: number
          passed: boolean
          response: Json
          score: number
          task_id: string | null
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          created_at?: string
          id?: string
          max_score?: number
          passed?: boolean
          response?: Json
          score?: number
          task_id?: string | null
          user_id: string
        }
        Update: {
          attempt_id?: string | null
          created_at?: string
          id?: string
          max_score?: number
          passed?: boolean
          response?: Json
          score?: number
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practical_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practical_results_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "practical_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      practical_task_items: {
        Row: {
          content: string
          correct_position: number | null
          created_at: string
          id: string
          image_url: string | null
          is_correct: boolean
          match_target: string | null
          sort_order: number
          task_id: string
        }
        Insert: {
          content: string
          correct_position?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_correct?: boolean
          match_target?: string | null
          sort_order?: number
          task_id: string
        }
        Update: {
          content?: string
          correct_position?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_correct?: boolean
          match_target?: string | null
          sort_order?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practical_task_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "practical_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      practical_tasks: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          instruction: string | null
          is_active: boolean
          max_score: number
          profession_id: string | null
          sort_order: number
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string | null
          is_active?: boolean
          max_score?: number
          profession_id?: string | null
          sort_order?: number
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string | null
          is_active?: boolean
          max_score?: number
          profession_id?: string | null
          sort_order?: number
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practical_tasks_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          applications: string[] | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          purpose: string | null
          short_description: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          applications?: string[] | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          purpose?: string | null
          short_description?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          applications?: string[] | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          purpose?: string | null
          short_description?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      professions: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          duration_hours: number | null
          equipment: string[] | null
          grades: string[] | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          short_description: string | null
          skills: string[] | null
          slug: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          equipment?: string[] | null
          grades?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          short_description?: string | null
          skills?: string[] | null
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          equipment?: string[] | null
          grades?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          short_description?: string | null
          skills?: string[] | null
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          email: string | null
          full_name: string
          grade: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          personnel_number: string | null
          position: string | null
          profession_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          grade?: string | null
          id: string
          is_active?: boolean
          manager_id?: string | null
          personnel_number?: string | null
          position?: string | null
          profession_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          grade?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          personnel_number?: string | null
          position?: string | null
          profession_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_profession_fk"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string | null
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          is_active: boolean
          is_common: boolean
          profession_id: string | null
          source_material_id: string | null
          text: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          is_common?: boolean
          profession_id?: string | null
          source_material_id?: string | null
          text: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          is_common?: boolean
          profession_id?: string | null
          source_material_id?: string | null
          text?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_source_material_id_fkey"
            columns: ["source_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          body: string | null
          data: Json
          image_url: string | null
          key: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          data?: Json
          image_url?: string | null
          key: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          data?: Json
          image_url?: string | null
          key?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      test_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          correct_text: string | null
          id: string
          is_correct: boolean | null
          question_id: string | null
          question_text: string
          selected_option_id: string | null
          selected_text: string | null
          sort_order: number
          time_spent_seconds: number | null
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          correct_text?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          question_text?: string
          selected_option_id?: string | null
          selected_text?: string | null
          sort_order?: number
          time_spent_seconds?: number | null
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          correct_text?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          question_text?: string
          selected_option_id?: string | null
          selected_text?: string | null
          sort_order?: number
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          attempt_number: number
          correct_answers: number
          finished_at: string | null
          id: string
          passed: boolean | null
          profession_id: string | null
          score_percent: number
          settings_snapshot: Json
          started_at: string
          status: string
          total_questions: number
          user_id: string
        }
        Insert: {
          attempt_number?: number
          correct_answers?: number
          finished_at?: string | null
          id?: string
          passed?: boolean | null
          profession_id?: string | null
          score_percent?: number
          settings_snapshot?: Json
          started_at?: string
          status?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          attempt_number?: number
          correct_answers?: number
          finished_at?: string | null
          id?: string
          passed?: boolean | null
          profession_id?: string | null
          score_percent?: number
          settings_snapshot?: Json
          started_at?: string
          status?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_settings: {
        Row: {
          allow_retry: boolean
          common_questions: number
          created_at: string
          grading_rules: Json
          id: string
          is_default: boolean
          lock_answer: boolean
          max_attempts: number
          pass_percent: number
          profession_id: string | null
          professional_questions: number
          show_correct_answer: boolean
          shuffle_options: boolean
          shuffle_questions: boolean
          time_limit_minutes: number | null
          total_questions: number
          updated_at: string
        }
        Insert: {
          allow_retry?: boolean
          common_questions?: number
          created_at?: string
          grading_rules?: Json
          id?: string
          is_default?: boolean
          lock_answer?: boolean
          max_attempts?: number
          pass_percent?: number
          profession_id?: string | null
          professional_questions?: number
          show_correct_answer?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          time_limit_minutes?: number | null
          total_questions?: number
          updated_at?: string
        }
        Update: {
          allow_retry?: boolean
          common_questions?: number
          created_at?: string
          grading_rules?: Json
          id?: string
          is_default?: boolean
          lock_answer?: boolean
          max_attempts?: number
          pass_percent?: number
          profession_id?: string | null
          professional_questions?: number
          show_correct_answer?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          time_limit_minutes?: number | null
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_settings_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          external_url: string | null
          id: string
          is_active: boolean
          is_company_video: boolean
          module_id: string | null
          profession_id: string | null
          sort_order: number
          thumbnail_url: string | null
          title: string
          topic: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          is_company_video?: boolean
          module_id?: string | null
          profession_id?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          topic?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          is_company_video?: boolean
          module_id?: string | null
          profession_id?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      manages_user: {
        Args: { _manager: string; _target: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "employee" | "manager" | "hr" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["employee", "manager", "hr", "admin"],
    },
  },
} as const
