import { readFileSync } from "node:fs";
import { Pool } from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx scripts/apply-sql.ts <path-to-sql-file>");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const sql = readFileSync(file, "utf-8");
  await pool.query(sql);
  console.log(`Applied ${file}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
