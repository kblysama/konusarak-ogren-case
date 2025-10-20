import React, { useEffect, useState, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function App(){
  const [nickname, setNickname] = useState('')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const listRef = useRef(null)
  const abortRef = useRef(null)

  // --- helpers ---
  const scrollToBottom = () => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }
  const badgeColor = (s) => (s === 'positive' ? 'bg-green-500' : s === 'negative' ? 'bg-red-500' : 'bg-gray-500')
  const trLabel = (s) => (s === 'positive' ? 'Pozitif' : s === 'negative' ? 'Negatif' : 'Nötr')

  // --- data ---
  const load = useCallback(async () => {
    try {
      setRefreshing(true)
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch(`${API}/messages`, { signal: controller.signal })
      if (!res.ok) throw new Error(`GET /messages ${res.status}`)
      const data = await res.json()
      setMessages(data)
    } catch (err) {
      console.error('Mesajları getirirken hata:', err?.message || err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { scrollToBottom() }, [messages])
  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => { if (isRegistered) load() }, [isRegistered, load])

  // Sekme görünür olduğunda tek sefer GET
  useEffect(() => {
    function onVisible(){
      if (!document.hidden && isRegistered) load()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [isRegistered, load])

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
        const body = await res.text()
        alert(body || 'Bu kullanıcı adı zaten kullanılıyor!')
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
        // GET çağırmadan listeyi yerelde güncelle
        setMessages(prev => [...prev, saved])
        setText('')
      } else {
        const body = await res.text()
        alert(body || 'Mesaj gönderme hatası!')
      }
    } catch (error) {
      alert('Mesaj gönderme hatası: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen">
      <div className="flex h-screen">
        {/* SideNavBar */}
        <aside className="w-80 bg-background-light dark:bg-[#111a22] flex flex-col p-4 border-r border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 flex-grow">
            <button
              onClick={() => { /* yeni sohbet için yer ayrıldı */ }}
              className="flex w-full items-center justify-center rounded-lg h-12 px-4 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em]"
            >
              <span className="material-symbols-outlined mr-2">add</span>
              <span className="truncate">Yeni Sohbet</span>
            </button>

            <div className="flex flex-col gap-2 mt-4 flex-grow overflow-y-auto">
              {/* Örnek sohbet listesi - istersen gerçek liste ile doldur */}
              {['Sohbet 1 - 12/03/2023','Sohbet 2 - 11/03/2023','Sohbet 3 - 10/03/2023'].map((t, i) => (
                <div
                  key={t}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i===0 ? 'bg-primary/20 dark:bg-[#233648]' : 'hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer'}`}
                >
                  <span className={`material-symbols-outlined ${i===0 ? 'text-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {i===0 ? 'chat_bubble' : 'chat_bubble_outline'}
                  </span>
                  <p className={`${i===0 ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'} text-sm font-medium leading-normal`}>{t}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border-t border-gray-200 dark:border-gray-700 mt-4">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA55Ln7qt8XgYas5Kiuhf96A_qWflqAiW-8_AD1goinrOpKcHj-Q5ru4grmrMCrdlSXh0igW8XXthWO1kCaXg4zCbLI9ebXsvgbTlAn1jZ-MkCQjA7Gyp5kKZat3ws_UGSns6O_VYbegB3RQa5Qu-ObieFVXYUHHYU3TRCOF_8Mn-OFrn-CFcOYkjK_irRx5OrSpabMn7yC_6JOnz8Nnnl_30GtMtpvg2KAaEPzA8OCjsr9iEeWHas34j11NLKREgpvmBxxlQXhB3U')` }}
            />
            <div className="flex flex-col">
              <h1 className="text-gray-800 dark:text-white text-base font-medium leading-normal">{isRegistered ? nickname : 'Kullanıcı'}</h1>
              <p className="text-green-500 text-sm font-normal leading-normal">{isRegistered ? 'Online' : 'Offline'}</p>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-background-light dark:bg-background-dark">
          {/* Header / Auth */}
          {!isRegistered ? (
            <div className="p-6">
              <div className="mx-auto max-w-2xl bg-white dark:bg-[#111a22] rounded-xl shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI Duygu Analizi Chat</h1>
                <p className="text-gray-600 dark:text-[#92adc9]">Mesajlarınız AI tarafından analiz edilerek duygu durumunuz gösterilir</p>
                <div className="flex gap-3 mt-5">
                  <input
                    className="flex-1 h-12 px-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#233648] text-gray-900 dark:text-white outline-none"
                    placeholder="Kullanıcı adınız..."
                    value={nickname}
                    onChange={e=>setNickname(e.target.value)}
                    onKeyDown={(e)=> e.key==='Enter' && register()}
                  />
                  <button
                    onClick={register}
                    className="h-12 px-5 rounded-lg bg-primary text-white font-semibold"
                  >
                    Giriş Yap
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-white dark:bg-[#111a22] mx-6 mt-6 mb-3 px-4 py-3 rounded-xl shadow">
                <p className="text-gray-800 dark:text-white">Hoş geldin, <strong>{nickname}</strong>! 🎉</p>
                <div className="flex gap-2">
                  <button
                    onClick={load}
                    disabled={refreshing}
                    className="px-3 py-2 rounded-md bg-sky-500 text-white flex items-center gap-2"
                    title="Yeni mesajları getir"
                  >
                    <span className="material-symbols-outlined">{refreshing ? 'hourglass_top' : 'refresh'}</span>
                    Yenile
                  </button>
                  <button
                    onClick={() => { setIsRegistered(false); setMessages([]); setText('') }}
                    className="px-3 py-2 rounded-md bg-red-500 text-white"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto" ref={listRef}>
                <div className="flex flex-col gap-6 max-w-2xl">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-[#92adc9]">
                      Henüz mesaj yok. İlk mesajını gönder! 🎉
                    </div>
                  )}

                  {messages.map(m => (
                    <div key={m.id} className="flex flex-col gap-3">
                      {/* User Message (Right) */}
                      <div className="flex items-end gap-3 justify-end">
                        <div className="flex flex-1 flex-col gap-1 items-end">
                          <p className="text-gray-500 dark:text-[#92adc9] text-sm font-normal leading-normal max-w-sm text-right">
                            {m.nickname} • {new Date(m.createdAt).toLocaleTimeString('tr-TR')}
                          </p>
                          <div className="text-base leading-normal flex max-w-sm rounded-lg px-4 py-3 bg-primary text-white">
                            {m.text}
                          </div>
                        </div>
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0"
                          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5Db6GlSJzXFPrJp80iJYR-rH8-0s58W6gq0q_qPZvB3EGnlX9jWrLJu3EhgbqIDqRiL5sfVTrjCBLjWTomEVtQIUyyLAd_nnd0WDIhXBzrO8OP9L6q7mU4zCIcKrVrAvPkoX5lQKkgL7ngsVNaD7UakEviKWB0l5PkzFVxQYFvVi8zi5UhIxg9bfC9mTK439wEehkCalIRbft4QXKpJFs6Z0lltIrtF3vMuRgkPcEMvuXcF2MJa8b6Rtm8kyjNKtByuBvUZygE5M')` }}
                        />
                      </div>

                      {/* Bot Analysis (Left) */}
                      <div className="flex items-end gap-3">
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0"
                          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBUcKkfoWvd1vSAUnIVGHBOEO9mqkRKBTtq9iUV5DQrShV7oSHqKl2VbTxUz3QB3R8Er8TP0NJzHS4LB4r32XFsPUEoMZ5yc2p211soVkVClyrFHnMaXe_hL4NA4PbDYTbpH34QzenKQLrtboeWcoHWb_2Kxrl4wwZUuClGAk19eXGEWmHg3OXNV5AkL65D15PROVP18wPgWskwmpCe6WPHQMCTQevKgOLsIqYe1m28TI8IwAyDQtR7e5oL4CtdJ4ycyUh2x1lJIxw')` }}
                        />
                        <div className="flex flex-1 flex-col gap-2 items-start max-w-sm">
                          {!m.sentiment ? (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-200 dark:bg-[#233648] text-gray-800 dark:text-white">
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                          ) : (
                            <div className="w-full rounded-lg p-4 bg-gray-200 dark:bg-[#233648] text-gray-800 dark:text-white">
                              <p className="text-base font-normal leading-normal mb-3">
                                Bu metnin duygu skoru: {trLabel(m.sentiment)} ({(m.score ?? 0).toFixed(2)})
                              </p>
                              <div className="flex flex-col gap-3">
                                <div className="flex gap-6 justify-between items-center">
                                  <p className="text-gray-800 dark:text-white text-base font-medium leading-normal">{trLabel(m.sentiment)}</p>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-normal">
                                    {Math.round((m.score || 0) * 100)}%
                                  </p>
                                </div>
                                <div className="rounded bg-gray-300 dark:bg-[#324d67]">
                                  <div className={`h-2 rounded ${badgeColor(m.sentiment)}`} style={{ width: `${Math.round((m.score || 0) * 100)}%` }} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-700">
                <div className="relative flex items-center max-w-2xl">
                  <textarea
                    className="w-full h-12 p-3 pr-12 text-base rounded-lg bg-gray-200 dark:bg-[#233648] text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary focus:border-primary resize-none border-transparent"
                    placeholder="Mesajınızı buraya yazın..."
                    value={text}
                    onChange={(e)=>setText(e.target.value)}
                    onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send() } }}
                  />
                  <button
                    onClick={send}
                    disabled={loading}
                    className="absolute right-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-70"
                    title="Gönder"
                  >
                    <span className="material-symbols-outlined text-lg">{loading ? 'hourglass_top' : 'send'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

