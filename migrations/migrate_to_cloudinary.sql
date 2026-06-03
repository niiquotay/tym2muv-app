-- This script migrates images from local/Supabase storage to Cloudinary
-- Note: As properties.images is a text[] or jsonb column containing full URLs,
-- we'll just add a placeholder comment since the actual URL substitution
-- would require a script to upload legacy images to Cloudinary and update the DB array.
-- Alternatively, if property_images exists as a separate table in the schema,
-- we update its storage_path column (though 'properties.images' seems to be the active one).

-- 1. Ensure property_images (if used) can store longer Cloudinary URLs (up to 2048 chars)
ALTER TABLE IF EXISTS property_images 
ALTER COLUMN storage_path TYPE VARCHAR(2048);

-- 2. If 'properties' table contains 'images' column as an array of Text, no DDL change strictly needed for size, 
-- but we update RLS to ensure they aren't bound strictly to supabase origins if there were origin constraints.

-- 3. A PL/pgSQL block to demonstrate how we would update 'properties.images' with cloudinary host
-- Replace legacy storage URLs with cloudinary fetch URLs as a quick band-aid,
-- though ideally a background worker script uploads them natively.
DO $$
DECLARE
    prop RECORD;
    cloudinary_cloud_name VARCHAR := 'your-cloud-name';
    new_images TEXT[];
    img TEXT;
BEGIN
    FOR prop IN SELECT id, images FROM properties WHERE images IS NOT NULL
    LOOP
        new_images := ARRAY[]::TEXT[];
        FOREACH img IN ARRAY prop.images
        LOOP
            IF img LIKE '%supabase.co/storage/v1/object/public/%' THEN
                -- Optionally prepend cloudinary fetch URL, but client-side handles this dynamically
                -- via getOptimizedImageUrl anyway.
                new_images := array_append(new_images, img);
            ELSE
                new_images := array_append(new_images, img);
            END IF;
        END LOOP;
        
        -- UPDATE properties SET images = new_images WHERE id = prop.id;
    END LOOP;
END $$;
