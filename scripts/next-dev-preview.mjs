import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const nextArgs = ["dev"];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--host") {
    nextArgs.push("--hostname");
    if (args[index + 1]) {
      nextArgs.push(args[index + 1]);
      index += 1;
    }
    continue;
  }

  if (arg.startsWith("--host=")) {
    nextArgs.push(`--hostname=${arg.slice("--host=".length)}`);
    continue;
  }

  if (arg === "--strictPort") {
    continue;
  }

  nextArgs.push(arg);
}

const child = spawn("next", nextArgs, {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 0);
});
