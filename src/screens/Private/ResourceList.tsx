// src/screens/Private/ResourceList.tsx
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import rawResources from "../../data/resources.json";

type Resource = {
  id: string;
  title: string;
  category: string;
  url: string;
  // optional fields in case you add later:
  description?: string;
  featured?: boolean;
  location?: string;
};

// Cast JSON → typed array
const resources = rawResources as Resource[];

// Soft palette to match the mockup
const PALETTE = {
  bg: "#FAF6EF",
  card: "#FFFFFF",
  text: "#1D2433",
  subtext: "#5C6370",
  chipLavender: "#CEC8EA",
  chipMint: "#D6E7E0",
  chipRose: "#EFD6CF",
  chipGold: "#EFE1B9",
  chipLilac: "#D9D3F1",
  chipLilacText: "#2E2A39",
  divider: "#EDE9E0",
  searchBg: "#F1ECE4",
  shadow: "rgba(0,0,0,0.06)",
};

// Category config to render the 6 rounded buttons
const CATEGORIES: {
  key: string;
  label: string;
  bg: string;
  icon:
    | { lib: "Feather"; name: React.ComponentProps<typeof Feather>["name"] }
    | {
        lib: "MCI";
        name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
      };
}[] = [
  { key: "Credit Repair", label: "Credit Repair", bg: PALETTE.chipLilac, icon: { lib: "Feather", name: "credit-card" } },
  { key: "Jobs", label: "Jobs", bg: PALETTE.chipLavender, icon: { lib: "Feather", name: "briefcase" } },
  { key: "Housing", label: "Housing", bg: PALETTE.chipMint, icon: { lib: "Feather", name: "home" } },
  { key: "Child Support", label: "Child Support", bg: PALETTE.chipRose, icon: { lib: "MCI", name: "baby-face-outline" } },
  { key: "Grants", label: "Grants", bg: PALETTE.chipGold, icon: { lib: "Feather", name: "file-text" } },
  { key: "Planners Map", label: "Planners Map", bg: PALETTE.chipLilac, icon: { lib: "Feather", name: "map-pin" } },
];

export default function ResourceList() {
  const [query, setQuery] = useState("");

  // “Featured”: prefer items flagged featured, otherwise take top by category variety
  const featured = useMemo<Resource[]>(() => {
    const flagged = resources.filter((r) => r.featured);
    if (flagged.length >= 3) return flagged.slice(0, 3);

    // otherwise pick 1 from 3 distinct categories if possible
    const byCat = new Map<string, Resource>();
    for (const r of resources) {
      if (!byCat.has(r.category)) byCat.set(r.category, r);
      if (byCat.size >= 3) break;
    }
    const picks = Array.from(byCat.values()).slice(0, 3);
    // If still <3, fill with first items
    while (picks.length < 3 && picks.length < resources.length) {
      const next = resources[picks.length];
      if (next) picks.push(next);
      else break;
    }
    return picks;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resources.slice(0, 12); // keep list tidy
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Resources</Text>
        {/* Quick exit could be wired to open a neutral site */}
        {/* <Pressable onPress={() => Linking.openURL("https://www.cnn.com")}>
          <Text style={styles.exitText}>Quick Exit</Text>
        </Pressable> */}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={18} color={PALETTE.subtext} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Find local or online support…"
          placeholderTextColor={PALETTE.subtext}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* Categories grid */}
      <Text style={styles.sectionLabel}>CATEGORIES</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((c) => {
          const Icon =
            c.icon.lib === "Feather" ? (
              <Feather name={c.icon.name as any} size={18} color={PALETTE.text} />
            ) : (
              <MaterialCommunityIcons
                name={c.icon.name as any}
                size={18}
                color={PALETTE.text}
              />
            );
          return (
            <Pressable
              key={c.key}
              style={[styles.chip, { backgroundColor: c.bg }]}
              onPress={() => {
                // In a future PR you can navigate:
                // navigation.navigate("ResourceCategory", { category: c.key })
                setQuery(c.label);
              }}
            >
              <View style={styles.chipRow}>
                {Icon}
                <Text style={styles.chipText}>{c.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Featured */}
      <Text style={[styles.sectionLabel, { marginTop: 12 }]}>FEATURED</Text>
      <View style={styles.cards}>
        {featured.map((r, idx) => (
          <Pressable
            key={r.id}
            onPress={() => Linking.openURL(r.url)}
            style={styles.card}
          >
            <View style={styles.cardIconWrap}>
              {/* Simple icon heuristic by category */}
              {iconForCategory(r.category)}
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {r.title}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {r.category}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Results (mini list) */}
      <View style={styles.listWrap}>
        {filtered.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => Linking.openURL(r.url)}
            style={styles.listItem}
          >
            <View style={styles.listIcon}>{iconForCategory(r.category, 16)}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle} numberOfLines={2}>
                {r.title}
              </Text>
              <Text style={styles.listSub}>{r.category}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={PALETTE.subtext} />
          </Pressable>
        ))}
      </View>

      {/* bottom spacing */}
      <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function iconForCategory(cat: string, size: number = 22) {
  const lc = cat.toLowerCase();
  if (lc.includes("credit"))
    return <Feather name="credit-card" size={size} color={PALETTE.text} />;
  if (lc.includes("job"))
    return <Feather name="briefcase" size={size} color={PALETTE.text} />;
  if (lc.includes("housing") || lc.includes("rent") || lc.includes("hud"))
    return <Feather name="home" size={size} color={PALETTE.text} />;
  if (lc.includes("child"))
    return (
      <MaterialCommunityIcons
        name="baby-face-outline"
        size={size}
        color={PALETTE.text}
      />
    );
  if (lc.includes("grant"))
    return <Feather name="file-text" size={size} color={PALETTE.text} />;
  if (lc.includes("planner") || lc.includes("map"))
    return <Feather name="map-pin" size={size} color={PALETTE.text} />;
  return <Feather name="star" size={size} color={PALETTE.text} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF6EF" // same background as before
  },
  content: { padding: 16, paddingBottom: 8 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1D2433", //PALETTE.text,
    letterSpacing: 0.3,
  },
  exitText: {
    color: PALETTE.subtext,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.searchBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PALETTE.text,
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: PALETTE.subtext,
    fontSize: 12,
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: "47%",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipText: {
    fontSize: 15,
    color: PALETTE.chipLilacText,
    fontWeight: "600",
  },
  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: PALETTE.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardIconWrap: { marginBottom: 8 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PALETTE.text,
    marginBottom: 4,
  },
  cardSub: { color: PALETTE.subtext, fontSize: 12, fontWeight: "600" },
  listWrap: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PALETTE.divider,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.divider,
  },
  listIcon: { width: 22, alignItems: "center" },
  listTitle: { color: PALETTE.text, fontSize: 16, fontWeight: "600" },
  listSub: { color: PALETTE.subtext, fontSize: 12, marginTop: 2 },
});
