import { StyleSheet } from "@react-pdf/renderer";

const BRAND = "#FF6500";
const BRAND_DARK = "#C2410C";
// const BRAND_SOFT = "#FFF4EC";
const INK = "#1a1a1a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";

export const pdfStyles = StyleSheet.create({
  /* ---------- Pages ---------- */
  page: {
    paddingTop: 48,
    paddingBottom: 72,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "IRANSans",
    color: INK,
    backgroundColor: "#ffffff",
  },
  coverPage: {
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: "IRANSans",
    backgroundColor: "#ffffff",
    color: INK,
  },

  /* ---------- Background logo (used on every page) ---------- */
  bgLogo: {
    position: "absolute",
    width: 380,
    height: 380,
    top: "32%",
    left: "50%",
    marginLeft: -190, // center horizontally
    opacity: 0.05,
  },
  coverBgLogo: {
    position: "absolute",
    width: 460,
    height: 460,
    top: "26%",
    left: "50%",
    marginLeft: -230,
    opacity: 0.06,
  },

  /* ---------- Cover ---------- */
  coverTopRule: {
    height: 3,
    width: 64,
    backgroundColor: BRAND,
    marginBottom: 20,
    alignSelf: "flex-end",
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 20,
    alignSelf: "flex-end",
  },
  brand: {
    fontSize: 34,
    fontFamily: "IRANSans",
    color: BRAND,
    textAlign: "right",
    letterSpacing: 0.5,
  },
  brandEn: {
    fontSize: 11,
    color: MUTED,
    textAlign: "right",
    letterSpacing: 3,
    marginBottom: 36,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontSize: 20,
    fontFamily: "IRANSans",
    color: INK,
    marginBottom: 16,
    lineHeight: 1.5,
    textAlign: "right",
  },
  coverDivider: {
    height: 1,
    backgroundColor: LINE,
    marginVertical: 18,
  },
  coverMeta: {
    fontSize: 10,
    color: "#44403c",
    marginBottom: 6,
    lineHeight: 1.7,
    textAlign: "right",
  },
  coverMetaLabel: {
    color: MUTED,
  },
  coverBadge: {
    marginTop: 26,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: BRAND,
    color: "#ffffff",
    fontSize: 9,
    letterSpacing: 0.5,
    alignSelf: "flex-end",
    borderRadius: 2,
  },
  coverFooter: {
    position: "absolute",
    bottom: 40,
    left: 48,
    right: 48,
  },
  coverFooterText: {
    fontSize: 8,
    color: MUTED,
    textAlign: "right",
    fontFamily: "IRANSans",
    letterSpacing: 0.3,
  },

  /* ---------- Section headings ---------- */
  sectionTitle: {
    fontSize: 14,
    fontFamily: "IRANSans",
    marginBottom: 14,
    color: BRAND_DARK,
    textAlign: "right",
    borderBottomWidth: 1,
    borderBottomColor: BRAND,
    paddingBottom: 8,
  },

  /* ---------- Day blocks ---------- */
  dayBlock: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: LINE,
    borderRightWidth: 3,
    borderRightColor: BRAND,
    borderRadius: 4,
  },
  dayHeader: {
    fontSize: 11,
    fontFamily: "IRANSans",
    marginBottom: 4,
    color: INK,
    textAlign: "right",
  },
  dayMeta: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 8,
    textAlign: "right",
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  exerciseName: {
    fontSize: 10,
    fontFamily: "IRANSans",
    textAlign: "right",
    flex: 1,
    color: INK,
  },
  exerciseDetail: {
    fontSize: 9,
    color: BRAND_DARK,
    width: 110,
    textAlign: "left",
  },

  /* ---------- Meal rows ---------- */
  mealRow: {
    flexDirection: "row-reverse",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  mealType: {
    fontSize: 9,
    fontFamily: "IRANSans",
    width: 62,
    color: BRAND,
    textAlign: "right",
  },
  mealTitle: {
    fontSize: 10,
    fontFamily: "IRANSans",
    flex: 1,
    textAlign: "right",
    color: INK,
  },
  mealCal: {
    fontSize: 9,
    color: MUTED,
    width: 62,
    textAlign: "left",
  },

  restDay: {
    fontSize: 10,
    color: MUTED,
    textAlign: "right",
    fontStyle: "italic",
  },

  /* ---------- Footer ---------- */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  footerText: {
    fontSize: 8,
    fontFamily: "IRANSans",
    color: MUTED,
    textAlign: "right",
  },
  disclaimer: {
    fontSize: 7,
    fontFamily: "IRANSans",
    color: "#a8a29e",
    marginTop: 4,
    lineHeight: 1.5,
    textAlign: "right",
  },

  emptyNote: {
    fontSize: 10,
    fontFamily: "IRANSans",
    color: MUTED,
    marginTop: 8,
    textAlign: "right",
  },
});
