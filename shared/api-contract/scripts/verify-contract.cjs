#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "openapi", "v1", "openapi.json");
const yamlPath = path.join(root, "openapi", "v1", "openapi.yaml");
const mirrorPath = path.resolve(root, "..", "..", "share_api.json");
const frontendMirrorPath = path.resolve(root, "..", "..", "frontend-booking", "config", "share_api.json");

if (!fs.existsSync(jsonPath)) {
  console.error(`[contract] Missing file: ${jsonPath}`);
  process.exit(1);
}

if (!fs.existsSync(yamlPath)) {
  console.error(`[contract] Missing file: ${yamlPath}`);
  process.exit(1);
}

let spec;
try {
  spec = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
} catch (error) {
  console.error("[contract] Invalid openapi.json:", error.message);
  process.exit(1);
}

const pathCount = Object.keys(spec.paths || {}).length;
if (pathCount === 0) {
  console.error("[contract] openapi.json contains zero paths.");
  process.exit(1);
}

const yamlMirror = JSON.parse(fs.readFileSync(yamlPath, "utf8"));
if (JSON.stringify(yamlMirror) !== JSON.stringify(spec)) {
  console.error("[contract] openapi.yaml is not synchronized with authoritative openapi.json.");
  process.exit(1);
}

const mirror = JSON.parse(fs.readFileSync(mirrorPath, "utf8"));
const statuses = new Set(["implemented", "planned"]);
const operations = new Map();
for (const [contractPath, pathItem] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
    if (!statuses.has(operation["x-implementation-status"])) {
      console.error(`[contract] Missing implementation status: ${method.toUpperCase()} ${contractPath}`);
      process.exit(1);
    }
    operations.set(`${method.toUpperCase()} ${contractPath}`, operation["x-implementation-status"]);
  }
}

const mirrorOperations = new Map();
for (const endpoint of mirror.endpoints) {
  if (!statuses.has(endpoint.implementation_status)) {
    console.error(`[contract] Mirror endpoint missing implementation_status: ${endpoint.method} ${endpoint.path}`);
    process.exit(1);
  }
  const key = `${endpoint.method.toUpperCase()} ${endpoint.path}`;
  if (mirrorOperations.has(key)) {
    console.error(`[contract] Duplicate mirror endpoint: ${key}`);
    process.exit(1);
  }
  mirrorOperations.set(key, endpoint.implementation_status);
}

for (const [key, status] of operations) {
  if (mirrorOperations.get(key) !== status) {
    console.error(`[contract] Mirror mismatch: ${key}; expected ${status}, got ${mirrorOperations.get(key) ?? "missing"}`);
    process.exit(1);
  }
}

for (const key of mirrorOperations.keys()) {
  if (!operations.has(key)) {
    console.error(`[contract] Mirror contains unknown endpoint: ${key}`);
    process.exit(1);
  }
}

const frontendMirror = JSON.parse(fs.readFileSync(frontendMirrorPath, "utf8"));
if (JSON.stringify(frontendMirror) !== JSON.stringify(mirror)) {
  console.error("[contract] frontend-booking/config/share_api.json is not synchronized with root share_api.json.");
  process.exit(1);
}

console.log(`[contract] OK: ${pathCount} paths verified; JSON/YAML and both status mirrors synchronized.`);
