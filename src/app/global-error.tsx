"use client";

/**
 * Last resort if the root layout itself fails. It replaces the whole page,
 * so it brings its own <html> and plain styles.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en-ZA">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#f7f5f0",
          color: "#1c2826",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          padding: 16,
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 24 }}>FairStep is having trouble</h1>
          <p>Your records are safe. Please try again in a moment.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 16,
              minHeight: 44,
              padding: "0 20px",
              borderRadius: 8,
              border: 0,
              background: "#0e5e5a",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
