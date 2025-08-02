import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet
} from 'react-native';

type Entry = {
  id: string;
  type: 'Income' | 'Expense';
  amount: string;
};

export default function BudgetScreen() {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [entries, setEntries] = useState<Entry[]>([]);

  const addEntry = () => {
    if (!amount) return;
    const newEntry = {
      id: String(Date.now()),
      type,
      amount,
    };
    setEntries(current => [newEntry, ...current]);
    setAmount('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Budgeting Tools</Text>

      <View style={styles.formRow}>
        <Button
          title="Income"
          onPress={() => setType('Income')}
          color={type === 'Income' ? '#4CAF50' : '#888'}
        />
        <Button
          title="Expense"
          onPress={() => setType('Expense')}
          color={type === 'Expense' ? '#F44336' : '#888'}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="number-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Button title="Add Entry" onPress={addEntry} />

      <FlatList
        style={styles.list}
        data={entries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text style={styles.entryText}>
              {item.type}: ${item.amount}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No entries yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16 },
  header: { fontSize:20, fontWeight:'bold', marginBottom:12 },
  formRow: { flexDirection:'row', justifyContent:'space-around', marginBottom:12 },
  input: { borderBottomWidth:1, marginBottom:12, fontSize:18, padding:4 },
  list: { marginTop:16 },
  entry: { paddingVertical:8, borderBottomWidth:1, borderColor:'#ddd' },
  entryText: { fontSize:16 },
  empty: { textAlign:'center', marginTop:24, color:'#666' },
});
