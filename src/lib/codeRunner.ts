export interface RunResult {
  output: string;
  error: string | null;
  executionTime: number;
}

const TIMEOUT_MS = 5000;

export async function runJavaScript(code: string): Promise<RunResult> {
  const start = performance.now();

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.sandbox.add("allow-scripts");
    document.body.appendChild(iframe);

    const logs: string[] = [];
    let error: string | null = null;
    let resolved = false;

    const cleanup = () => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
      window.removeEventListener("message", handleMessage);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;

      const { type, data } = event.data || {};
      if (type === "log") {
        logs.push(data);
      } else if (type === "error") {
        error = data;
      } else if (type === "done") {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({
            output: logs.join("\n"),
            error,
            executionTime: performance.now() - start,
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Timeout handler
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({
          output: logs.join("\n"),
          error: "Execution timed out (5 second limit)",
          executionTime: TIMEOUT_MS,
        });
      }
    }, TIMEOUT_MS);

    const wrappedCode = `
      const logs = [];
      const originalConsole = { log: console.log, error: console.error, warn: console.warn };

      console.log = (...args) => {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
        parent.postMessage({ type: 'log', data: msg }, '*');
      };
      console.error = console.log;
      console.warn = console.log;

      try {
        ${code}
      } catch (e) {
        parent.postMessage({ type: 'error', data: e.message || String(e) }, '*');
      }

      parent.postMessage({ type: 'done' }, '*');
    `;

    iframe.srcdoc = `<!DOCTYPE html><html><head><script>${wrappedCode}<\/script></head><body></body></html>`;
  });
}

let pyodideInstance: unknown = null;
let pyodideLoading: Promise<unknown> | null = null;

async function loadPyodide(): Promise<unknown> {
  if (pyodideInstance) return pyodideInstance;

  if (pyodideLoading) return pyodideLoading;

  pyodideLoading = (async () => {
    // Dynamically load Pyodide from CDN
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";

    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Pyodide"));
      document.head.appendChild(script);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pyodide = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
    });

    pyodideInstance = pyodide;
    return pyodide;
  })();

  return pyodideLoading;
}

export async function runPython(code: string): Promise<RunResult> {
  const start = performance.now();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pyodide = await loadPyodide() as any;

    // Capture stdout
    pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
    `);

    let error: string | null = null;

    try {
      pyodide.runPython(code);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const stdout = pyodide.runPython("sys.stdout.getvalue()") as string;
    const stderr = pyodide.runPython("sys.stderr.getvalue()") as string;

    // Reset stdout/stderr
    pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
    `);

    return {
      output: stdout + (stderr ? `\n${stderr}` : ""),
      error,
      executionTime: performance.now() - start,
    };
  } catch (e) {
    return {
      output: "",
      error: e instanceof Error ? e.message : String(e),
      executionTime: performance.now() - start,
    };
  }
}

export function isPyodideLoaded(): boolean {
  return pyodideInstance !== null;
}

export type SupportedRunLanguage = "javascript" | "python";

export function canRunLanguage(language: string): language is SupportedRunLanguage {
  return language === "javascript" || language === "python";
}

export async function runCode(code: string, language: SupportedRunLanguage): Promise<RunResult> {
  if (language === "javascript") {
    return runJavaScript(code);
  } else if (language === "python") {
    return runPython(code);
  }

  return {
    output: "",
    error: `Language "${language}" is not supported for in-browser execution`,
    executionTime: 0,
  };
}
