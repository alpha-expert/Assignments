require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const seedQueries = [
  // Seed Sections
  `INSERT INTO sections (name) VALUES 
  ('A'),
  ('B'),
  ('C'),
  ('D')
  ON CONFLICT (name) DO NOTHING;`,

  // Seed Classes
  `INSERT INTO classes (name, sections) VALUES 
  ('Class 1', 'A,B'),
  ('Class 2', 'A,B'),
  ('Class 3', 'A,B'),
  ('Class 4', 'A,B'),
  ('Class 5', 'A,B'),
  ('Class 6', 'A,B,C'),
  ('Class 7', 'A,B,C'),
  ('Class 8', 'A,B,C'),
  ('Class 9', 'A,B,C,D'),
  ('Class 10', 'A,B,C,D'),
  ('Class 11', 'A,B'),
  ('Class 12', 'A,B')
  ON CONFLICT (name) DO NOTHING;`,

  // Seed Departments
  `INSERT INTO departments (name) VALUES 
  ('Mathematics'),
  ('Science'),
  ('English'),
  ('Social Studies'),
  ('Administration')
  ON CONFLICT (name) DO NOTHING;`,

  // Seed Leave Policies (using NOT EXISTS since there is no UNIQUE constraint on name)
  `INSERT INTO leave_policies (name, is_active)
  SELECT name, is_active FROM (VALUES
    ('Casual Leave', true),
    ('Sick Leave', true),
    ('Maternity Leave', true),
    ('Paternity Leave', true)
  ) AS t(name, is_active)
  WHERE NOT EXISTS (
    SELECT 1 FROM leave_policies WHERE leave_policies.name = t.name
  );`
];

async function runSeed() {
  console.log("Starting database seeding of academic metadata...");
  try {
    for (const query of seedQueries) {
      await pool.query(query);
    }
    console.log("Database seeded successfully with classes, sections, departments, and leave policies!");
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
