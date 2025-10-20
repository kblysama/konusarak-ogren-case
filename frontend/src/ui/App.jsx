import React, { useEffect, useState, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function App(){
  const [nickname, setNickname] = useState('')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const messagesEndRef = useRef(null)

  async function load(){
    const res = await fetch(`${API}/messages`)
    const data = await res.json()
    setMessages(data)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  async function messageCheck(){
    if (messages.length > 0) {load} console.log("Yeni mesaj var mı kontrol ediliyor...")
  }
  useEffect(()=>{ 
    messageCheck()
    scrollToBottom()
  }, [messages])

  useEffect(()=>{ 
    // Her 2 saniyede bir mesajları yenile
    const interval = setInterval(load, 200000)
    console.log("Mesajlar yenileniyor...")
    return () => clearInterval(interval)
  }, [])

  async function register(){
    if(!nickname.trim()) return
    try {
      const res = await fetch(`${API}/register`, {
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ nickname })
      })
      if(res.ok) {
        setIsRegistered(true)
        await load()
      } else {
        alert('Bu kullanıcı adı zaten kullanılıyor!')
      }
    } catch (error) {
      alert('Kayıt hatası: ' + error.message)
    }
  }

  async function send(){
    if(!text.trim() || !isRegistered) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, text })
      })
      if(res.ok) {
        const saved = await res.json()
        setMessages(prev => [...prev, saved])
        setText('')
      } else {
        alert('Mesaj gönderme hatası!')
      }
    } catch (error) {
      alert('Mesaj gönderme hatası: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🤖 AI Duygu Analizi Chat</h1>
        <p style={styles.subtitle}>Mesajlarınız AI tarafından analiz edilerek duygu durumunuz gösterilir</p>
      </div>

      {!isRegistered ? (
        <div style={styles.registerSection}>
          <h3>Giriş Yap</h3>
          <div style={styles.inputGroup}>
            <input 
              style={styles.input}
              value={nickname} 
              onChange={e=>setNickname(e.target.value)} 
              placeholder="Kullanıcı adınızı girin..." 
              onKeyPress={(e) => e.key === 'Enter' && register()}
            />
            <button style={styles.registerButton} onClick={register}>
              Giriş Yap
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={styles.welcomeSection}>
            <p>Hoş geldin, <strong>{nickname}</strong>! 👋</p>
            <button style={styles.logoutButton} onClick={() => setIsRegistered(false)}>
              Çıkış Yap
            </button>
          </div>

          <div style={styles.chatContainer}>
            <div style={styles.messagesContainer}>
              {messages.length === 0 ? (
                <div style={styles.emptyState}>
                  <p>Henüz mesaj yok. İlk mesajınızı gönderin! 💬</p>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} style={styles.messageItem}>
                    <div style={styles.messageHeader}>
                      <span style={styles.nickname}>{m.nickname}</span>
                      <span style={styles.timestamp}>
                        {new Date(m.createdAt).toLocaleTimeString('tr-TR')}
                      </span>
                    </div>
                    <div style={styles.messageText}>{m.text}</div>
                    <div style={styles.sentimentContainer}>
                      <span style={{
                        ...styles.sentimentBadge,
                        backgroundColor: badgeColor(m.sentiment)
                      }}>
                        {getSentimentEmoji(m.sentiment)} {getSentimentText(m.sentiment)} 
                        <span style={styles.score}>({(m.score??0).toFixed(2)})</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputSection}>
              <input 
                style={styles.messageInput}
                value={text} 
                onChange={e=>setText(e.target.value)} 
                placeholder="Mesajınızı yazın..."
                onKeyPress={(e) => e.key === 'Enter' && send()}
              />
              <button 
                style={{...styles.sendButton, opacity: loading ? 0.7 : 1}}
                disabled={loading} 
                onClick={send}
              >
                {loading ? '⏳' : '📤'} {loading ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </div>
        </>
      )}

      <div style={styles.footer}>
        <p style={styles.apiInfo}>API: {API}</p>
      </div>
    </div>
  )
}

function badgeColor(s){
  if(s === 'positive') return '#10b981'
  if(s === 'negative') return '#ef4444'
  return '#6b7280'
}

function getSentimentEmoji(sentiment) {
  if(sentiment === 'positive') return '😊'
  if(sentiment === 'negative') return '😞'
  return '😐'
}

function getSentimentText(sentiment) {
  if(sentiment === 'positive') return 'Pozitif'
  if(sentiment === 'negative') return 'Negatif'
  return 'Nötr'
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '2rem',
    color: '#1e293b',
    fontWeight: 'bold'
  },
  subtitle: {
    margin: '0',
    color: '#64748b',
    fontSize: '1rem'
  },
  registerSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  inputGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  },
  input: {
    flex: '1',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  registerButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  welcomeSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '15px 20px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  chatContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  messagesContainer: {
    height: '400px',
    overflowY: 'auto',
    padding: '20px',
    borderBottom: '1px solid #e2e8f0'
  },
  emptyState: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '18px',
    marginTop: '100px'
  },
  messageItem: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  nickname: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '14px'
  },
  timestamp: {
    color: '#64748b',
    fontSize: '12px'
  },
  messageText: {
    color: '#334155',
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '10px'
  },
  sentimentContainer: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  sentimentBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  score: {
    fontSize: '12px',
    opacity: '0.8'
  },
  inputSection: {
    display: 'flex',
    gap: '12px',
    padding: '20px',
    backgroundColor: '#f8fafc'
  },
  messageInput: {
    flex: '1',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  sendButton: {
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  apiInfo: {
    margin: '0',
    color: '#64748b',
    fontSize: '12px'
  }
}
