import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 5 });

try {
  const testAnswers = { q1: 3, q2: 2, q3: 1, q4: 4, q5: 3, q6: 4, q7: 4, q8: 3 };
  const rows = await sql`
    INSERT INTO parent_child_profiles
      (parent_name, parent_email, parent_phone,
       child_name, child_age, child_gender,
       answers, readiness, stage)
    VALUES
      ('SMOKE TEST', 'smoke@test.local', '+0000000000',
       'Smoke Child', 12, 'Boy',
       ${sql.json(testAnswers)}, 'medium', 1)
    RETURNING id, parent_name, child_name, readiness, created_at
  `;
  console.log("INSERT OK:", rows[0]);

  const back = await sql`SELECT id, answers FROM parent_child_profiles WHERE id = ${rows[0].id}`;
  console.log("ROUND-TRIP:", back[0]);

  await sql`DELETE FROM parent_child_profiles WHERE id = ${rows[0].id}`;
  console.log("CLEANUP OK");
} catch (err) {
  console.error("FAIL:", err);
  process.exit(1);
} finally {
  await sql.end();
}
