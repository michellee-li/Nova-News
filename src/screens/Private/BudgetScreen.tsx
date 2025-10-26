// src/screens/BudgetScreen.tsx
import { BASE_URL_ANDROID, BASE_URL_IOS } from '@env';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type EntryType = 'Income' | 'Expense';
type Entry = { id: string; type: EntryType; amount: string; category?: string };

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','PR','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'
];

// Professional, neutral palette
const PALETTE = {
  bg: '#F7F7F8',
  card: '#FFFFFF',
  text: '#0F172A',
  sub: '#64748B',
  line: '#E5E7EB',
  positive: '#16A34A',
  negative: '#DC2626',
  accent: '#2563EB',
  chip: '#F1F5F9',
  shadow: 'rgba(15, 23, 42, 0.06)',
};

export default function BudgetScreen() {
  const [email, setEmail] = useState<string>('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entryType, setEntryType] = useState<EntryType>('Income');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryCategory, setEntryCategory] = useState<string>('');
  const [usState, setUsState] = useState<string>('TX');
  const [goal, setGoal] = useState<string>('');
  const [plan, setPlan] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const BASE_URL_FALLBACK = 'https://nova-news.onrender.com';
  const BASE_URL =
    Platform.OS === 'ios'
      ? (BASE_URL_IOS || BASE_URL_FALLBACK)
      : (BASE_URL_ANDROID || BASE_URL_FALLBACK);

  useEffect(() => {
    (async () => {
      try {
        const storedEmail = await SecureStore.getItemAsync('USER_EMAIL');
        if (!storedEmail) {
          Alert.alert('Not logged in', 'Please log in to load your saved budget plan.');
          return;
        }
        setEmail(storedEmail);
        await fetchSavedPlan(storedEmail);
      } catch (e) {
        console.log('[BudgetScreen] load email error', e);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const inc = entries.reduce((s, e) => s + (e.type === 'Income' ? Number(e.amount || 0) : 0), 0);
    const exp = entries.reduce((s, e) => s + (e.type === 'Expense' ? Number(e.amount || 0) : 0), 0);
    return { inc, exp, net: inc - exp };
  }, [entries]);

  const addEntry = () => {
    const v = Number(entryAmount);
    if (!entryAmount || isNaN(v) || v <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive number.');
      return;
    }
    const newEntry: Entry = {
      id: String(Date.now()),
      type: entryType,
      amount: entryAmount,
      category: (entryCategory || '').trim() || (entryType === 'Income' ? 'Income' : 'Expense'),
    };
    setEntries(prev => [newEntry, ...prev]);
    setEntryAmount('');
    setEntryCategory('');
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const fetchSavedPlan = async (targetEmail?: string) => {
    try {
      setBusy(true);
      const e = targetEmail || email;
      if (!e) return;
      const url = `${BASE_URL}/api/budget/plan?email=${encodeURIComponent(e)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data?.exists && data.data) {
        setUsState(data.data.us_state || 'TX');
        setGoal(data.data.goal || '');
        if (Array.isArray(data.data.entries)) {
          setEntries(
            data.data.entries.map((x: any, idx: number) => ({
              id: String(idx + 1),
              type: x.type,
              amount: String(x.amount),
              category: x.category || (x.type === 'Income' ? 'Income' : 'Expense'),
            }))
          );
        } else {
          setEntries([]);
        }
        setPlan(data.data.plan || '');
      } else {
        setPlan('');
        setEntries([]);
      }
    } catch (err: any) {
      console.log('[BudgetScreen] fetchSavedPlan error', err?.message || err);
    } finally {
      setBusy(false);
    }
  };

  const submitPlan = async () => {
    try {
      if (!email) {
        Alert.alert('Not logged in', 'Email not found in secure storage.');
        return;
      }
      if (entries.length === 0) {
        Alert.alert('Missing data', 'Add at least one income or expense.');
        return;
      }
      setBusy(true);
      const payload = {
        email,
        us_state: usState,
        goal,
        entries: entries.map(e => ({
          type: e.type,
          amount: Number(e.amount),
          category: (e.category || (e.type === 'Income' ? 'Income' : 'Expense')).trim()
          })),
      };
      const res = await fetch(`${BASE_URL}/api/budget/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data?.detail === 'string' ? data.detail : JSON.stringify(data?.detail ?? data));
      }
      setPlan(data?.data?.plan || '');
      Alert.alert('Saved', 'Your plan has been generated and saved.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding' })}>
        <ScrollView contentContainerStyle={styles.inner}>
          {/* Title safely below notch/clock */}
          <View style={styles.headerRow}>
            <Text style={styles.h1}>Budget Planner</Text>

            <View style={styles.kpisRow}>
              <View style={styles.kpiChip}>
                <Feather name="arrow-down-circle" size={14} color={PALETTE.text} />
                <Text style={styles.kpiText}>Income ${totals.inc.toFixed(0)}</Text>
              </View>
              <View style={styles.kpiChip}>
                <Feather name="arrow-up-circle" size={14} color={PALETTE.text} />
                <Text style={styles.kpiText}>Expense ${totals.exp.toFixed(0)}</Text>
              </View>
              <View style={styles.kpiChip}>
                <Feather name="activity" size={14} color={PALETTE.text} />
                <Text style={styles.kpiText}>Net ${totals.net.toFixed(0)}</Text>
              </View>
            </View>
          </View>

          {/* State & Goal */}
          <View style={styles.card}>
            <Text style={styles.label}>US State</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={usState} onValueChange={setUsState}>
                {US_STATES.map(s => <Picker.Item key={s} label={s} value={s} />)}
              </Picker>
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>Goal (optional)</Text>
            <TextInput
              style={styles.goal}
              placeholder="e.g., Build a $300 emergency fund; reduce monthly expenses by 10%"
              value={goal}
              onChangeText={setGoal}
              multiline
            />
          </View>

          {/* Add Entry */}
          <View style={styles.card}>
            <Text style={styles.h2}>Add Income / Expense</Text>

            {/* Segmented Control */}
            <View style={styles.segmentRow}>
              <Pressable
                onPress={() => setEntryType('Income')}
                style={[
                  styles.segmentBtn,
                  entryType === 'Income' && styles.segmentBtnActive
                ]}
              >
                <Feather name="arrow-down-circle" size={16} color={entryType === 'Income' ? PALETTE.accent : PALETTE.text} />
                <Text style={[styles.segmentText, entryType === 'Income' && { color: PALETTE.accent }]}>Income</Text>
              </Pressable>
              <Pressable
                onPress={() => setEntryType('Expense')}
                style={[
                  styles.segmentBtn,
                  entryType === 'Expense' && styles.segmentBtnActive
                ]}
              >
                <Feather name="arrow-up-circle" size={16} color={entryType === 'Expense' ? PALETTE.accent : PALETTE.text} />
                <Text style={[styles.segmentText, entryType === 'Expense' && { color: PALETTE.accent }]}>Expense</Text>
              </Pressable>
            </View>

            {/* Category + Amount */}
            <View style={styles.fieldsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.smallLabel}>Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder={entryType === 'Income' ? 'e.g., Paycheck, Child Support' : 'e.g., Rent, Groceries'}
                  value={entryCategory}
                  onChangeText={setEntryCategory}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.smallLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={entryAmount}
                  onChangeText={setEntryAmount}
                />
              </View>
            </View>

            <Pressable style={styles.primaryBtn} onPress={addEntry} accessibilityLabel="Add entry">
              <Feather name="plus-circle" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Add</Text>
            </Pressable>
          </View>

          {/* Entries List */}
          <View style={styles.card}>
            <Text style={styles.h2}>Entries</Text>
            {entries.length === 0 ? (
              <Text style={styles.muted}>No entries yet</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {entries.map(e => (
                  <View key={e.id} style={styles.entryRow}>
                    <View
                      style={[
                        styles.typeDot,
                        { backgroundColor: e.type === 'Income' ? PALETTE.positive : PALETTE.negative }
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle}>
                        {e.category || (e.type === 'Income' ? 'Income' : 'Expense')}
                      </Text>
                      <Text style={styles.entrySub}>
                        {e.type} • ${Number(e.amount).toFixed(2)}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeEntry(e.id)} style={styles.iconBtn} accessibilityLabel="Remove entry">
                      <Feather name="trash-2" size={18} color={PALETTE.sub} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Totals */}
          <View style={styles.totalsBar}>
            <View style={[styles.totalPill, { backgroundColor: '#0EA5E9' /* subtle blue */ }]}>
              <Feather name="trending-down" size={16} color="#fff" />
              <Text style={styles.totalText}>Income ${totals.inc.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalPill, { backgroundColor: '#475569' /* slate */ }]}>
              <Feather name="activity" size={16} color="#fff" />
              <Text style={styles.totalText}>Net ${totals.net.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalPill, { backgroundColor: '#6B7280' /* gray */ }]}>
              <Feather name="trending-up" size={16} color="#fff" />
              <Text style={styles.totalText}>Expenses ${totals.exp.toFixed(2)}</Text>
            </View>
          </View>

          {/* Actions (Reload Removed) */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={submitPlan}
              disabled={busy}
              style={[styles.actionBtn, { backgroundColor: PALETTE.accent, opacity: busy ? 0.7 : 1 }]}
            >
              <Feather name="save" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{busy ? 'Working…' : 'Generate / Update Plan'}</Text>
            </Pressable>
          </View>

          {/* Saved Plan */}
          <View style={styles.card}>
            <Text style={styles.h2}>Saved Plan</Text>
            <View style={styles.planBox}>
              <Text style={styles.planText}>{plan || '(none yet)'}</Text>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.bg },

  inner: { padding: 16, gap: 12 },

  headerRow: { marginBottom: 4 },
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: PALETTE.text,
    letterSpacing: 0.2
  },

  kpisRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap'
  },
  kpiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.line
  },
  kpiText: { fontWeight: '700', color: PALETTE.text, fontSize: 12 },

  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: PALETTE.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.line,
    gap: 8
  },

  label: { fontWeight: '700', color: PALETTE.text },

  pickerWrap: {
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFF'
  },

  goal: {
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 10,
    padding: 10,
    minHeight: 60,
    backgroundColor: '#FFFFFF'
  },

  h2: { fontSize: 18, fontWeight: '800', color: PALETTE.text },

  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.line,
    backgroundColor: '#FFFFFF'
  },
  segmentBtnActive: {
    borderColor: PALETTE.accent,
    backgroundColor: '#EFF6FF' // light accent tint
  },
  segmentText: { fontWeight: '700', color: PALETTE.text },

  fieldsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4
  },
  smallLabel: { color: PALETTE.sub, fontSize: 12, marginBottom: 6, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#FFFFFF'
  },

  primaryBtn: {
    marginTop: 10,
    backgroundColor: PALETTE.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.line,
    shadowColor: PALETTE.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    gap: 10
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 10
  },
  entryTitle: { fontWeight: '700', color: PALETTE.text },
  entrySub: { color: PALETTE.sub, marginTop: 2 },

  totalsBar: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 4
  },
  totalPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6
  },
  totalText: { color: '#fff', fontWeight: '800' },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  actionBtnText: { color: '#fff', fontWeight: '800' },

  planBox: {
    borderWidth: 1,
    borderColor: PALETTE.line,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    backgroundColor: '#FFFFFF'
  },
  planText: { fontSize: 15, lineHeight: 20, color: PALETTE.text },

  iconBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC'
  },

  muted: { color: PALETTE.sub }
});
