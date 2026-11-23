import "server-only";
import { Document, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Letter } from "./letters";

// FairStep colours (see globals.css). Built-in PDF fonts keep files small and fast.
const INK = "#1c2826";
const MUTED = "#5b6b69";
const PRIMARY = "#0e5e5a";
const LINE = "#e3ded3";
const PANEL = "#f1f3f2";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: INK,
    lineHeight: 1.5,
  },
  letterhead: {
    textAlign: "center",
    color: MUTED,
    fontSize: 9.5,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    marginHorizontal: 140,
  },
  brand: { fontFamily: "Times-Bold", fontSize: 13, color: INK, marginBottom: 2 },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 28,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  meta: {
    flexDirection: "row",
    backgroundColor: PANEL,
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  metaCell: { flex: 1, paddingRight: 8 },
  metaLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  lead: { fontFamily: "Times-Bold", fontSize: 13.5, lineHeight: 1.4, marginBottom: 16 },
  heading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: PRIMARY,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: { marginBottom: 6 },
  bullet: { flexDirection: "row", marginBottom: 3, paddingLeft: 6 },
  bulletDot: { width: 12 },
  bulletText: { flex: 1 },
  signatures: { flexDirection: "row", marginTop: 40 },
  signature: {
    flex: 1,
    marginRight: 24,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: MUTED,
    fontSize: 9.5,
    color: MUTED,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    textAlign: "center",
    fontSize: 8.5,
    color: MUTED,
  },
  pageNumber: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: MUTED,
  },
});

export function LetterPdf({ letter }: { letter: Letter }) {
  return (
    <Document
      title={`${letter.title} · ${letter.reference}`}
      author={letter.businessName}
      creator="FairStep"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.letterhead}>
          <Text style={styles.brand}>{letter.businessName}</Text>
          <Text>Disciplinary record · {letter.reference}</Text>
        </View>

        <Text style={styles.title}>{letter.title}</Text>

        <View style={styles.meta}>
          <View style={[styles.metaCell, { flex: 2 }]}>
            <Text style={styles.metaLabel}>To</Text>
            <Text>{letter.to}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text>{letter.date}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Reference</Text>
            <Text>{letter.reference}</Text>
          </View>
        </View>

        <Text style={styles.lead}>{letter.lead}</Text>

        {letter.sections.map((section) => (
          <View key={section.heading} wrap={false}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.paragraphs?.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.bullets?.map((bullet) => (
              <View key={bullet} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.signatures} wrap={false}>
          {letter.signatures.map((line) => (
            <Text key={line} style={styles.signature}>
              {line}
            </Text>
          ))}
        </View>

        <Text style={styles.footer} fixed>
          {letter.footer}
        </Text>
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

export function renderLetter(letter: Letter): Promise<Buffer> {
  return renderToBuffer(<LetterPdf letter={letter} />);
}
