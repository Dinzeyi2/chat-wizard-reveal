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
      app_projects: {
        Row: {
          app_data: Json
          created_at: string
          id: string
          modification_prompt: string | null
          original_prompt: string | null
          parent_id: string | null
          user_id: string
          version: number
        }
        Insert: {
          app_data: Json
          created_at?: string
          id?: string
          modification_prompt?: string | null
          original_prompt?: string | null
          parent_id?: string | null
          user_id: string
          version?: number
        }
        Update: {
          app_data?: Json
          created_at?: string
          id?: string
          modification_prompt?: string | null
          original_prompt?: string | null
          parent_id?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_projects_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "app_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      boosted_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boosted_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      build_configs: {
        Row: {
          config: Json
          env: string
          id: string
          project_id: string
          type: string
        }
        Insert: {
          config: Json
          env?: string
          id?: string
          project_id: string
          type: string
        }
        Update: {
          config?: Json
          env?: string
          id?: string
          project_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_configs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      career_programs: {
        Row: {
          created_at: string | null
          field: string
          id: string
          program: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          field: string
          id?: string
          program: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          field?: string
          id?: string
          program?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          created_at: string | null
          id: string
          last_message: string | null
          messages: Json | null
          timestamp: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          messages?: Json | null
          timestamp?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          messages?: Json | null
          timestamp?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      code_samples: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          media: Json | null
          metadata: Json | null
          shoutout_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          media?: Json | null
          metadata?: Json | null
          shoutout_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          media?: Json | null
          metadata?: Json | null
          shoutout_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_shoutout_id_fkey"
            columns: ["shoutout_id"]
            isOneToOne: false
            referencedRelation: "shoutouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      components: {
        Row: {
          dependencies: Json | null
          description: string | null
          id: string
          last_modified: string
          name: string
          project_id: string
          type: string
        }
        Insert: {
          dependencies?: Json | null
          description?: string | null
          id?: string
          last_modified?: string
          name: string
          project_id: string
          type?: string
        }
        Update: {
          dependencies?: Json | null
          description?: string | null
          id?: string
          last_modified?: string
          name?: string
          project_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "components_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connected_user_id: string
          created_at: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          connected_user_id: string
          created_at?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          connected_user_id?: string
          created_at?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          candidates: Json[] | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["message_role"]
        }
        Insert: {
          candidates?: Json[] | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["message_role"]
        }
        Update: {
          candidates?: Json[] | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["message_role"]
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dependencies: {
        Row: {
          id: string
          name: string
          project_id: string
          scope: string
          type: string
          version: string
        }
        Insert: {
          id?: string
          name: string
          project_id: string
          scope?: string
          type?: string
          version: string
        }
        Update: {
          id?: string
          name?: string
          project_id?: string
          scope?: string
          type?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_repository_files: {
        Row: {
          content: string | null
          created_at: string | null
          file_path: string
          id: string
          repository_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_path: string
          id?: string
          repository_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_path?: string
          id?: string
          repository_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          component_id: string | null
          content: string
          id: string
          last_modified: string
          path: string
          project_id: string
          type: string
        }
        Insert: {
          component_id?: string | null
          content: string
          id?: string
          last_modified?: string
          path: string
          project_id: string
          type?: string
        }
        Update: {
          component_id?: string | null
          content?: string
          id?: string
          last_modified?: string
          path?: string
          project_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      generated_scripts: {
        Row: {
          created_at: string
          generated_script: string
          id: string
          platform: string
          project_description: string
        }
        Insert: {
          created_at?: string
          generated_script: string
          id?: string
          platform: string
          project_description: string
        }
        Update: {
          created_at?: string
          generated_script?: string
          id?: string
          platform?: string
          project_description?: string
        }
        Relationships: []
      }
      github_connections: {
        Row: {
          access_token: string
          connected_at: string
          github_avatar: string | null
          github_id: string
          github_name: string | null
          github_username: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          github_avatar?: string | null
          github_id: string
          github_name?: string | null
          github_username: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          github_avatar?: string | null
          github_id?: string
          github_name?: string | null
          github_username?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
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
          created_at: string | null
          created_by: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      library_resources: {
        Row: {
          content: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          media: Json | null
          project_id: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          media?: Json | null
          project_id?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          media?: Json | null
          project_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          shoutout_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shoutout_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shoutout_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_shoutout_id_fkey"
            columns: ["shoutout_id"]
            isOneToOne: false
            referencedRelation: "shoutouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          receiver_id: string
          sender_id: string
          video_duration: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          receiver_id: string
          sender_id: string
          video_duration?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          receiver_id?: string
          sender_id?: string
          video_duration?: number | null
        }
        Relationships: []
      }
      modifications: {
        Row: {
          changed_components: Json | null
          changed_files: Json | null
          description: string
          diff_stats: Json | null
          id: string
          project_id: string
          request_text: string
          response_text: string | null
          timestamp: string
        }
        Insert: {
          changed_components?: Json | null
          changed_files?: Json | null
          description: string
          diff_stats?: Json | null
          id?: string
          project_id: string
          request_text: string
          response_text?: string | null
          timestamp?: string
        }
        Update: {
          changed_components?: Json | null
          changed_files?: Json | null
          description?: string
          diff_stats?: Json | null
          id?: string
          project_id?: string
          request_text?: string
          response_text?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          recipient_id: string
          sender_id: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          recipient_id: string
          sender_id: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          recipient_id?: string
          sender_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_bludifies: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          session_id: string
          shoutout_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          session_id: string
          shoutout_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          session_id?: string
          shoutout_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_shoutout_id_fkey"
            columns: ["shoutout_id"]
            isOneToOne: false
            referencedRelation: "shoutouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_tier: string | null
          available_for_hire: boolean | null
          avatar_url: string | null
          billing_status: string | null
          company: string | null
          created_at: string | null
          description: string | null
          education: Json | null
          email: string | null
          email_notifications_enabled: boolean | null
          experience: string | null
          experiences: Json | null
          featured_projects: string[] | null
          field: string | null
          full_name: string
          id: string
          linkedin_id: string | null
          linkedin_url: string | null
          links: Json | null
          open_to_work: boolean | null
          phone: string | null
          portfolio_theme: string | null
          profession: string | null
          programming_languages: string[] | null
          projects: Json | null
          role: string | null
          skills: string[] | null
          socials: Json | null
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          account_tier?: string | null
          available_for_hire?: boolean | null
          avatar_url?: string | null
          billing_status?: string | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          education?: Json | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          experience?: string | null
          experiences?: Json | null
          featured_projects?: string[] | null
          field?: string | null
          full_name: string
          id?: string
          linkedin_id?: string | null
          linkedin_url?: string | null
          links?: Json | null
          open_to_work?: boolean | null
          phone?: string | null
          portfolio_theme?: string | null
          profession?: string | null
          programming_languages?: string[] | null
          projects?: Json | null
          role?: string | null
          skills?: string[] | null
          socials?: Json | null
          updated_at?: string | null
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          account_tier?: string | null
          available_for_hire?: boolean | null
          avatar_url?: string | null
          billing_status?: string | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          education?: Json | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          experience?: string | null
          experiences?: Json | null
          featured_projects?: string[] | null
          field?: string | null
          full_name?: string
          id?: string
          linkedin_id?: string | null
          linkedin_url?: string | null
          links?: Json | null
          open_to_work?: boolean | null
          phone?: string | null
          portfolio_theme?: string | null
          profession?: string | null
          programming_languages?: string[] | null
          projects?: Json | null
          role?: string | null
          skills?: string[] | null
          socials?: Json | null
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      project_submissions: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          root_directory: string
          status: string
          type: string
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          root_directory?: string
          status?: string
          type?: string
          updated_at?: string
          user_id: string
          version?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          root_directory?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      repository_analyses: {
        Row: {
          code_samples: Json | null
          coding_level: number
          completed_at: string | null
          created_at: string
          failed_repos: Json | null
          id: string
          repositories: string[]
          style_match_percentage: number
          style_metrics: Json
          user_id: string | null
        }
        Insert: {
          code_samples?: Json | null
          coding_level: number
          completed_at?: string | null
          created_at?: string
          failed_repos?: Json | null
          id?: string
          repositories: string[]
          style_match_percentage: number
          style_metrics?: Json
          user_id?: string | null
        }
        Update: {
          code_samples?: Json | null
          coding_level?: number
          completed_at?: string | null
          created_at?: string
          failed_repos?: Json | null
          id?: string
          repositories?: string[]
          style_match_percentage?: number
          style_metrics?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      repository_analysis_status: {
        Row: {
          created_at: string
          id: string
          status_json: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status_json?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status_json?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      repository_files: {
        Row: {
          content: string | null
          created_at: string | null
          file_path: string
          id: string
          repository_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_path: string
          id?: string
          repository_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_path?: string
          id?: string
          repository_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      reposts: {
        Row: {
          created_at: string
          id: string
          shoutout_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shoutout_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shoutout_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposts_shoutout_id_fkey"
            columns: ["shoutout_id"]
            isOneToOne: false
            referencedRelation: "shoutouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          is_from_chat: boolean | null
          rating: number | null
          recipient_id: string
          reviewer_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_from_chat?: boolean | null
          rating?: number | null
          recipient_id: string
          reviewer_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_from_chat?: boolean | null
          rating?: number | null
          recipient_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      saved_comments: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_comments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          shoutout_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          shoutout_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          shoutout_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_shoutout_id_fkey"
            columns: ["shoutout_id"]
            isOneToOne: false
            referencedRelation: "shoutouts"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_profile_links: {
        Row: {
          created_at: string
          id: string
          profile_data: Json
          slug: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_data: Json
          slug: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_data?: Json
          slug?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shoutouts: {
        Row: {
          content: string
          created_at: string
          id: string
          media: Json | null
          metadata: Json | null
          quoted_shoutout_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media?: Json | null
          metadata?: Json | null
          quoted_shoutout_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media?: Json | null
          metadata?: Json | null
          quoted_shoutout_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shoutouts_quoted_shoutout_id_fkey"
            columns: ["quoted_shoutout_id"]
            isOneToOne: false
            referencedRelation: "shoutouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shoutouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          price_id: string | null
          quantity: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          price_id?: string | null
          quantity?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          price_id?: string | null
          quantity?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_details: {
        Row: {
          created_at: string | null
          detailed_content: Json
          field: string
          id: string
          task_title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          detailed_content: Json
          field: string
          id?: string
          task_title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          detailed_content?: Json
          field?: string
          id?: string
          task_title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      uploaded_documents: {
        Row: {
          content: string | null
          created_at: string
          file_name: string
          file_type: string
          id: string
          page_count: number
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_name: string
          file_type: string
          id?: string
          page_count: number
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          page_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_limits: {
        Row: {
          created_at: string
          id: string
          media_analyses_used: number
          messages_used: number
          period_end: string
          period_start: string
          subscription_tier: string
          updated_at: string
          user_id: string
          youtube_searches_used: number
        }
        Insert: {
          created_at?: string
          id?: string
          media_analyses_used?: number
          messages_used?: number
          period_end?: string
          period_start?: string
          subscription_tier?: string
          updated_at?: string
          user_id: string
          youtube_searches_used?: number
        }
        Update: {
          created_at?: string
          id?: string
          media_analyses_used?: number
          messages_used?: number
          period_end?: string
          period_start?: string
          subscription_tier?: string
          updated_at?: string
          user_id?: string
          youtube_searches_used?: number
        }
        Relationships: []
      }
      user_projects: {
        Row: {
          company: string | null
          completion_comment: string | null
          completion_date: string | null
          created_at: string
          description: string
          details: string | null
          difficulty: string
          featured: boolean | null
          github_url: string | null
          id: string
          media: Json | null
          project_link: string | null
          public: boolean | null
          skills: string[]
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          completion_comment?: string | null
          completion_date?: string | null
          created_at?: string
          description: string
          details?: string | null
          difficulty: string
          featured?: boolean | null
          github_url?: string | null
          id?: string
          media?: Json | null
          project_link?: string | null
          public?: boolean | null
          skills?: string[]
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          completion_comment?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string
          details?: string | null
          difficulty?: string
          featured?: boolean | null
          github_url?: string | null
          id?: string
          media?: Json | null
          project_link?: string | null
          public?: boolean | null
          skills?: string[]
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_resumes: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          last_active: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_active?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_active?: string
          user_id?: string
        }
        Relationships: []
      }
      user_usage_limits: {
        Row: {
          id: string
          month: string
          opportunities_searched: number
          projects_generated: number
          user_id: string
        }
        Insert: {
          id?: string
          month?: string
          opportunities_searched?: number
          projects_generated?: number
          user_id: string
        }
        Update: {
          id?: string
          month?: string
          opportunities_searched?: number
          projects_generated?: number
          user_id?: string
        }
        Relationships: []
      }
      video_projects: {
        Row: {
          created_at: string
          generated_script: string | null
          id: string
          narration_url: string | null
          original_video_url: string | null
          target_platform: string
          topic: string
          tts_voice: Database["public"]["Enums"]["tts_voice"] | null
          updated_at: string
          user_id: string | null
          video_duration: number | null
          video_url: string | null
          voice_id: string | null
          voiceover_url: string | null
          waveform_url: string | null
        }
        Insert: {
          created_at?: string
          generated_script?: string | null
          id?: string
          narration_url?: string | null
          original_video_url?: string | null
          target_platform: string
          topic: string
          tts_voice?: Database["public"]["Enums"]["tts_voice"] | null
          updated_at?: string
          user_id?: string | null
          video_duration?: number | null
          video_url?: string | null
          voice_id?: string | null
          voiceover_url?: string | null
          waveform_url?: string | null
        }
        Update: {
          created_at?: string
          generated_script?: string | null
          id?: string
          narration_url?: string | null
          original_video_url?: string | null
          target_platform?: string
          topic?: string
          tts_voice?: Database["public"]["Enums"]["tts_voice"] | null
          updated_at?: string
          user_id?: string | null
          video_duration?: number | null
          video_url?: string | null
          voice_id?: string | null
          voiceover_url?: string | null
          waveform_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_review_user: {
        Args: { reviewer_uid: string; recipient_uid: string }
        Returns: boolean
      }
      cleanup_expired_boosted_content: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_secret: {
        Args: { secret_name: string }
        Returns: string
      }
      manually_cleanup_expired_content: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      save_push_subscription: {
        Args: { p_user_id: string; p_subscription: string }
        Returns: undefined
      }
    }
    Enums: {
      message_role: "user" | "assistant"
      tts_voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
      user_type: "candidate" | "recruiter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      message_role: ["user", "assistant"],
      tts_voice: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
      user_type: ["candidate", "recruiter"],
    },
  },
} as const
