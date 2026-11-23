
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "business_members": {
                  Row: {
                    "business_id": string,"created_at": string,"member_role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"member_role"?: string,"user_id": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"member_role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_members_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "business_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"id": string,"name": string,"plan": string,"province": string | null,"sector": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name": string,"plan"?: string,"province"?: string | null,"sector"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"plan"?: string,"province"?: string | null,"sector"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"case_events": {
                  Row: {
                    "actor_id": string | null,"business_id": string,"case_id": string,"created_at": string,"event_type": string,"id": string,"payload": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"business_id": string,"case_id": string,"created_at"?: string,"event_type": string,"id"?: string,"payload"?: NonNullable<Json>
                  }
                  Update: {
                    "actor_id"?: string | null,"business_id"?: string,"case_id"?: string,"created_at"?: string,"event_type"?: string,"id"?: string,"payload"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "case_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "case_events_case_id_business_id_fkey"
      columns: ["case_id","business_id"]
isOneToOne: false
      referencedRelation: "cases"
      referencedColumns: ["id","business_id"]
    }
                  ]
                },"cases": {
                  Row: {
                    "archived_at": string | null,"business_id": string,"chairperson_name": string | null,"closed_at": string | null,"complainant_name": string | null,"created_at": string,"created_by": string | null,"current_step": string,"employee_id": string,"hearing_at": string | null,"id": string,"incident_id": string | null,"outcome": string,"reference": string,"review_status": string,"step_data": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"business_id": string,"chairperson_name"?: string | null,"closed_at"?: string | null,"complainant_name"?: string | null,"created_at"?: string,"created_by"?: string | null,"current_step"?: string,"employee_id": string,"hearing_at"?: string | null,"id"?: string,"incident_id"?: string | null,"outcome"?: string,"reference"?: string,"review_status"?: string,"step_data"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"business_id"?: string,"chairperson_name"?: string | null,"closed_at"?: string | null,"complainant_name"?: string | null,"created_at"?: string,"created_by"?: string | null,"current_step"?: string,"employee_id"?: string,"hearing_at"?: string | null,"id"?: string,"incident_id"?: string | null,"outcome"?: string,"reference"?: string,"review_status"?: string,"step_data"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cases_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cases_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cases_employee_id_business_id_fkey"
      columns: ["employee_id","business_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id","business_id"]
    },{
      foreignKeyName: "cases_incident_id_business_id_fkey"
      columns: ["incident_id","business_id"]
isOneToOne: false
      referencedRelation: "incidents"
      referencedColumns: ["id","business_id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string | null,"body": string,"business_id": string,"case_id": string,"created_at": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"business_id": string,"case_id": string,"created_at"?: string,"id"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"business_id"?: string,"case_id"?: string,"created_at"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_case_id_business_id_fkey"
      columns: ["case_id","business_id"]
isOneToOne: false
      referencedRelation: "cases"
      referencedColumns: ["id","business_id"]
    }
                  ]
                },"consultant_assignments": {
                  Row: {
                    "assigned_by": string | null,"business_id": string,"consultant_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_by"?: string | null,"business_id": string,"consultant_id": string,"created_at"?: string
                  }
                  Update: {
                    "assigned_by"?: string | null,"business_id"?: string,"consultant_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consultant_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultant_assignments_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultant_assignments_consultant_id_fkey"
      columns: ["consultant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"documents": {
                  Row: {
                    "archived_at": string | null,"business_id": string,"case_id": string | null,"created_at": string,"created_by": string | null,"file_name": string,"id": string,"incident_id": string | null,"kind": string,"mime_type": string,"size_bytes": number,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"business_id": string,"case_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"file_name": string,"id"?: string,"incident_id"?: string | null,"kind": string,"mime_type": string,"size_bytes": number,"storage_path": string
                  }
                  Update: {
                    "archived_at"?: string | null,"business_id"?: string,"case_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"file_name"?: string,"id"?: string,"incident_id"?: string | null,"kind"?: string,"mime_type"?: string,"size_bytes"?: number,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_case_id_business_id_fkey"
      columns: ["case_id","business_id"]
isOneToOne: false
      referencedRelation: "cases"
      referencedColumns: ["id","business_id"]
    },{
      foreignKeyName: "documents_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_incident_id_business_id_fkey"
      columns: ["incident_id","business_id"]
isOneToOne: false
      referencedRelation: "incidents"
      referencedColumns: ["id","business_id"]
    }
                  ]
                },"employees": {
                  Row: {
                    "business_id": string,"created_at": string,"employee_number": string | null,"first_name": string,"id": string,"job_title": string,"last_name": string,"start_date": string | null,"status": string,"updated_at": string,"work_email": string | null,"work_phone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"employee_number"?: string | null,"first_name": string,"id"?: string,"job_title": string,"last_name": string,"start_date"?: string | null,"status"?: string,"updated_at"?: string,"work_email"?: string | null,"work_phone"?: string | null
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"employee_number"?: string | null,"first_name"?: string,"id"?: string,"job_title"?: string,"last_name"?: string,"start_date"?: string | null,"status"?: string,"updated_at"?: string,"work_email"?: string | null,"work_phone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "employees_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"incidents": {
                  Row: {
                    "archived_at": string | null,"business_id": string,"category": string,"created_at": string,"description": string,"employee_id": string,"id": string,"location": string,"occurred_at": string,"reported_by": string | null,"updated_at": string,"witnesses": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"business_id": string,"category": string,"created_at"?: string,"description": string,"employee_id": string,"id"?: string,"location": string,"occurred_at": string,"reported_by"?: string | null,"updated_at"?: string,"witnesses"?: (string)[]
                  }
                  Update: {
                    "archived_at"?: string | null,"business_id"?: string,"category"?: string,"created_at"?: string,"description"?: string,"employee_id"?: string,"id"?: string,"location"?: string,"occurred_at"?: string,"reported_by"?: string | null,"updated_at"?: string,"witnesses"?: (string)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "incidents_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_employee_id_business_id_fkey"
      columns: ["employee_id","business_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id","business_id"]
    },{
      foreignKeyName: "incidents_reported_by_fkey"
      columns: ["reported_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"role": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name": string,"id": string,"role"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"role"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "next_case_reference":
{ Args: Record<PropertyKey, never>; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
