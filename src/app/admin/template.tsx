/** Re-mounts on every navigation, so each page fades in softly. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 animate-page-in">{children}</div>;
}
