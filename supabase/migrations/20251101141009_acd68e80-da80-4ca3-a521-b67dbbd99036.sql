-- Update the app_role enum to include all role types
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'student';