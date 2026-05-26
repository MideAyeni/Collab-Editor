import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'

function getRoomId() {
  const params = new URLSearchParams(window.location.search)
  let room = params.get('room')
  if (!room) {
    room = Math.random().toString(36).substring(2, 8)
    window.history.replaceState({}, '', `?room=${room}`)
  }
  return room
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:1234'
const roomId = getRoomId()

export default function App() {
  const editorRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [userCount, setUserCount] = useState(1)
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState('javascript')

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor
    const doc = new Y.Doc()
    const provider = new WebsocketProvider(SERVER_URL, roomId, doc)
    const yText = doc.getText('monaco')
    const binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    )
    provider.on('status', ({ status }) => {
      setConnected(status === 'connected')
    })
    provider.awareness.on('change', () => {
      setUserCount(provider.awareness.getStates().size)
    })
    provider.awareness.setLocalStateField('user', {
      name: `User ${Math.floor(Math.random() * 100)}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
    })
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>{'</>'} Collabo</span>
          <span style={{
            ...styles.badge,
            backgroundColor: connected ? '#22c55e22' : '#ef444422',
            color: connected ? '#22c55e' : '#ef4444',
            border: `1px solid ${connected ? '#22c55e44' : '#ef444444'}`
          }}>
            {connected ? '● Connected' : '○ Connecting...'}
          </span>
          <span style={styles.badge}>
            👥 {userCount} {userCount === 1 ? 'user' : 'users'}
          </span>
        </div>
        <div style={styles.headerRight}>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={styles.select}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
          </select>
          <button onClick={copyShareLink} style={styles.button}>
            {copied ? '✅ Copied!' : '🔗 Share Room'}
          </button>
        </div>
      </div>
      <div style={styles.roomBar}>
        <span style={styles.roomText}>
          Room: <strong>{roomId}</strong> — Share the URL to collaborate in real-time
        </span>
      </div>
      <Editor
        height="calc(100vh - 88px)"
        language={language}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          fontSize: 15,
          fontFamily: "'Fira Code', 'Cascadia Code', monospace",
          fontLigatures: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          tabSize: 2,
        }}
      />
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: '52px',
    backgroundColor: '#252526',
    borderBottom: '1px solid #3e3e42',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#569cd6',
    letterSpacing: '-0.5px',
  },
  badge: {
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#3e3e4222',
    border: '1px solid #3e3e42',
    color: '#9d9d9d',
  },
  select: {
    backgroundColor: '#3c3c3c',
    color: '#d4d4d4',
    border: '1px solid #3e3e42',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  button: {
    backgroundColor: '#0e639c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  roomBar: {
    padding: '5px 16px',
    backgroundColor: '#1e1e1e',
    borderBottom: '1px solid #3e3e4233',
    flexShrink: 0,
  },
  roomText: {
    fontSize: '12px',
    color: '#6e6e6e',
  },
}