import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'

export default function ProblemCard({ problem }) {
    const [expanded, setExpanded] = useState(false)
    const [activeTab, setActiveTab] = useState('description')
    const [solution, setSolution] = useState('')
    const [language, setLanguage] = useState('python')
    const [status, setStatus] = useState('todo')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Load solution from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem(`solution-${problem.id}`)
        if (savedData) {
            const data = JSON.parse(savedData)
            setSolution(data.solution || '')
            setLanguage(data.language || 'python')
            setStatus(data.status || 'todo')
        }
    }, [problem.id])

    // Save solution to localStorage
    const saveSolution = () => {
        setSaving(true)
        const data = {
            solution,
            language,
            status,
            updatedAt: new Date().toISOString()
        }
        localStorage.setItem(`solution-${problem.id}`, JSON.stringify(data))

        setTimeout(() => {
            setSaving(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }, 300)
    }

    const languages = [
        { value: 'python', label: 'Python' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'java', label: 'Java' },
        { value: 'cpp', label: 'C++' },
        { value: 'csharp', label: 'C#' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
    ]

    const statusOptions = [
        { value: 'todo', label: '📋 To Do', color: 'var(--text-secondary)' },
        { value: 'attempted', label: '🔄 Attempted', color: 'var(--warning)' },
        { value: 'solved', label: '✅ Solved', color: 'var(--success)' },
    ]

    return (
        <div className={`problem-card ${status}`}>
            <div className="problem-header" onClick={() => setExpanded(!expanded)}>
                <div className="problem-info">
                    <span className="problem-id">#{problem.id}</span>
                    <span className="problem-title">
                        <a
                            href={`https://leetcode.com/problems/${problem.title.toLowerCase().replace(/\s+/g, '-')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {problem.title}
                        </a>
                    </span>
                    <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                        {problem.difficulty}
                    </span>
                </div>

                <div className="problem-meta">
                    {problem.companies.length > 0 && (
                        <div className="company-tags">
                            {problem.companies.slice(0, 3).map(c => (
                                <span key={c.name} className="company-tag">{c.name}</span>
                            ))}
                            {problem.companies.length > 3 && (
                                <span className="company-tag">+{problem.companies.length - 3}</span>
                            )}
                        </div>
                    )}

                    <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>
                        ▼
                    </span>
                </div>
            </div>

            {expanded && (
                <div className="problem-content">
                    <div className="content-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            📝 Description
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'solution' ? 'active' : ''}`}
                            onClick={() => setActiveTab('solution')}
                        >
                            💻 My Solution
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
                            onClick={() => setActiveTab('companies')}
                        >
                            🏢 Companies ({problem.companies.length})
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'description' && (
                            <>
                                <div
                                    className="problem-description"
                                    dangerouslySetInnerHTML={{ __html: problem.content }}
                                />

                                {problem.topics.length > 0 && (
                                    <div className="topic-tags">
                                        {problem.topics.map(topic => (
                                            <span key={topic} className="topic-tag">{topic}</span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'solution' && (
                            <div className="solution-editor">
                                <div className="editor-header">
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <select
                                            className="language-select"
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                        >
                                            {languages.map(lang => (
                                                <option key={lang.value} value={lang.value}>
                                                    {lang.label}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            className="status-select"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            style={{
                                                color: statusOptions.find(s => s.value === status)?.color
                                            }}
                                        >
                                            {statusOptions.map(s => (
                                                <option key={s.value} value={s.value}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        className="save-btn"
                                        onClick={saveSolution}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Solution'}
                                    </button>
                                </div>

                                <div className="editor-container">
                                    <Editor
                                        height="100%"
                                        language={language}
                                        value={solution}
                                        onChange={(value) => setSolution(value || '')}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            fontFamily: "'Fira Code', monospace",
                                            padding: { top: 16 },
                                            scrollBeyondLastLine: false,
                                            wordWrap: 'on',
                                            automaticLayout: true,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'companies' && (
                            <div className="companies-list">
                                {problem.companies.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        No company data available for this problem.
                                    </p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Company</th>
                                                <th style={{ textAlign: 'right', padding: '0.75rem' }}>Frequency</th>
                                                <th style={{ textAlign: 'right', padding: '0.75rem' }}>Acceptance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {problem.companies
                                                .sort((a, b) => b.frequency - a.frequency)
                                                .map(company => (
                                                    <tr key={company.name} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '0.75rem' }}>{company.name}</td>
                                                        <td style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--accent)' }}>
                                                            {company.frequency.toFixed(1)}%
                                                        </td>
                                                        <td style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--success)' }}>
                                                            {(company.acceptanceRate * 100).toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
