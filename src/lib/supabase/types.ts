export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Orbit = 'leo' | 'geo' | 'moon' | 'mars' | 'deep_space'
export type QuestionStatus = 'open' | 'landed' | 'archived' | 'removed'
export type MissionStatus = 'proposed' | 'building' | 'landing_claimed' | 'landed' | 'removed'
export type UserRole = 'crew' | 'mod' | 'admin'
export type MarketStatus = 'open' | 'resolved' | 'void'
export type ReportStatus = 'open' | 'actioned' | 'dismissed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          handle: string
          display_name: string
          bio: string | null
          fuel: number
          reputation: number
          role: UserRole
          last_checkin_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          handle: string
          display_name?: string
          bio?: string | null
          fuel?: number
          reputation?: number
          role?: UserRole
          last_checkin_at?: string | null
          created_at?: string
        }
        Update: {
          display_name?: string
          bio?: string | null
        }
      }
      questions: {
        Row: {
          id: string
          slug: string
          author_id: string
          title: string
          body: string | null
          orbit: Orbit
          tags: string[]
          absurdity: number | null
          vote_count: number
          status: QuestionStatus
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          author_id: string
          title: string
          body?: string | null
          orbit?: Orbit
          tags?: string[]
          absurdity?: number | null
          vote_count?: number
          status?: QuestionStatus
          created_at?: string
        }
        Update: {
          title?: string
          body?: string | null
          orbit?: Orbit
          tags?: string[]
          status?: QuestionStatus
        }
      }
      missions: {
        Row: {
          id: string
          question_id: string
          author_id: string
          title: string
          body: string
          rigor: number | null
          vote_count: number
          score: number
          status: MissionStatus
          proof_url: string | null
          proof_note: string | null
          scored_bonus_paid: boolean
          landed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          author_id: string
          title: string
          body: string
          rigor?: number | null
          vote_count?: number
          score?: number
          status?: MissionStatus
          proof_url?: string | null
          proof_note?: string | null
          scored_bonus_paid?: boolean
          landed_at?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          body?: string
          status?: MissionStatus
          proof_url?: string | null
          proof_note?: string | null
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          target_type: 'question' | 'mission'
          target_id: string
          dimension: 'absurdity' | 'rigor'
          value: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_type: 'question' | 'mission'
          target_id: string
          dimension: 'absurdity' | 'rigor'
          value: number
          created_at?: string
        }
        Update: {
          value?: number
        }
      }
      fuel_ledger: {
        Row: {
          id: number
          user_id: string
          delta: number
          reason: 'signup' | 'daily_checkin' | 'stake' | 'payout' | 'refund' | 'score_bonus' | 'landing_bonus' | 'admin_adjust'
          ref_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          delta: number
          reason: 'signup' | 'daily_checkin' | 'stake' | 'payout' | 'refund' | 'score_bonus' | 'landing_bonus' | 'admin_adjust'
          ref_id?: string | null
          created_at?: string
        }
        Update: never
      }
      markets: {
        Row: {
          id: string
          question_id: string
          question_text: string
          status: MarketStatus
          resolves_at: string
          outcome: boolean | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          question_text: string
          status?: MarketStatus
          resolves_at: string
          outcome?: boolean | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          status?: MarketStatus
          outcome?: boolean | null
          resolved_by?: string | null
          resolved_at?: string | null
        }
      }
      stakes: {
        Row: {
          id: string
          market_id: string
          user_id: string
          side: boolean
          amount: number
          payout: number | null
          created_at: string
        }
        Insert: {
          id?: string
          market_id: string
          user_id: string
          side: boolean
          amount: number
          payout?: number | null
          created_at?: string
        }
        Update: {
          payout?: number | null
        }
      }
      pledges: {
        Row: {
          id: string
          target_type: 'question' | 'mission'
          target_id: string
          user_id: string
          amount_eur: number
          message: string | null
          status: 'pledged' | 'withdrawn'
          created_at: string
        }
        Insert: {
          id?: string
          target_type: 'question' | 'mission'
          target_id: string
          user_id: string
          amount_eur: number
          message?: string | null
          status?: 'pledged' | 'withdrawn'
          created_at?: string
        }
        Update: {
          status?: 'pledged' | 'withdrawn'
        }
      }
      comments: {
        Row: {
          id: string
          target_type: 'question' | 'mission'
          target_id: string
          author_id: string
          body: string
          status: 'visible' | 'removed'
          created_at: string
        }
        Insert: {
          id?: string
          target_type: 'question' | 'mission'
          target_id: string
          author_id: string
          body: string
          status?: 'visible' | 'removed'
          created_at?: string
        }
        Update: {
          status?: 'visible' | 'removed'
        }
      }
      reports: {
        Row: {
          id: string
          target_type: 'question' | 'mission' | 'comment'
          target_id: string
          reporter_id: string
          reason: string
          status: ReportStatus
          created_at: string
        }
        Insert: {
          id?: string
          target_type: 'question' | 'mission' | 'comment'
          target_id: string
          reporter_id: string
          reason: string
          status?: ReportStatus
          created_at?: string
        }
        Update: {
          status?: ReportStatus
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      place_stake: {
        Args: { p_market: string; p_side: boolean; p_amount: number }
        Returns: void
      }
      daily_checkin: {
        Args: Record<string, never>
        Returns: number
      }
      resolve_market: {
        Args: { p_market: string; p_outcome: boolean }
        Returns: void
      }
      claim_landing: {
        Args: { p_mission: string; p_proof_url: string; p_note: string }
        Returns: void
      }
      verify_landing: {
        Args: { p_mission: string; p_approve: boolean; p_mod_note: string }
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}
