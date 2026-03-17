import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 52,
    paddingBottom: 44,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  headerName: { fontSize: 12, fontWeight: "bold" },
  headerHeadline: { fontSize: 9, color: "#6b7280", maxWidth: "70%" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  footerText: { fontSize: 8, color: "#9ca3af" },
  profileBlock: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    objectFit: "cover",
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  headline: { fontSize: 11, color: "#374151", marginBottom: 2 },
  location: { fontSize: 9, color: "#6b7280" },
  section: { marginBottom: 18, paddingBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  item: { marginBottom: 12, breakInside: "avoid" },
  itemTitle: { fontWeight: "bold" },
  itemSub: { color: "#6b7280", marginTop: 2 },
  itemDates: { fontSize: 9, color: "#9ca3af", marginTop: 2 },
  itemDescription: { fontSize: 9, color: "#374151", marginTop: 4, lineHeight: 1.2 },
});

export default function ResumePDF({ profile }) {
  const {
    name,
    avatar,
    position,
    current_company,
    city,
    country_code,
    education = [],
    experiences = [],
  } = profile || {};

  const headline = position || (current_company ? `at ${current_company}` : null);
  const location = [city, country_code].filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View fixed style={styles.header}>
          <Text style={styles.headerName}>{name || "—"}</Text>
          <Text style={styles.headerHeadline} wrap>
            {headline || ""}
          </Text>
        </View>
        <View fixed style={styles.footer}>
          <Text
            fixed
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>

        <View style={styles.profileBlock}>
          {avatar && (
            <Image src={avatar} style={styles.profileImage} />
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{name || ""}</Text>
            {headline && <Text style={styles.headline}>{headline}</Text>}
            {location && <Text style={styles.location}>{location}</Text>}
          </View>
        </View>

        {experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experiences.map((item, i) => (
              <View key={i} style={styles.item}>
                <Text style={styles.itemTitle}>{item.title || "—"}</Text>
                {item.company && (
                  <Text style={styles.itemSub}>{item.company}</Text>
                )}
                {item.dates && (
                  <Text style={styles.itemDates}>{item.dates}</Text>
                )}
                {item.description && (
                  <Text style={styles.itemDescription}>
                    {item.description
                      .split("\n")
                      .flatMap((line, j) =>
                        j === 0 ? [line.trim() || " "] : ["\n", line.trim() || " "]
                      )}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((item, i) => (
              <View key={i} style={styles.item}>
                <Text style={styles.itemTitle}>
                  {item.school || "—"}
                </Text>
                {item.degree && (
                  <Text style={styles.itemSub}>{item.degree}</Text>
                )}
                {item.dates && typeof item.dates === "string" && (
                  <Text style={styles.itemDates}>{item.dates}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
