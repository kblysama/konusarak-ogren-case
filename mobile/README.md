# Mobile (React Native CLI)

## Create project (locally)
```bash
npx react-native init SentimentChatMobile
cd SentimentChatMobile
npm i axios
```

### Example `App.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView, TextInput, Button, FlatList, Text, View } from 'react-native';
import axios from 'axios';

const API = process.env.API_URL || 'http://10.0.2.2:5000'; // Android emulator

export default function App(){
  const [nickname, setNickname] = useState('kubi');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const load = async () => {
    const { data } = await axios.get(`${API}/messages`);
    setMessages(data);
  };
  useEffect(()=>{ load(); }, []);

  const send = async () => {
    const { data } = await axios.post(`${API}/message`, { nickname, text });
    setMessages(prev => [...prev, data]);
    setText('');
  };

  return (
    <SafeAreaView style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput value={nickname} onChangeText={setNickname} style={{ borderWidth:1, flex:1 }} />
        <Button title="Register" onPress={()=>axios.post(`${API}/register`, { nickname })} />
      </View>
      <FlatList
        style={{ marginVertical: 16 }}
        data={messages}
        keyExtractor={(item)=>String(item.id)}
        renderItem={({item}) => (
          <Text>{item.nickname}: {item.text} [{item.sentiment}]</Text>
        )}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput value={text} onChangeText={setText} style={{ borderWidth:1, flex:1 }} />
        <Button title="Send" onPress={send} />
      </View>
    </SafeAreaView>
  );
}
```
