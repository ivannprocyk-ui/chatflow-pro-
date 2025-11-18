-- =====================================================
-- ADD MESSAGE TYPE, AI INSTRUCTIONS AND IMAGE SUPPORT
-- Author: ChatFlow Pro Team
-- Date: 2025-01-18
-- Description: Adds support for AI-generated messages and images
-- =====================================================

-- Add new columns to follow_up_messages table
ALTER TABLE follow_up_messages
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'fixed' CHECK (message_type IN ('fixed', 'ai_generated')),
  ADD COLUMN IF NOT EXISTS ai_context_instructions TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to explain the new fields
COMMENT ON COLUMN follow_up_messages.message_type IS 'Type of message: fixed (template) or ai_generated (AI creates based on context)';
COMMENT ON COLUMN follow_up_messages.ai_context_instructions IS 'Instructions for AI to generate personalized message based on conversation context';
COMMENT ON COLUMN follow_up_messages.image_url IS 'Optional image URL to send with the message (JPG, PNG)';
