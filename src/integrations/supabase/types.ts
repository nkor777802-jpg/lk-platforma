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
          assigned_at: string
          assigned_by: string | null
          comment: string | null
          competency_id: string | null
          course_id: string | null
          created_at: string
          current_grade: string | null
          department_id: string | null
          due_date: string | null
          group_id: string | null
          id: string
          is_mandatory: boolean
          is_repeat: boolean
          profession_id: string | null
          status: string
          target_grade: string | null
          target_profession_id: string | null
          training_type: string
          updated_at: string
          user_id: string
          work_center_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          comment?: string | null
          competency_id?: string | null
          course_id?: string | null
          created_at?: string
          current_grade?: string | null
          department_id?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          is_mandatory?: boolean
          is_repeat?: boolean
          profession_id?: string | null
          status?: string
          target_grade?: string | null
          target_profession_id?: string | null
          training_type?: string
          updated_at?: string
          user_id: string
          work_center_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          comment?: string | null
          competency_id?: string | null
          course_id?: string | null
          created_at?: string
          current_grade?: string | null
          department_id?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          is_mandatory?: boolean
          is_repeat?: boolean
          profession_id?: string | null
          status?: string
          target_grade?: string | null
          target_profession_id?: string | null
          training_type?: string
          updated_at?: string
          user_id?: string
          work_center_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_target_profession_id_fkey"
            columns: ["target_profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_work_center_id_fkey"
            columns: ["work_center_id"]
            isOneToOne: false
            referencedRelation: "work_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      cable_constructions: {
        Row: {
          asset_code: string | null
          created_at: string
          element_code: string
          element_name: string
          id: string
          is_active: boolean
          layer_description: string | null
          layer_number: number
          material_code: string | null
          process: string | null
          product_code: string
          show_in_learning: boolean
          updated_at: string
          visual_type: string | null
        }
        Insert: {
          asset_code?: string | null
          created_at?: string
          element_code: string
          element_name: string
          id?: string
          is_active?: boolean
          layer_description?: string | null
          layer_number: number
          material_code?: string | null
          process?: string | null
          product_code: string
          show_in_learning?: boolean
          updated_at?: string
          visual_type?: string | null
        }
        Update: {
          asset_code?: string | null
          created_at?: string
          element_code?: string
          element_name?: string
          id?: string
          is_active?: boolean
          layer_description?: string | null
          layer_number?: number
          material_code?: string | null
          process?: string | null
          product_code?: string
          show_in_learning?: boolean
          updated_at?: string
          visual_type?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          attempt_id: string | null
          course_id: string | null
          created_at: string
          expires_at: string | null
          file_url: string | null
          id: string
          issued_at: string
          number: string | null
          profession_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string
          number?: string | null
          profession_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_id?: string | null
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string
          number?: string | null
          profession_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_profession_id_fkey"
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
      competencies: {
        Row: {
          competency_type: string
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          level_id: string
          profession_test_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          competency_type?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          level_id: string
          profession_test_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          competency_type?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          level_id?: string
          profession_test_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competencies_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "qualification_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competencies_profession_test_id_fkey"
            columns: ["profession_test_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          consent: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          message: string
          phone: string | null
          status: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          consent?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          message: string
          phone?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          code: string | null
          content: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          file_url: string | null
          id: string
          is_active: boolean
          is_required: boolean
          material_type: string
          module_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          material_type?: string
          module_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          material_type?: string
          module_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          code: string | null
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
          code?: string | null
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
          code?: string | null
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
      course_types: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          code: string | null
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
          code?: string | null
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
          code?: string | null
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
      defects: {
        Row: {
          code: string
          corrective_action: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          possible_cause: string | null
          process: string | null
          product_category: string | null
          updated_at: string
        }
        Insert: {
          code: string
          corrective_action?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          possible_cause?: string | null
          process?: string | null
          product_category?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          corrective_action?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          possible_cause?: string | null
          process?: string | null
          product_category?: string | null
          updated_at?: string
        }
        Relationships: []
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
      development_plan_items: {
        Row: {
          comment: string | null
          completed_at: string | null
          course_id: string | null
          created_at: string
          due_date: string | null
          id: string
          is_mandatory: boolean
          item_type: string
          material_id: string | null
          plan_id: string
          practical_task_id: string | null
          responsible_id: string | null
          sort_order: number
          status: string
          test_profession_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_mandatory?: boolean
          item_type?: string
          material_id?: string | null
          plan_id: string
          practical_task_id?: string | null
          responsible_id?: string | null
          sort_order?: number
          status?: string
          test_profession_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_mandatory?: boolean
          item_type?: string
          material_id?: string | null
          plan_id?: string
          practical_task_id?: string | null
          responsible_id?: string | null
          sort_order?: number
          status?: string
          test_profession_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_plan_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plan_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "development_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plan_items_practical_task_id_fkey"
            columns: ["practical_task_id"]
            isOneToOne: false
            referencedRelation: "practical_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plan_items_test_profession_id_fkey"
            columns: ["test_profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      development_plans: {
        Row: {
          comment: string | null
          created_at: string
          due_date: string | null
          goal: string
          id: string
          profession_id: string | null
          responsible_id: string | null
          status: string
          target_level_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          due_date?: string | null
          goal: string
          id?: string
          profession_id?: string | null
          responsible_id?: string | null
          status?: string
          target_level_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          due_date?: string | null
          goal?: string
          id?: string
          profession_id?: string | null
          responsible_id?: string | null
          status?: string
          target_level_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_plans_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plans_target_level_id_fkey"
            columns: ["target_level_id"]
            isOneToOne: false
            referencedRelation: "qualification_levels"
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
      employee_competencies: {
        Row: {
          comment: string | null
          competency_id: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          profession_id: string | null
          source: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          competency_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          profession_id?: string | null
          source?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          competency_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          profession_id?: string | null
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_competencies_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_competencies_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_factory_zones: {
        Row: {
          id: string
          unlocked_at: string
          user_id: string
          zone_id: string
        }
        Insert: {
          id?: string
          unlocked_at?: string
          user_id: string
          zone_id: string
        }
        Update: {
          id?: string
          unlocked_at?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_factory_zones_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "factory_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_zones: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          profession_id: string | null
          sort_order: number
          unlock_condition: string
          unlock_value: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          profession_id?: string | null
          sort_order?: number
          unlock_condition?: string
          unlock_value?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          profession_id?: string | null
          sort_order?: number
          unlock_condition?: string
          unlock_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_zones_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      import_runs: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          created_rows: number
          error_rows: number
          file_name: string | null
          id: string
          kind: string
          report: Json
          skipped_rows: number
          status: string
          total_rows: number
          updated_rows: number
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          created_rows?: number
          error_rows?: number
          file_name?: string | null
          id?: string
          kind: string
          report?: Json
          skipped_rows?: number
          status?: string
          total_rows?: number
          updated_rows?: number
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          created_rows?: number
          error_rows?: number
          file_name?: string | null
          id?: string
          kind?: string
          report?: Json
          skipped_rows?: number
          status?: string
          total_rows?: number
          updated_rows?: number
        }
        Relationships: []
      }
      learning_categories: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
          actualized_at: string | null
          author: string | null
          category_id: string | null
          code: string | null
          course_id: string | null
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
          lesson_id: string | null
          material_scope: string
          material_type: string
          mime_type: string | null
          module_id: string | null
          profession_id: string | null
          sort_order: number
          tags: string[] | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          actualized_at?: string | null
          author?: string | null
          category_id?: string | null
          code?: string | null
          course_id?: string | null
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
          lesson_id?: string | null
          material_scope?: string
          material_type?: string
          mime_type?: string | null
          module_id?: string | null
          profession_id?: string | null
          sort_order?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          actualized_at?: string | null
          author?: string | null
          category_id?: string | null
          code?: string | null
          course_id?: string | null
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
          lesson_id?: string | null
          material_scope?: string
          material_type?: string
          mime_type?: string | null
          module_id?: string | null
          profession_id?: string | null
          sort_order?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: string | null
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
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
            foreignKeyName: "materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
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
      model_assets: {
        Row: {
          code: string
          created_at: string
          description: string | null
          file_url: string | null
          format: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          version: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          format?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          format?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_feedback: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          message: string
          program_id: string | null
          rating: number | null
          response: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          message: string
          program_id?: string | null
          rating?: number | null
          response?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          message?: string
          program_id?: string | null
          rating?: number | null
          response?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_feedback_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "onboarding_program_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_feedback_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "onboarding_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_program_items: {
        Row: {
          completed_at: string | null
          course_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_required: boolean
          item_type: string
          link_url: string | null
          material_id: string | null
          mentor_confirmed_at: string | null
          mentor_confirmed_by: string | null
          offset_days: number
          program_id: string
          requires_mentor: boolean
          section: string
          sort_order: number
          status: string
          test_settings_id: string | null
          title: string
          updated_at: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean
          item_type?: string
          link_url?: string | null
          material_id?: string | null
          mentor_confirmed_at?: string | null
          mentor_confirmed_by?: string | null
          offset_days?: number
          program_id: string
          requires_mentor?: boolean
          section?: string
          sort_order?: number
          status?: string
          test_settings_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean
          item_type?: string
          link_url?: string | null
          material_id?: string | null
          mentor_confirmed_at?: string | null
          mentor_confirmed_by?: string | null
          offset_days?: number
          program_id?: string
          requires_mentor?: boolean
          section?: string
          sort_order?: number
          status?: string
          test_settings_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_program_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_program_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_program_items_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "onboarding_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_program_items_test_settings_id_fkey"
            columns: ["test_settings_id"]
            isOneToOne: false
            referencedRelation: "test_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_program_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_programs: {
        Row: {
          comment: string | null
          completed_at: string | null
          created_at: string
          hire_date: string
          id: string
          mentor_id: string | null
          status: string
          template_id: string | null
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          completed_at?: string | null
          created_at?: string
          hire_date: string
          id?: string
          mentor_id?: string | null
          status?: string
          template_id?: string | null
          template_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          completed_at?: string | null
          created_at?: string
          hire_date?: string
          id?: string
          mentor_id?: string | null
          status?: string
          template_id?: string | null
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_programs_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_programs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_template_items: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          item_type: string
          link_url: string | null
          material_id: string | null
          offset_days: number
          requires_mentor: boolean
          section: string
          sort_order: number
          template_id: string
          test_settings_id: string | null
          title: string
          updated_at: string
          video_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          item_type?: string
          link_url?: string | null
          material_id?: string | null
          offset_days?: number
          requires_mentor?: boolean
          section?: string
          sort_order?: number
          template_id: string
          test_settings_id?: string | null
          title: string
          updated_at?: string
          video_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          item_type?: string
          link_url?: string | null
          material_id?: string | null
          offset_days?: number
          requires_mentor?: boolean
          section?: string
          sort_order?: number
          template_id?: string
          test_settings_id?: string | null
          title?: string
          updated_at?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_template_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_template_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_template_items_test_settings_id_fkey"
            columns: ["test_settings_id"]
            isOneToOne: false
            referencedRelation: "test_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_template_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          code: string | null
          created_at: string
          department_id: string | null
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          profession_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          profession_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          profession_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_templates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_templates_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      positions: {
        Row: {
          code: string | null
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
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
      product_categories: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_materials: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_products: {
        Row: {
          brand: string | null
          category: string | null
          code: string
          created_at: string
          default_area: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          code: string
          created_at?: string
          default_area?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          code?: string
          created_at?: string
          default_area?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_routes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_allowed: boolean
          is_required_step: boolean
          process: string
          product_code: string
          step_number: number
          trainer_comment: string | null
          updated_at: string
          work_center_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_allowed?: boolean
          is_required_step?: boolean
          process: string
          product_code: string
          step_number: number
          trainer_comment?: string | null
          updated_at?: string
          work_center_code: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_allowed?: boolean
          is_required_step?: boolean
          process?: string
          product_code?: string
          step_number?: number
          trainer_comment?: string | null
          updated_at?: string
          work_center_code?: string
        }
        Relationships: []
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
      profession_collection: {
        Row: {
          id: string
          level_code: string | null
          profession_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          level_code?: string | null
          profession_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          level_code?: string | null
          profession_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profession_collection_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
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
          code: string | null
          created_at: string
          department_id: string | null
          email: string | null
          full_name: string
          grade: string | null
          hire_date: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          mentor_id: string | null
          onboarding_status: string
          personnel_number: string | null
          phone: string | null
          position: string | null
          position_id: string | null
          profession_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          code?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          grade?: string | null
          hire_date?: string | null
          id: string
          is_active?: boolean
          manager_id?: string | null
          mentor_id?: string | null
          onboarding_status?: string
          personnel_number?: string | null
          phone?: string | null
          position?: string | null
          position_id?: string | null
          profession_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          code?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          grade?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          mentor_id?: string | null
          onboarding_status?: string
          personnel_number?: string | null
          phone?: string | null
          position?: string | null
          position_id?: string | null
          profession_id?: string | null
          status?: string
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
            foreignKeyName: "profiles_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
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
      qualification_history: {
        Row: {
          approved_by: string | null
          approved_by_name: string | null
          attempt_id: string | null
          basis: string | null
          created_at: string
          from_level_id: string | null
          id: string
          profession_id: string | null
          to_level_id: string | null
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          approved_by_name?: string | null
          attempt_id?: string | null
          basis?: string | null
          created_at?: string
          from_level_id?: string | null
          id?: string
          profession_id?: string | null
          to_level_id?: string | null
          user_id: string
        }
        Update: {
          approved_by?: string | null
          approved_by_name?: string | null
          attempt_id?: string | null
          basis?: string | null
          created_at?: string
          from_level_id?: string | null
          id?: string
          profession_id?: string | null
          to_level_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualification_history_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_history_from_level_id_fkey"
            columns: ["from_level_id"]
            isOneToOne: false
            referencedRelation: "qualification_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_history_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_history_to_level_id_fkey"
            columns: ["to_level_id"]
            isOneToOne: false
            referencedRelation: "qualification_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_levels: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_leadership: boolean
          name: string
          next_level_id: string | null
          profession_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_leadership?: boolean
          name: string
          next_level_id?: string | null
          profession_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_leadership?: boolean
          name?: string
          next_level_id?: string | null
          profession_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualification_levels_next_level_id_fkey"
            columns: ["next_level_id"]
            isOneToOne: false
            referencedRelation: "qualification_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_levels_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string | null
          code: string | null
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          is_active: boolean
          is_common: boolean
          points: number
          profession_id: string | null
          question_type: string
          reference_answer: string | null
          source_material_id: string | null
          text: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          is_common?: boolean
          points?: number
          profession_id?: string | null
          question_type?: string
          reference_answer?: string | null
          source_material_id?: string | null
          text: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          is_common?: boolean
          points?: number
          profession_id?: string | null
          question_type?: string
          reference_answer?: string | null
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
      simulator_runs: {
        Row: {
          competency_id: string | null
          correct_steps: number
          created_at: string
          current_step: number
          duration_seconds: number
          errors: number
          finished_at: string | null
          id: string
          max_score: number
          product_code: string
          product_name: string
          profession_id: string | null
          scenario: string
          score: number
          started_at: string
          status: string
          total_steps: number
          updated_at: string
          user_id: string
          work_center_code: string | null
          xp: number
        }
        Insert: {
          competency_id?: string | null
          correct_steps?: number
          created_at?: string
          current_step?: number
          duration_seconds?: number
          errors?: number
          finished_at?: string | null
          id?: string
          max_score?: number
          product_code: string
          product_name: string
          profession_id?: string | null
          scenario?: string
          score?: number
          started_at?: string
          status?: string
          total_steps?: number
          updated_at?: string
          user_id: string
          work_center_code?: string | null
          xp?: number
        }
        Update: {
          competency_id?: string | null
          correct_steps?: number
          created_at?: string
          current_step?: number
          duration_seconds?: number
          errors?: number
          finished_at?: string | null
          id?: string
          max_score?: number
          product_code?: string
          product_name?: string
          profession_id?: string | null
          scenario?: string
          score?: number
          started_at?: string
          status?: string
          total_steps?: number
          updated_at?: string
          user_id?: string
          work_center_code?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulator_runs_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulator_runs_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      simulator_steps: {
        Row: {
          attempts: number
          created_at: string
          duration_seconds: number
          expected_work_centers: string[]
          id: string
          is_correct: boolean
          process: string
          run_id: string
          selected_work_center: string | null
          step_number: number
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          duration_seconds?: number
          expected_work_centers?: string[]
          id?: string
          is_correct?: boolean
          process: string
          run_id: string
          selected_work_center?: string | null
          step_number: number
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          duration_seconds?: number
          expected_work_centers?: string[]
          id?: string
          is_correct?: boolean
          process?: string
          run_id?: string
          selected_work_center?: string | null
          step_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulator_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulator_runs"
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
          points: number
          question_id: string | null
          question_text: string
          review_comment: string | null
          review_score: number | null
          review_status: string
          reviewed_at: string | null
          reviewer_id: string | null
          selected_option_id: string | null
          selected_option_ids: string[]
          selected_text: string | null
          sort_order: number
          text_answer: string | null
          time_spent_seconds: number | null
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          correct_text?: string | null
          id?: string
          is_correct?: boolean | null
          points?: number
          question_id?: string | null
          question_text?: string
          review_comment?: string | null
          review_score?: number | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          selected_option_id?: string | null
          selected_option_ids?: string[]
          selected_text?: string | null
          sort_order?: number
          text_answer?: string | null
          time_spent_seconds?: number | null
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          correct_text?: string | null
          id?: string
          is_correct?: boolean | null
          points?: number
          question_id?: string | null
          question_text?: string
          review_comment?: string | null
          review_score?: number | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          selected_option_id?: string | null
          selected_option_ids?: string[]
          selected_text?: string | null
          sort_order?: number
          text_answer?: string | null
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
          grade_result: string | null
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
          grade_result?: string | null
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
          grade_result?: string | null
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
      test_kinds: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      test_settings: {
        Row: {
          allow_retry: boolean
          code: string | null
          common_questions: number
          course_id: string | null
          created_at: string
          grading_rules: Json
          id: string
          is_default: boolean
          lock_answer: boolean
          max_attempts: number
          mode: string
          pass_percent: number
          profession_id: string | null
          professional_questions: number
          result_rule: string
          retry_interval_hours: number
          show_correct_answer: boolean
          shuffle_options: boolean
          shuffle_questions: boolean
          status: string
          test_scope: string
          time_limit_minutes: number | null
          title: string | null
          total_questions: number
          updated_at: string
          warn_before_minutes: number
        }
        Insert: {
          allow_retry?: boolean
          code?: string | null
          common_questions?: number
          course_id?: string | null
          created_at?: string
          grading_rules?: Json
          id?: string
          is_default?: boolean
          lock_answer?: boolean
          max_attempts?: number
          mode?: string
          pass_percent?: number
          profession_id?: string | null
          professional_questions?: number
          result_rule?: string
          retry_interval_hours?: number
          show_correct_answer?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          status?: string
          test_scope?: string
          time_limit_minutes?: number | null
          title?: string | null
          total_questions?: number
          updated_at?: string
          warn_before_minutes?: number
        }
        Update: {
          allow_retry?: boolean
          code?: string | null
          common_questions?: number
          course_id?: string | null
          created_at?: string
          grading_rules?: Json
          id?: string
          is_default?: boolean
          lock_answer?: boolean
          max_attempts?: number
          mode?: string
          pass_percent?: number
          profession_id?: string | null
          professional_questions?: number
          result_rule?: string
          retry_interval_hours?: number
          show_correct_answer?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          status?: string
          test_scope?: string
          time_limit_minutes?: number | null
          title?: string | null
          total_questions?: number
          updated_at?: string
          warn_before_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_settings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
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
      work_centers: {
        Row: {
          area: string | null
          code: string
          created_at: string
          description: string | null
          equipment_type: string | null
          id: string
          is_active: boolean
          name: string
          process: string | null
          site: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          code: string
          created_at?: string
          description?: string | null
          equipment_type?: string | null
          id?: string
          is_active?: boolean
          name: string
          process?: string | null
          site?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          code?: string
          created_at?: string
          description?: string | null
          equipment_type?: string | null
          id?: string
          is_active?: boolean
          name?: string
          process?: string | null
          site?: string | null
          updated_at?: string
        }
        Relationships: []
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
      is_mentor_of: {
        Args: { _mentor: string; _target: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      manages_user: {
        Args: { _manager: string; _target: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "employee" | "manager" | "hr" | "admin" | "teacher"
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
      app_role: ["employee", "manager", "hr", "admin", "teacher"],
    },
  },
} as const
