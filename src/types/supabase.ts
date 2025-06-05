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
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'auto-entrepreneur' | 'employee'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'auto-entrepreneur' | 'employee'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'auto-entrepreneur' | 'employee'
          created_at?: string
        }
      }
    }
  }
}