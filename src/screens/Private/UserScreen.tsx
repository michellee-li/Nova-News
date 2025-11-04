import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase"; // your existing client

export default function UserScreen() {
  const nav = useNavigation();
  const [open, setOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const canDelete = ack && confirm.trim().toUpperCase() === "DELETE" && !loading;

  const getAccessToken = async (): Promise<string | null> => {
    // Try normal session first
    const { data: s1, error: e1 } = await supabase.auth.getSession();
    if (!e1 && s1?.session?.access_token) return s1.session.access_token;

    // Try refreshing session (handles cold starts/expired tokens)
    const { data: s2, error: e2 } = await supabase.auth.refreshSession();
    if (!e2 && s2?.session?.access_token) return s2.session.access_token;

    // As a final check, ensure we actually have a user
    const { data: u, error: eu } = await supabase.auth.getUser();
    if (!eu && u?.user) {
      const { data: s3 } = await supabase.auth.getSession();
      return s3?.session?.access_token ?? null;
    }
    return null;
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    try {
      setLoading(true);

      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        Alert.alert("Error", "You must be logged in.");
        return;
      }

      const baseUrl = 'https://nova-news.onrender.com';
      if (!baseUrl) {
        setLoading(false);
        Alert.alert("Error", "API URL not configured (EXPO_PUBLIC_API_URL).");
        return;
      }

      const resp = await fetch(`${baseUrl}/api/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || "Delete failed");
      }

      // Sign out locally and go “home”
      await supabase.auth.signOut();
      setLoading(false);
      setOpen(false);
      Alert.alert("Account deleted", "Your account and data were permanently removed.");
      // @ts-ignore
      nav.navigate("NewsList");
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Error", e?.message?.slice(0, 200) || "Something went wrong.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F2EA" }}>
      {/* Top bar */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#1B1B1B" }}>User</Text>
        {/* ESCAPE (consistent UI) */}
        <TouchableOpacity
          onPress={() => {
            // @ts-ignore
            nav.navigate("NewsList");
            setTimeout(() => supabase.auth.signOut(), 3500);
          }}
          style={{ backgroundColor: "#FF6B6B", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>ESCAPE</Text>
        </TouchableOpacity>
      </View>

      {/* Card list */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, flex: 1 }}>
        <Section title="Manage Account">
          <Row label="Change Password" onPress={() => Alert.alert("Change Password", "Open reset-password flow")} />
          <Row label="Two-Factor Authentication" onPress={() => Alert.alert("2FA", "Coming soon")} />
        </Section>

        <Section title="Data & Privacy">
          <Row label="Export My Data" onPress={() => Alert.alert("Export", "We’ll email you a copy of your data")} />
          <View
            style={{
              backgroundColor: "white",
              padding: 16,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              borderTopWidth: 1,
              borderColor: "#EEE",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#b00020", marginBottom: 6 }}>
              Delete My Account
            </Text>
            <Text style={{ color: "#5F6368", marginBottom: 10 }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Text>
            <TouchableOpacity
              onPress={() => setOpen(true)}
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#FFE7E7",
                borderColor: "#FFB3B3",
                borderWidth: 1,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#B00020", fontWeight: "700" }}>Delete Account</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: "#5F6368", marginTop: 8 }}>
            Prefer the web? You can also delete from our website’s account page.
          </Text>
        </Section>

        <Section title="About">
          <Row label="Terms of Use" onPress={() => Alert.alert("Terms", "Open webview")} />
          <Row label="Privacy Policy" onPress={() => Alert.alert("Privacy", "Open webview")} />
          <Row label="Support" onPress={() => Alert.alert("Support", "Open support page")} />
        </Section>
      </View>

      {/* Confirm modal (keyboard-safe) */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0} // tweak if header overlaps
            >
              <View
                style={{
                  maxHeight: "85%",
                  backgroundColor: "white",
                  padding: 16,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                }}
              >
                <ScrollView
                  contentContainerStyle={{ paddingBottom: 20 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 6 }}>Delete account?</Text>
                  <Text style={{ color: "#5F6368" }}>
                    This permanently deletes your account, budgets, and saved resources.
                  </Text>

                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
                    <Switch value={ack} onValueChange={setAck} />
                    <Text style={{ marginLeft: 8 }}>I understand this action is permanent.</Text>
                  </View>

                  <Text style={{ fontSize: 12, color: "#5F6368", marginTop: 12 }}>
                    Type <Text style={{ fontFamily: "Courier", backgroundColor: "#F1F3F4" }}>DELETE</Text> to confirm
                  </Text>

                  <TextInput
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="DELETE"
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    blurOnSubmit
                    style={{
                      marginTop: 6,
                      borderWidth: 1,
                      borderColor: "#DDD",
                      borderRadius: 10,
                      padding: 10,
                      backgroundColor: "white",
                    }}
                  />

                  <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 14 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setOpen(false);
                        setConfirm("");
                        setAck(false);
                      }}
                      style={{ padding: 12 }}
                    >
                      <Text>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleDelete}
                      disabled={!canDelete}
                      style={{
                        marginLeft: 6,
                        backgroundColor: canDelete ? "#B00020" : "#E0E0E0",
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 10,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      {loading && <ActivityIndicator style={{ marginRight: 8 }} />}
                      <Text style={{ color: "white", fontWeight: "700" }}>
                        {loading ? "Deleting…" : "Delete"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ marginLeft: 16, marginBottom: 8, color: "#5F6368", fontSize: 12, fontWeight: "700" }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#EEE" }}>
        {children}
      </View>
    </View>
  );
}

function Row({ label, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: "white", padding: 16, borderTopWidth: 1, borderColor: "#EEE" }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}
