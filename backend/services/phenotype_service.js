import { existsSync } from "fs";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, "..");
const projectDir = path.resolve(backendDir, "..");
const defaultPython = existsSync(path.join(projectDir, ".venv", "Scripts", "python.exe"))
  ? path.join(projectDir, ".venv", "Scripts", "python.exe")
  : "python";
const pythonPath = process.env.PYTHON_PATH || defaultPython;
const predictScript = path.join(backendDir, "inference", "predict_traits.py");

export function predictPhenotypeFromSnp(profile = {}, signal) {
  return new Promise((resolve, reject) => {
    const jsonInput = JSON.stringify(profile);
    const child = spawn(pythonPath, [predictScript, "--profile-json", jsonInput], { signal });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`predict_traits.py failed with code ${code}: ${stderr}`));
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse predict_traits output: ${err.message}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}
