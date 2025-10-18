import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function App(){
  const [nickname, setNickname] = useState('kubi')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  async function load(){
    const res = await fetch(`${API}/messages`)
    const data = await res.json()
    setMessages(data)
  }

  useEffect(()=>{ load() }, [])

  async function send(){
    if(!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, text })
      })
      const saved = await res.json()
      setMessages(prev => [...prev, saved])
      setText('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth: 680, margin: '40px auto', fontFamily: 'system-ui, sans-serif'}}>
      <h1>Sentiment Chat</h1>
      <div style={{display:'flex', gap: 8, marginBottom: 12}}>
        <input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="nickname" />
        <button onClick={async()=>{
          await fetch(`${API}/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nickname })})
        }}>Register</button>
      </div>
      <div style={{border:'1px solid #ddd', padding:12, borderRadius:8, minHeight:200}}>
        {messages.map(m => (
          <div key={m.id} style={{marginBottom:8}}>
            <b>{m.nickname}:</b> {m.text}
            <span style={{marginLeft:8, padding:'2px 8px', borderRadius:12, background: badgeColor(m.sentiment), color:'#fff'}}>
              {m.sentiment} {(m.score??0).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div style={{display:'flex', gap:8, marginTop:12}}>
        <input style={{flex:1}} value={text} onChange={e=>setText(e.target.value)} placeholder="type a message" />
        <button disabled={loading} onClick={send}>{loading ? '...' : 'Send'}</button>
      </div>
      <p style={{opacity:.6, marginTop:16}}>API: {API}</p>
    </div>
  )
}

function badgeColor(s){
  if(s === 'positive') return '#16a34a'
  if(s === 'negative') return '#dc2626'
  return '#6b7280'
}
