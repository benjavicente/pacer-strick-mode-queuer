import { StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { useQueuer } from "@tanstack/react-pacer/queuer";
import "./main.css";

type Run = {
  strict: boolean;
  receipts: Array<string>;
};

function SeededQueue({ record }: { record: (item: string) => void }) {
  useQueuer(record, {
    initialItems: ["job-1"],
    started: true,
    wait: 0,
  });
  return null;
}

function runComparison(): Array<Run> {
  return [false, true].map((strict) => {
    // Record outside React: discarded renders cannot undo external work.
    // No network request is made; each receipt represents one callback call.
    const receipts: Array<string> = [];
    const record = (item: string) => receipts.push(item);
    const root = createRoot(document.createElement("div"));
    const queue = <SeededQueue record={record} />;
    try {
      // Complete each mount before collecting its synchronous callbacks.
      // This runs outside a render/effect and does not replay the mount itself.
      flushSync(() =>
        root.render(strict ? <StrictMode>{queue}</StrictMode> : queue),
      );
    } finally {
      flushSync(() => root.unmount());
    }
    return { strict, receipts };
  });
}

function StrictModeDemo({ initialRuns }: { initialRuns: Array<Run> }) {
  const [runs, setRuns] = useState(initialRuns);
  return (
    <main className="strict-mode-demo">
      <p className="eyebrow">TanStack Pacer · React</p>
      <h1>
        {import.meta.env.DEV
          ? "One job. Two callback calls."
          : "One job. One callback call."}
      </h1>
      <p>
        Both queues receive the same single initial item. Compare the callback
        receipts when mounting with and without React StrictMode.
      </p>
      <p className="environment">
        {import.meta.env.MODE === "reproduction"
          ? "Static reproduction using React's development build: StrictMode replays the state initializer."
          : import.meta.env.DEV
            ? "Development build: StrictMode replays the state initializer."
            : "Production build: StrictMode does not replay the initializer; both counts should be 1."}
      </p>
      <div className="comparison">
        {runs.map(({ strict, receipts }) => (
          <section
            key={String(strict)}
            aria-label={strict ? "With StrictMode" : "Without StrictMode"}
          >
            <h2>{strict ? "With StrictMode" : "Without StrictMode"}</h2>
            <p className="count" aria-label="Callback count">
              {receipts.length}
            </p>
            <p>callback calls for one initial item</p>
            <ol aria-label="Callback receipts">
              {receipts.map((item, index) => (
                <li key={index}>Processed {item}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <button onClick={() => setRuns(runComparison())}>
        Run fresh mounts again
      </button>
      <h2>The queue being mounted</h2>
      <pre>
        <code>{`function SeededQueue({ record }) {
  useQueuer(record, {
    initialItems: ['job-1'],
    started: true,
    wait: 0,
  })
  return null
}

// StrictMode case:
root.render(<StrictMode><SeededQueue record={record} /></StrictMode>)`}</code>
      </pre>
      <h2>Why the duplicate happens</h2>
      <p>
        useQueuer constructs its core queue in a useState initializer. The core
        constructor processes initialItems immediately when started is true.
        React invokes that initializer twice in development StrictMode and keeps
        one instance. Both constructors have already called record, so
        discarding one instance cannot undo its receipt.
      </p>
      <p>
        The runner mounts each queue once in a separate root, records callback
        calls in a plain array, and unmounts it. The display reads the receipts
        after the mount; the queue callback never updates React state.
      </p>
    </main>
  );
}

export function mountStrictModeDemo(element: HTMLElement) {
  // Run before mounting the display, so its lifecycle cannot replay the test.
  const initialRuns = runComparison();
  createRoot(element).render(<StrictModeDemo initialRuns={initialRuns} />);
}

mountStrictModeDemo(document.getElementById("root")!);
