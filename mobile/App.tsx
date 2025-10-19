import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  TextInput,
  Button,
  FlatList,
  Text,
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import axios from 'axios';

const API = 'http://10.0.2.2:5000'; // Android emulator için
// Gerçek cihaz için: 'http://YOUR_COMPUTER_IP:5000'

interface Message {
  id: number;
  nickname: string;
  text: string;
  sentiment: string;
  score: number;
  createdAt: string;
}

export default function App() {
  const [nickname, setNickname] = useState('');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = async () => {
    try {
      const { data } = await axios.get(`${API}/messages`);
      setMessages(data);
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    }
  };

  useEffect(() => {
    loadMessages();
    // Her 3 saniyede bir mesajları yenile
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const register = async () => {
    if (!nickname.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı gerekli!');
      return;
    }

    try {
      await axios.post(`${API}/register`, { nickname });
      setIsRegistered(true);
      Alert.alert('Başarılı', `Hoş geldin ${nickname}!`);
      await loadMessages();
    } catch (error: any) {
      if (error.response?.status === 409) {
        Alert.alert('Hata', 'Bu kullanıcı adı zaten kullanılıyor!');
      } else {
        Alert.alert('Hata', 'Kayıt olunamadı!');
      }
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !isRegistered) return;

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/message`, { nickname, text });
      setMessages(prev => [...prev, data]);
      setText('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Hata', 'Mesaj gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'Pozitif';
      case 'negative': return 'Negatif';
      default: return 'Nötr';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageItem}>
      <View style={styles.messageHeader}>
        <Text style={styles.nickname}>{item.nickname}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
      <Text style={styles.messageText}>{item.text}</Text>
      <View style={styles.sentimentContainer}>
        <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor(item.sentiment) }]}>
          <Text style={styles.sentimentText}>
            {getSentimentEmoji(item.sentiment)} {getSentimentText(item.sentiment)}
          </Text>
          <Text style={styles.score}>({item.score.toFixed(2)})</Text>
        </View>
      </View>
    </View>
  );

  if (!isRegistered) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.header}>
          <Text style={styles.title}>🤖 AI Duygu Analizi Chat</Text>
          <Text style={styles.subtitle}>Mobil Versiyon</Text>
        </View>

        <View style={styles.registerSection}>
          <Text style={styles.registerTitle}>Giriş Yap</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Kullanıcı adınızı girin..."
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity style={styles.registerButton} onPress={register}>
            <Text style={styles.registerButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.apiInfo}>API: {API}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🤖 AI Duygu Analizi Chat</Text>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Hoş geldin, {nickname}! 👋</Text>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={() => setIsRegistered(false)}
            >
              <Text style={styles.logoutButtonText}>Çıkış</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          style={styles.messagesList}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Henüz mesaj yok. İlk mesajınızı gönderin! 💬</Text>
            </View>
          }
        />

        <View style={styles.inputSection}>
          <TextInput
            style={styles.messageInput}
            value={text}
            onChangeText={setText}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="#94a3b8"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={sendMessage}
            disabled={loading}
          >
            <Text style={styles.sendButtonText}>
              {loading ? '⏳' : '📤'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#334155',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  registerSection: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  registerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: '#1e293b',
  },
  registerButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nickname: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 14,
  },
  timestamp: {
    color: '#64748b',
    fontSize: 12,
  },
  messageText: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  sentimentContainer: {
    alignItems: 'flex-end',
  },
  sentimentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentimentText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  score: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  inputSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 12,
    maxHeight: 100,
    color: '#1e293b',
  },
  sendButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 20,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  apiInfo: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
  },
});
