import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet
} from 'react-native';

type Message = {
  id: string;
  from: 'user' | 'bot';
  text: string;
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', from: 'bot', text: 'Hi, I’m Emily. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: String(Date.now()),
      from: 'user',
      text: input.trim(),
    };
    setMessages(prev => [userMsg, ...prev]);
    setInput('');

    // Placeholder bot response
    setTimeout(() => {
      const botMsg: Message = {
        id: String(Date.now()+1),
        from: 'bot',
        text: 'Thanks for your question! (This is a placeholder response.)',
      };
      setMessages(prev => [botMsg, ...prev]);
    }, 500);
  };

  return (
    <View style={styles.container}>
      <FlatList
        inverted
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.balloon,
              item.from === 'bot' ? styles.bot : styles.user
            ]}
          >
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask Emily..."
          value={input}
          onChangeText={setInput}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:12 },
  balloon: {
    marginVertical:6,
    padding:8,
    borderRadius:8,
    maxWidth:'80%'
  },
  bot: { backgroundColor:'#eee', alignSelf:'flex-start' },
  user: { backgroundColor:'#cce5ff', alignSelf:'flex-end' },
  text: { fontSize:16 },
  inputRow: {
    flexDirection:'row',
    alignItems:'center',
    borderTopWidth:1,
    borderColor:'#ddd',
    paddingTop:8
  },
  input: {
    flex:1,
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:4,
    paddingHorizontal:8,
    marginRight:8,
    height:40
  },
});
