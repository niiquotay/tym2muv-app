ALTER TABLE properties ADD CONSTRAINT price_positive CHECK (price > 0);
