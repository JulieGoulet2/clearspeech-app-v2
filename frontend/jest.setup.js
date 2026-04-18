/**
 * jest.setup.js — Setup file that runs before every Jest test.
 *
 * Imports jest-dom so tests can use matchers like toBeInTheDocument().
 * Also sets the NEXT_PUBLIC_API_URL environment variable so the app
 * does not throw a "missing env" error during tests.
 */
import "@testing-library/jest-dom";

process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
