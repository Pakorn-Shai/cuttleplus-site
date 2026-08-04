import { config } from "dotenv";

export function configureTestDatabase() {
  config({ path: ".env.test", override: false, quiet: true });
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error("TEST_DATABASE_URL is required. Copy .env.test.example to .env.test and point it to an isolated PostgreSQL database.");
  }

  let parsed: URL;
  try {
    parsed = new URL(testUrl);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  const databaseName = parsed.pathname.replace(/^\//u, "").toLowerCase();
  if (!databaseName.includes("test")) {
    throw new Error(`Refusing to use TEST_DATABASE_URL database "${databaseName}": its name must contain "test".`);
  }
  if (process.env.DATABASE_URL === testUrl && process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run database tests against the production DATABASE_URL.");
  }

  process.env.DATABASE_URL = testUrl;
  return testUrl;
}
