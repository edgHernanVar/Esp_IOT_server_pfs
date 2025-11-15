import { Pool } from "pg";
import fs from "fs";
import path from "path";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
    const sqlPath = path.join(__dirname, "migrations", "001_init.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await pool.query(sql);
    console.log("✅ Esquema de base de datos cargado correctamente.");
}

export default pool;
