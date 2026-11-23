import "server-only";
import { Document, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Bundle } from "./bundle";

const INK = "#1c2826";
const MUTED = "#5b6b69";
const PRIMARY = "#0e5e5a";
const LINE = "#e3ded3";
const PANEL = "#f1f3f2";

const s = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 52,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    lineHeight: 1.45,
  },
  coverPage: { padding: 72, fontFamily: "Helvetica", color: INK, justifyContent: "center" },
  brand: { fontFamily: "Times-Bold", fontSize: 14, color: PRIMARY, marginBottom: 48 },
  coverTitle: { fontFamily: "Times-Bold", fontSize: 30, marginBottom: 8 },
  coverRef: { fontSize: 16, color: PRIMARY, marginBottom: 32 },
  coverLine: { fontSize: 12, marginBottom: 8 },
  coverMeta: { marginTop: 40, fontSize: 9.5, color: MUTED },
  h2: { fontFamily: "Times-Bold", fontSize: 16, marginBottom: 10, marginTop: 8 },
  h3: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: PRIMARY,
    marginTop: 12,
    marginBottom: 4,
  },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 5 },
  headRow: { flexDirection: "row", backgroundColor: PANEL, paddingVertical: 5 },
  cell: { paddingHorizontal: 6 },
  label: { color: MUTED },
  item: { flexDirection: "row", marginBottom: 4 },
  itemLabel: { width: 120, color: MUTED },
  itemValue: { flex: 1 },
  bullet: { marginBottom: 3 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 52,
    right: 52,
    fontSize: 8,
    color: MUTED,
    textAlign: "center",
  },
});

function Footer({ text }: { text: string }) {
  return (
    <Text
      style={s.footer}
      fixed
      render={({ pageNumber, totalPages }) => `${text}  ·  Page ${pageNumber} of ${totalPages}`}
    />
  );
}

export function BundlePdf({ bundle }: { bundle: Bundle }) {
  return (
    <Document title={`Case record ${bundle.cover.reference}`} creator="FairStep">
      <Page size="A4" style={s.coverPage}>
        <Text style={s.brand}>FairStep</Text>
        <Text style={s.coverTitle}>{bundle.cover.title}</Text>
        <Text style={s.coverRef}>{bundle.cover.reference}</Text>
        {bundle.cover.lines.map((line) => (
          <Text key={line} style={s.coverLine}>
            {line}
          </Text>
        ))}
        <Text style={s.coverMeta}>{bundle.cover.generated}</Text>
        <Text style={s.coverMeta}>
          Contents: 1. Step checklist · 2. Case record · 3. Timeline · 4. Comments · 5. Evidence and
          documents
        </Text>
        <Footer text={bundle.footer} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>1. Step checklist</Text>
        <View style={s.headRow}>
          <Text style={[s.cell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>Step</Text>
          <Text style={[s.cell, { flex: 1, fontFamily: "Helvetica-Bold" }]}>Status</Text>
          <Text style={[s.cell, { flex: 1, fontFamily: "Helvetica-Bold" }]}>Date</Text>
        </View>
        {bundle.checklist.map((item) => (
          <View key={item.step} style={s.row} wrap={false}>
            <Text style={[s.cell, { flex: 2 }]}>{item.step}</Text>
            <Text style={[s.cell, { flex: 1 }]}>{item.status}</Text>
            <Text style={[s.cell, { flex: 1 }]}>{item.date || "–"}</Text>
          </View>
        ))}

        <Text style={[s.h2, { marginTop: 24 }]}>2. Case record</Text>
        {bundle.record.map((section) => (
          <View key={section.heading}>
            <Text style={s.h3}>{section.heading}</Text>
            {section.items.map(([label, value]) => (
              <View key={label} style={s.item} wrap={false}>
                <Text style={s.itemLabel}>{label}</Text>
                <Text style={s.itemValue}>{value}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={[s.h2, { marginTop: 24 }]} minPresenceAhead={80}>
          3. Timeline
        </Text>
        <View style={s.headRow}>
          <Text style={[s.cell, { width: 140, fontFamily: "Helvetica-Bold" }]}>When (SAST)</Text>
          <Text style={[s.cell, { width: 150, fontFamily: "Helvetica-Bold" }]}>Who</Text>
          <Text style={[s.cell, { flex: 1, fontFamily: "Helvetica-Bold" }]}>What</Text>
        </View>
        {bundle.timeline.map((entry, i) => (
          <View key={i} style={s.row} wrap={false}>
            <Text style={[s.cell, { width: 140 }]}>{entry.when}</Text>
            <Text style={[s.cell, { width: 150 }]}>{entry.who}</Text>
            <Text style={[s.cell, { flex: 1 }]}>{entry.what}</Text>
          </View>
        ))}

        <Text style={[s.h2, { marginTop: 24 }]} minPresenceAhead={60}>
          4. Comments
        </Text>
        {bundle.comments.length ? (
          bundle.comments.map((comment, i) => (
            <View key={i} style={{ marginBottom: 8 }} wrap={false}>
              <Text style={s.label}>
                {comment.who} · {comment.when}
              </Text>
              <Text>{comment.body}</Text>
            </View>
          ))
        ) : (
          <Text style={s.label}>No comments.</Text>
        )}

        <Text style={[s.h2, { marginTop: 24 }]} minPresenceAhead={60}>
          5. Evidence and documents
        </Text>
        <Text style={s.h3}>Evidence (held in FairStep’s private storage)</Text>
        {bundle.evidence.length ? (
          bundle.evidence.map((line) => (
            <Text key={line} style={s.bullet}>
              • {line}
            </Text>
          ))
        ) : (
          <Text style={s.label}>No evidence files.</Text>
        )}
        <Text style={s.h3}>Letters generated</Text>
        {bundle.documents.length ? (
          bundle.documents.map((line) => (
            <Text key={line} style={s.bullet}>
              • {line}
            </Text>
          ))
        ) : (
          <Text style={s.label}>No letters generated.</Text>
        )}
        <Footer text={bundle.footer} />
      </Page>
    </Document>
  );
}

export function renderBundle(bundle: Bundle): Promise<Buffer> {
  return renderToBuffer(<BundlePdf bundle={bundle} />);
}
