/*
  # Create Fuel Stations Table

  1. New Tables
    - `fuel_stations`
      - `id` (bigint, primary key)
      - `name` (text, not null)
      - `location` (text, not null)
      - `petrol_price` (numeric, not null)
      - `diesel_price` (numeric, not null)
      - `last_updated` (timestamptz, not null)
      - `created_at` (timestamptz, not null)

  2. Security
    - Enable RLS on `fuel_stations` table
    - Add policies for:
      - Public read access
      - Authenticated users can create and update stations
*/

CREATE TABLE IF NOT EXISTS fuel_stations (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  location text NOT NULL,
  petrol_price numeric NOT NULL,
  diesel_price numeric NOT NULL,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE fuel_stations ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON fuel_stations
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create stations
CREATE POLICY "Allow authenticated users to create stations"
  ON fuel_stations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update stations
CREATE POLICY "Allow authenticated users to update stations"
  ON fuel_stations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);