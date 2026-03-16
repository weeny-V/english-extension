import React, { useState, useEffect } from 'react'
import './styles.css'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type ConnStatus = 'unconfigured' | 'checking' | 'connected' | 'failed'

const LANGUAGES = [
    'English',
    'Ukrainian',
    'Russian',
    'German',
    'Spanish',
    'French',
    'Italian',
    'Portuguese',
    'Polish',
    'Dutch',
    'Japanese',
    'Chinese',
    'Korean',
    'Arabic',
    'Turkish',
    'Hindi',
]

export default function PopupApp() {
    const [token, setToken] = useState('')
    const [dbId, setDbId] = useState('')
    const [geminiKey, setGeminiKey] = useState('')
    const [sourceLang, setSourceLang] = useState('English')
    const [targetLang, setTargetLang] = useState('Ukrainian')
    const [showToken, setShowToken] = useState(false)
    const [showGeminiKey, setShowGeminiKey] = useState(false)
    const [showSetup, setShowSetup] = useState(false)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [connStatus, setConnStatus] = useState<ConnStatus>('unconfigured')
    const [connMsg, setConnMsg] = useState('')

    useEffect(() => {
        chrome.storage.sync.get(
            ['notionToken', 'notionDatabaseId', 'geminiApiKey', 'sourceLang', 'targetLang'],
            (res) => {
                if (res.notionToken) setToken(res.notionToken as string)
                if (res.notionDatabaseId) setDbId(res.notionDatabaseId as string)
                if (res.geminiApiKey) setGeminiKey(res.geminiApiKey as string)
                if (res.sourceLang) setSourceLang(res.sourceLang as string)
                if (res.targetLang) setTargetLang(res.targetLang as string)
                if (res.notionToken && res.notionDatabaseId) setConnStatus('connected')
            },
        )
    }, [])

    const handleSave = async () => {
        if (!token.trim() || !dbId.trim()) return
        setSaveStatus('saving')
        try {
            await chrome.storage.sync.set({
                notionToken: token.trim(),
                notionDatabaseId: dbId.trim(),
                geminiApiKey: geminiKey.trim(),
                sourceLang,
                targetLang,
            })
            setSaveStatus('saved')
            setConnStatus('connected')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch {
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 2000)
        }
    }

    const handleTest = async () => {
        if (!token.trim() || !dbId.trim()) {
            setConnMsg('Please enter both fields first')
            setConnStatus('failed')
            return
        }
        setConnStatus('checking')
        setConnMsg('')
        try {
            const res = await chrome.runtime.sendMessage({
                type: 'TEST_CONNECTION',
                token: token.trim(),
                databaseId: dbId.trim(),
            })
            console.log(res)
            if (res?.success) {
                setConnStatus('connected')
                setConnMsg(`✓ Connected to "${res.databaseName}"`)
            } else {
                setConnStatus('failed')
                setConnMsg(res?.error || 'Connection failed')
            }
        } catch {
            setConnStatus('failed')
            setConnMsg('Could not reach extension background')
        }
    }

    const statusMap = {
        unconfigured: { dot: '#6b7280', label: 'Not configured' },
        checking: { dot: '#f59e0b', label: 'Checking…' },
        connected: { dot: '#10b981', label: 'Connected' },
        failed: { dot: '#ef4444', label: 'Connection failed' },
    }
    const s = statusMap[connStatus]

    return (
        <div className="popup">
            {/* ── Header ── */}
            <header className="header">
                <div className="header__brand">
                    <div className="header__icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="header__title">Notion Word Saver</h1>
                        <p className="header__sub">Highlight · Translate · Save · Learn</p>
                    </div>
                </div>
                <div className="status-pill">
                    <span className="status-pill__dot" style={{ background: s.dot }} />
                    <span className="status-pill__label">{s.label}</span>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="body">
                {/* ── Notion Section ── */}
                <div className="section-label">Notion Settings</div>

                {/* Token */}
                <div className="field">
                    <div className="field__label">
                        <span>Integration Token</span>
                        <button className="link-btn" onClick={() => setShowToken(!showToken)}>
                            {showToken ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <input
                        id="nws-token"
                        className="input"
                        type={showToken ? 'text' : 'password'}
                        placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                </div>

                {/* Database ID */}
                <div className="field">
                    <div className="field__label"><span>Database/Page/Block ID</span></div>
                    <input
                        id="nws-db-id"
                        className="input"
                        type="text"
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={dbId}
                        onChange={(e) => setDbId(e.target.value)}
                    />
                </div>

                {/* Connection message */}
                {connMsg && (
                    <p className={`msg ${connStatus === 'connected' ? 'msg--ok' : 'msg--err'}`}>
                        {connMsg}
                    </p>
                )}

                {/* Test button */}
                <button
                    id="nws-test-btn"
                    className="btn btn--outline btn--full"
                    onClick={handleTest}
                    disabled={connStatus === 'checking'}
                >
                    {connStatus === 'checking' ? 'Checking…' : 'Test Connection'}
                </button>

                {/* ── Divider ── */}
                <div className="section-divider" />

                {/* ── Translation Section ── */}
                <div className="section-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle', opacity: 0.7 }}>
                        <path d="m5 8 6 6" />
                        <path d="m4 14 6-6 2-3" />
                        <path d="M2 5h12" />
                        <path d="M7 2h1" />
                        <path d="m22 22-5-10-5 10" />
                        <path d="M14 18h6" />
                    </svg>
                    Translation Settings
                </div>

                {/* Gemini API Key */}
                <div className="field">
                    <div className="field__label">
                        <span>Gemini API Key</span>
                        <button className="link-btn" onClick={() => setShowGeminiKey(!showGeminiKey)}>
                            {showGeminiKey ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <input
                        id="nws-gemini-key"
                        className="input"
                        type={showGeminiKey ? 'text' : 'password'}
                        placeholder="AIzaSy..."
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                    />
                </div>

                {/* Language selectors */}
                <div className="field-row">
                    <div className="field field--half">
                        <div className="field__label"><span>From</span></div>
                        <select
                            id="nws-source-lang"
                            className="input select"
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field-row__arrow">→</div>
                    <div className="field field--half">
                        <div className="field__label"><span>To</span></div>
                        <select
                            id="nws-target-lang"
                            className="input select"
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Save all settings */}
                <button
                    id="nws-save-btn"
                    className={`btn btn--primary btn--full ${saveStatus === 'saved' ? 'btn--saved' : ''}`}
                    onClick={handleSave}
                    disabled={saveStatus === 'saving' || !token || !dbId}
                >
                    {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving…' : 'Save All Settings'}
                </button>

                {/* Setup guide */}
                <div className="guide">
                    <button className="guide__toggle" onClick={() => setShowSetup(!showSetup)}>
                        <span>How to set up</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points={showSetup ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                        </svg>
                    </button>
                    {showSetup && (
                        <ol className="guide__list">
                            <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer">notion.so/my-integrations</a> → New integration</li>
                            <li>Copy the <strong>Token</strong> (starts with <code>secret_</code>)</li>
                            <li>Open your Notion <strong>Database</strong> → ••• → Connections → Add integration</li>
                            <li>Copy the <strong>Database ID</strong> from the URL:<br />
                                <code className="code-block">notion.so/…/<b>[DATABASE_ID]</b>?v=…</code>
                            </li>
                            <li>Get a <strong>Gemini API Key</strong> from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com</a></li>
                        </ol>
                    )}
                </div>
            </div>

            <footer className="footer">
                Select text on any webpage → see instant translation + save to Notion
            </footer>
        </div>
    )
}
