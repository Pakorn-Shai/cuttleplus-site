import { spawnSync } from "node:child_process";
import { configureTestDatabase } from "../helpers/test-database";

export default function globalSetup() {
  const databaseUrl = configureTestDatabase();
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Could not migrate the isolated test database.\n${result.stderr || result.stdout}`);
  }
}

