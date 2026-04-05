import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return result;
}

const migrateResult = run("npx", ["prisma", "migrate", "deploy"]);

if (migrateResult.status === 0) {
  process.exit(0);
}

const stderr = `${migrateResult.stderr ?? ""}`;
const stdout = `${migrateResult.stdout ?? ""}`;
const combinedOutput = `${stdout}\n${stderr}`;

if (combinedOutput.includes("P3005")) {
  console.warn(
    "Prisma migrate deploy hit P3005 because this database was initialized before migration history existed. Falling back to prisma db push for compatibility.",
  );

  const pushResult = run("npx", ["prisma", "db", "push"]);

  process.exit(pushResult.status ?? 1);
}

process.exit(migrateResult.status ?? 1);
