-- Clean up file URL references in database
UPDATE assignments SET file_url = NULL WHERE file_url IS NOT NULL;
UPDATE submissions SET file_url = NULL WHERE file_url IS NOT NULL;

-- Delete all objects from the storage buckets first
DELETE FROM storage.objects WHERE bucket_id = 'assignment-files';
DELETE FROM storage.objects WHERE bucket_id = 'submission-files';

-- Now delete the storage buckets
DELETE FROM storage.buckets WHERE id = 'assignment-files';
DELETE FROM storage.buckets WHERE id = 'submission-files';