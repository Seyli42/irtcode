/*
  # Create interventions table

  1. New Tables
    - `interventions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `date` (date)
      - `time` (text)
      - `nd_number` (text)
      - `provider` (text)
      - `service_type` (text)
      - `price` (numeric)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create interventions table
CREATE TABLE interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  nd_number text NOT NULL,
  provider text NOT NULL,
  service_type text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('success', 'failure')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own interventions"
ON interventions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can insert own interventions"
ON interventions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can update own interventions"
ON interventions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  user_id = auth.uid()
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can delete own interventions"
ON interventions
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Create indexes
CREATE INDEX interventions_user_id_idx ON interventions(user_id);
CREATE INDEX interventions_date_idx ON interventions(date);
CREATE INDEX interventions_provider_idx ON interventions(provider);