import { vi } from "vitest";
import { configureTestDatabase } from "../helpers/test-database";

configureTestDatabase();
vi.mock("server-only", () => ({}));

