// === app/screens/ChatbotScreen.tsx ===
import { BASE_URL_ANDROID, BASE_URL_IOS } from '@env';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Message = { id: string; from: 'user' | 'bot'; text: string };

const CATEGORIES = [
  { key: 'credit', label: 'Credit Repair', emoji: '💳', tint: '#EAE6FF' },
  { key: 'jobs', label: 'Jobs', emoji: '💼', tint: '#EDEBFF' },
  { key: 'housing', label: 'Housing', emoji: '🏠', tint: '#EAF2EC' },
  { key: 'child', label: 'Child Support', emoji: '🧸', tint: '#F7EDEA' },
  { key: 'grants', label: 'Grants', emoji: '💡', tint: '#F7F1DE' },
  { key: 'map', label: 'Planners Map', emoji: '🗺️', tint: '#ECEBFF' },
];

const FEATURED = [
  { id: 'f1', title: '5 Steps to Rebuild Credit After a Crisis', icon: '✨' },
  { id: 'f2', title: 'Safe Housing Grants You May Qualify For', icon: '🏡' },
  { id: 'f3', title: 'Companies Hiring Returners in 2025', icon: '🧳' },
];

export default function ChatbotScreen() {
  //   // Sends a predefined question/topic when a category or featured card is tapped
  // const sendMessageFromCategory = async (topic: string) => {
  //   if (sending) return;
  //   const userMsg: Message = { id: String(Date.now()), from: 'user', text: topic };
  //   setMessages(prev => [userMsg, ...prev]);
  //   setSending(true);

  //   try {
  //     const res = await fetch(`${resolvedBase}/api/prompt`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ prompt: topic }),
  //     });
  //     const data: { response?: string } = await res.json();
  //     const botMsg: Message = {
  //       id: String(Date.now() + 1),
  //       from: 'bot',
  //       text: res.ok ? (data.response ?? 'Sorry, I didn’t get a response.') : `HTTP ${res.status}`,
  //     };
  //     setMessages(prev => [botMsg, ...prev]);
  //   } catch (err: any) {
  //     setMessages(prev => [
  //       { id: String(Date.now() + 1), from: 'bot', text: `Error: ${err.message}` },
  //       ...prev,
  //     ]);
  //   } finally {
  //     setSending(false);
  //   }
  // };

  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', from: 'bot', text: 'Hi, I’m Emily. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const BASE_URL_FALLBACK = 'https://nova-news.onrender.com';
  const resolvedBase = useMemo(
    () =>
      Platform.OS === 'ios'
        ? (BASE_URL_IOS || BASE_URL_FALLBACK)
        : (BASE_URL_ANDROID || BASE_URL_FALLBACK),
    []
  );

  // Map short labels to fuller, validated prompts
  const PROMPT_TEMPLATES: Record<string, string> = {
    'Credit Repair': 'I need step-by-step help rebuilding my credit after financial abuse. List beginner-friendly actions, secured card options, and how to dispute errors. Keep it simple and trauma-informed.',
    'Jobs': 'Please suggest job resources for someone restarting work after a crisis: returnship programs, remote-friendly roles, resume refresh tips, and places to apply right now.',
    'Housing': 'Share safe and affordable housing resources (emergency, transitional, vouchers) and how to apply. Include U.S. national hotlines and tips to stay discreet.',
    'Child Support': 'Explain how child support works, how to open a case, and where to get help with paperwork and legal aid. Keep the steps simple.',
    'Grants': 'List small grants, hardship funds, and nonprofit programs that help survivors cover essentials. Include eligibility basics and how to apply.',
    'Planners Map': 'Act like a planning coach. Help me build a 30-60-90 day plan for finances: income, expenses, debt triage, and credit rebuilding milestones.',
    '5 Steps to Rebuild Credit After a Crisis': 'Give me five clear, trauma-aware steps to rebuild credit after a crisis, with specific starter products and how to avoid predatory offers.',
    'Safe Housing Grants You May Qualify For': 'What housing grants or subsidies could I qualify for after leaving an unsafe situation? Provide U.S. programs and how to apply.',
    'Companies Hiring Returners in 2025': 'Share companies with returnships or career reentry programs in 2025, with links or search terms to find current postings.'
  };

  // Reusable sender that ensures a long-enough prompt and shows server errors
  const sendPrompt = async (fullPrompt: string) => {
    if (sending) return;
    const question = fullPrompt.trim();
    if (!question) return;

    const userMsg: Message = { id: String(Date.now()), from: 'user', text: question };
    setMessages(prev => [userMsg, ...prev]);
    setSending(true);

    try {
      const res = await fetch(`${resolvedBase}/api/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question })
      });

      let text = '';
      try { text = await res.text(); } catch {}
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      const botText = res.ok
        ? (data.response ?? 'Sorry, I didn’t get a response.')
        : `HTTP ${res.status}${data?.detail ? ` – ${data.detail}` : ''}`;

      setMessages(prev => [
        { id: String(Date.now() + 1), from: 'bot', text: botText },
        ...prev
      ]);
    } catch (err: any) {
      setMessages(prev => [
        { id: String(Date.now() + 1), from: 'bot', text: `Network error: ${err.message}` },
        ...prev
      ]);
    } finally {
      setSending(false);
    }
  };

  // When a chip/card is tapped, expand label to a full prompt
  const sendMessageFromCategory = (label: string) => {
    const full = PROMPT_TEMPLATES[label] ?? `Please help with: ${label}. Provide actionable steps and resources.`;
    sendPrompt(full);
  };


  const sendMessage = async () => {
    const question = input.trim();
    if (!question || sending) return;

    const userMsg: Message = { id: String(Date.now()), from: 'user', text: question };
    setMessages(prev => [userMsg, ...prev]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${resolvedBase}/api/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question }),
      });

      const data: { response?: string } = await res.json();
      const botMsg: Message = {
        id: String(Date.now() + 1),
        from: 'bot',
        text: res.ok ? (data.response ?? 'Sorry, I didn’t get a response.') : `HTTP ${res.status}`,
      };
      setMessages(prev => [botMsg, ...prev]);
    } catch (err: any) {
      setMessages(prev => [
        {
          id: String(Date.now() + 1),
          from: 'bot',
          text: `Sorry—couldn’t reach the server: ${err.message}`,
        },
        ...prev,
      ]);
    } finally {
      setSending(false);
    }
  };

  const Footer = () => (
    <View style={styles.footerBlock}>
      <Text style={styles.sectionHeader}>CATEGORIES</Text>
      <View style={styles.categoriesWrap}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.chip, { backgroundColor: c.tint }]}
            onPress={() => sendMessageFromCategory(c.label)}
          >
            <Text style={styles.chipText}>{c.emoji} {c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionHeader, { marginTop: 16 }]}>FEATURED</Text>
      {FEATURED.map(card => (
        <TouchableOpacity
          key={card.id}
          style={styles.card}
          onPress={() => sendMessageFromCategory(card.title)}
        >
          <Text style={styles.cardIcon}>{card.icon}</Text>
          <Text style={styles.cardTitle}>{card.title}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ height: 12 }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF7F0' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <FlatList
            inverted
            data={messages}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
            ListFooterComponent={<Footer />}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.from === 'bot' ? styles.bot : styles.user]}>
                <Text style={styles.bubbleText}>{item.text}</Text>
              </View>
            )}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask Emily…"
              value={input}
              onChangeText={setInput}
              editable={!sending}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={sending}
              style={[styles.sendBtn, sending && { opacity: 0.6 }]}
            >
              <Text style={styles.sendText}>{sending ? '...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  bubble: {
    marginVertical: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    maxWidth: '82%',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bot: { backgroundColor: '#EFEFEF', alignSelf: 'flex-start' },
  user: { backgroundColor: '#DDECFB', alignSelf: 'flex-end' },
  bubbleText: { fontSize: 16, lineHeight: 22 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  input: { flex: 1, paddingHorizontal: 12, height: 40, fontSize: 16 },
  sendBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: '#2E6FE7',
  },
  sendText: { color: '#FFF', fontWeight: '600' },

  footerBlock: { marginTop: 8 },
  sectionHeader: { fontSize: 12, letterSpacing: 1, color: '#7A7A7A', marginHorizontal: 2, marginBottom: 8 },
  categoriesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  chipText: { fontSize: 14, fontWeight: '500' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardIcon: { fontSize: 18 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
});
