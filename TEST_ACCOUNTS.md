# Test Account Setup Instructions

This document explains how to create test accounts for prototyping the Course Management System with role-based access control.

## Test Accounts to Create

You need to create three test accounts with different roles:

1. **Teacher Account**
   - Email: `teacher@school.edu`
   - Password: `teacher123`
   - Role: `teacher`
   - Access: Main dashboard with course management

2. **TA Account**
   - Email: `ta@school.edu`
   - Password: `ta123`
   - Role: `ta`
   - Access: TA dashboard

3. **Student Account**
   - Email: `student@school.edu`
   - Password: `student123`
   - Role: `student`
   - Access: Student view (to be implemented)

## How to Create Test Accounts

### Step 1: Sign Up Users

Since email confirmation is disabled for testing, you can create accounts directly:

1. Go to `/auth` route in your app
2. For each test account:
   - Enter the email and password
   - Click "Sign In" (this will show an error since the account doesn't exist yet)
   - You'll need to use the Supabase backend to create these users manually

### Step 2: Assign Roles

After creating the user accounts, you need to assign roles in the `user_roles` table. Use the Lovable Cloud backend to run these SQL queries:

```sql
-- Get user IDs first
SELECT id, email FROM auth.users WHERE email IN ('teacher@school.edu', 'ta@school.edu', 'student@school.edu');

-- Then assign roles (replace the UUIDs with actual user IDs from the query above)
-- Teacher role for CS101
INSERT INTO public.user_roles (student_id, course_code, role)
VALUES 
  ('<teacher-user-id>', 'CS101', 'teacher');

-- TA role for CS101
INSERT INTO public.user_roles (student_id, course_code, role)
VALUES 
  ('<ta-user-id>', 'CS101', 'ta');

-- Student role for CS101
INSERT INTO public.user_roles (student_id, course_code, role)
VALUES 
  ('<student-user-id>', 'CS101', 'student');
```

### Step 3: Test Access

After creating accounts and assigning roles:

1. **Teacher**: Login with `teacher@school.edu` → Should access main dashboard at `/`
2. **TA**: Login with `ta@school.edu` → Should access TA dashboard at `/ta-dashboard`
3. **Student**: Login with `student@school.edu` → Will see access denied for teacher/TA pages

## Current Implementation Notes

- Email confirmation is disabled for quick testing
- Passwords are simple for prototyping (should be stronger in production)
- Roles are course-specific (currently using 'CS101' as the test course)
- The system uses Row-Level Security (RLS) for data access control

## Authentication Flow

1. Users land on `/auth` if not authenticated
2. After login, users are redirected to `/`
3. Protected routes check user roles:
   - `/` - Requires 'teacher' role
   - `/ta-dashboard` - Requires 'ta' role
4. Unauthorized access shows "Access Denied" message
