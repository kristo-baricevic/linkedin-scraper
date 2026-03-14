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
  about: { marginBottom: 16, lineHeight: 1.4 },
  aboutTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6 },
  aboutText: { fontSize: 10, color: "#374151" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  item: { marginBottom: 8 },
  itemTitle: { fontWeight: "bold" },
  itemSub: { color: "#6b7280", marginTop: 2 },
  itemDates: { fontSize: 9, color: "#9ca3af", marginTop: 2 },
});

export default function ResumePDF({ profile }) {
  const { name, headline, location, about, profileImageBase64, experience, education } = profile || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View fixed style={styles.header}>
          <Text style={styles.headerName}>{name || "—"}</Text>
          <Text style={styles.headerHeadline} wrap>{headline || ""}</Text>
        </View>
        <View fixed style={styles.footer}>
          <Text fixed style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

        {profileImageBase64 && (
          <View style={styles.profileBlock}>
            <Image src={profileImageBase64} style={styles.profileImage} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{name || ""}</Text>
              {headline && <Text style={styles.headline}>{headline}</Text>}
              {location && <Text style={styles.location}>{location}</Text>}
            </View>
          </View>
        )}
        {!profileImageBase64 && (name || headline || location) && (
          <View style={styles.profileBlock}>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{name || ""}</Text>
              {headline && <Text style={styles.headline}>{headline}</Text>}
              {location && <Text style={styles.location}>{location}</Text>}
            </View>
          </View>
        )}

        {about && (
          <View style={styles.about}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutText}>{about}</Text>
          </View>
        )}

        {experience && experience.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((item, i) => (
              <View key={i} style={styles.item}>
                <Text style={styles.itemTitle}>{item.title || "—"}</Text>
                {item.company && <Text style={styles.itemSub}>{item.company}</Text>}
                {item.dates && <Text style={styles.itemDates}>{item.dates}</Text>}
              </View>
            ))}
          </View>
        )}

        {education && education.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((item, i) => (
              <View key={i} style={styles.item}>
                <Text style={styles.itemTitle}>{item.title || item.school || "—"}</Text>
                {item.company && <Text style={styles.itemSub}>{item.company}</Text>}
                {item.dates && <Text style={styles.itemDates}>{item.dates}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
