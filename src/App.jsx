import { useState, useEffect, useMemo, useRef } from 'react'
import Editor from '@monaco-editor/react'
import './App.css'

// Complete Priority DSA Problems from user's list
const DSA_CATEGORIES = {
  'Arrays & Hashing': [
    'Two Sum', 'Group Anagrams', 'Top K Frequent Elements', 'Product of Array Except Self',
    'Longest Consecutive Sequence', 'Subarray Sum Equals K', 'Valid Anagram', 'Find the Duplicate Number',
    'Triplet', '3Sum', 'Search in 2D Matrix', 'Spiral Matrix', 'Array Rotation', 'Rotate Array',
    'Sort Colors', 'Best Time to Buy and Sell Stock', 'Buy Sell Stock', 'Jump Game',
    'Capacity to Ship Packages', 'Maximum Subarray', 'Gas Station', 'Container With Most Water', 'Trapping Rain Water'
  ],
  'Sliding Window': [
    'Longest Substring Without Repeating Characters', 'Minimum Window Substring',
    'Longest Repeating Character Replacement', 'Permutation in String',
    'Longest Self-Contained Substring', 'Length of Longest Valid Substring'
  ],
  'Linked Lists': [
    'Reverse Linked List', 'Linked List Cycle', 'Detect Loop', 'Remove Loop',
    'Middle of the Linked List', 'Find Middle', 'Merge Two Sorted Lists', 'Add Two Numbers',
    'Intersection of Two Linked Lists', 'Palindrome Linked List', 'Copy List with Random Pointer',
    'LRU Cache', 'Reverse Nodes in k-Group'
  ],
  'Stacks & Monotonic': [
    'Valid Parentheses', 'Min Stack', 'Implement Stack using Queues', 'Implement Queue using Stacks',
    'Evaluate Reverse Polish Notation', 'Largest Rectangle in Histogram',
    'Daily Temperatures', 'Remove K Digits'
  ],
  'Trees': [
    'Maximum Depth of Binary Tree', 'Max Depth', 'Same Tree', 'Symmetric Tree',
    'Binary Tree Level Order Traversal', 'Level Order', 'Zigzag Level Order',
    'Binary Tree Right Side View', 'Right Side View', 'Validate Binary Search Tree', 'Validate BST',
    'Kth Smallest Element in a BST', 'Kth Smallest', 'Lowest Common Ancestor', 'LCA',
    'Diameter of Binary Tree', 'Diameter', 'Path Sum', 'Boundary Traversal',
    'Convert Sorted Array to BST', 'Flatten Binary Tree',
    'Binary Tree Maximum Path Sum', 'Serialize and Deserialize Binary Tree', 'Serialize Deserialize'
  ],
  'Heaps': [
    'Kth Largest Element in an Array', 'Kth Largest in Stream', 'Find Median from Data Stream',
    'Merge k Sorted Lists', 'Merge K Sorted', 'Reorganize String', 'K Weakest Rows',
    'Minimum Meeting Rooms', 'Meeting Rooms II', 'Boats to Save People',
    'Minimum Cost to Hire Workers', 'IPO', 'Kth Smallest Element in a Sorted Matrix',
    'Find K Pairs with Smallest Sums'
  ],
  'Graphs': [
    'Number of Islands', 'Rotting Oranges', 'Word Ladder', 'Course Schedule',
    'Clone Graph', 'Detect Cycle', 'Topological Sort', 'Alien Dictionary',
    'Steps by Knight', 'Shortest Path in Binary Matrix', 'Cost to Reach Destination',
    'Strongly Connected Components', 'Kosaraju', 'Dijkstra',
    'Pacific Atlantic Water Flow', 'Surrounded Regions', 'Graph Valid Tree',
    'Critical Connections', 'Number of Provinces', 'Word Ladder II', 'Shortest Bridge',
    'Min Cost to Connect All Points', 'MST'
  ],
  'Backtracking': [
    'Permutations', 'Combinations', 'Subsets', 'Rat in Maze', 'N-Queens',
    'Word Search', 'Combination Sum', 'Sudoku Solver', 'Palindrome Partitioning',
    'Generate Parentheses', 'Largest Number in K Swaps'
  ],
  'DP Fundamentals': [
    '0-1 Knapsack', 'Knapsack', 'Unbounded Knapsack', 'Coin Change',
    'House Robber', 'Partition Equal Subset Sum', 'Longest Palindromic Substring',
    'Longest Common Subsequence', 'Edit Distance', 'Longest Increasing Subsequence',
    'Word Break', 'Egg Dropping', 'Stickler Thief', 'Decode Ways',
    'Interleaved Strings', 'Race Car'
  ],
  'Advanced Strings': [
    'Encode and Decode Strings', 'Group Shifted Strings', 'Substring with Concatenation of All Words',
    'Palindromic Substrings', 'Longest Repeating Subsequence'
  ],
  'Intervals & Greedy': [
    'Merge Intervals', 'Non-overlapping Intervals', 'Meeting Rooms',
    'Two Best Non-Overlapping Events', 'Task Scheduler', 'Jump Game', 'Gas Station'
  ],
}

function App() {
  const AUTH_HASH = "c0c4f90164bc7f8f84c86cda19c39b6fb337d6007418e89f2ac357bb5e2aa800"
  const ALLOWED_USER = "saikumar98125"

  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('leetcode-auth') === 'true')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Helper: Generate SHA-256 hash
  const hashPassword = async (pwd) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(pwd)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')

    const cleanUsername = username.trim().toLowerCase()
    const cleanPassword = password.trim()

    console.log("Checking Login:", { cleanUsername, ALLOWED_USER })

    // 1. Check Username
    if (cleanUsername !== ALLOWED_USER.toLowerCase()) {
      setAuthError('Invalid username')
      console.log('Username mismatch')
      return
    }

    // 2. Check Password Hash
    try {
      const inputHash = await hashPassword(cleanPassword)
      console.log("Password Comparison:", { inputHash, expected: AUTH_HASH })

      if (inputHash === AUTH_HASH) {
        setIsAuthenticated(true)
        localStorage.setItem('leetcode-auth', 'true')
        setAuthError('')
      } else {
        setAuthError('Invalid password')
        console.log('Hash mismatch')
      }
    } catch (err) {
      setAuthError('Authentication failed')
      console.error(err)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('leetcode-auth')
  }

  // JSONBin.io Cloud Storage (Restored)
  const JSONBIN_API_KEY = import.meta.env.VITE_JSONBIN_API_KEY || ''
  const JSONBIN_BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID || ''
  const isCloudConfigured = Boolean(JSONBIN_API_KEY && JSONBIN_BIN_ID)

  const [syncStatus, setSyncStatus] = useState('') // 'syncing', 'synced', 'error'

  const [currentView, setCurrentView] = useState('home')
  const [problems, setProblems] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [userData, setUserData] = useState({})


  // Filters
  const [search, setSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedProgress, setSelectedProgress] = useState('')
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [viewMode, setViewMode] = useState('priority') // 'priority' or 'all'
  const priorityDropdownRef = useRef(null)

  const [page, setPage] = useState(1)
  const perPage = 10

  // Clear all filters
  const clearFilters = () => {
    setSearch('')
    setSelectedCompany('')
    setSelectedDifficulty('')
    setSelectedTopic('')
    setSelectedCategories([])
    setSelectedProgress('')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setShowPriorityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load data on mount
  useEffect(() => {
    fetch('/data/processed_data.json')
      .then(res => res.json())
      .then(data => {
        setProblems(data.problems)
        setCompanies(data.companies)
        setStats(data.stats)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Load local user data first
    const saved = localStorage.getItem('leetcode-user-data')
    if (saved) setUserData(JSON.parse(saved))

    // Then load from cloud if configured
    if (isCloudConfigured) {
      loadFromCloud()
    }
  }, [])

  // JSONBin: Load data
  const loadFromCloud = async () => {
    if (!isCloudConfigured) return
    try {
      setSyncStatus('syncing')
      const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: { 'X-Access-Key': JSONBIN_API_KEY }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.record) {
          setUserData(data.record)
          localStorage.setItem('leetcode-user-data', JSON.stringify(data.record))
        }
        setSyncStatus('synced')
      } else {
        setSyncStatus('error')
      }
    } catch (e) {
      console.error('Cloud load error:', e)
      setSyncStatus('error')
    }
  }

  // JSONBin: Save data
  const saveToCloud = async (data) => {
    if (!isCloudConfigured) return
    try {
      setSyncStatus('syncing')
      const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': JSONBIN_API_KEY
        },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        setSyncStatus('synced')
      } else {
        setSyncStatus('error')
      }
    } catch (e) {
      console.error('Cloud save error:', e)
      setSyncStatus('error')
    }
  }

  const saveUserData = (problemId, field, value) => {
    const newData = { ...userData, [problemId]: { ...userData[problemId], [field]: value } }
    setUserData(newData)
    localStorage.setItem('leetcode-user-data', JSON.stringify(newData))
    // Auto-sync to cloud (debounced)
    if (isCloudConfigured) {
      clearTimeout(window.cloudSyncTimeout)
      window.cloudSyncTimeout = setTimeout(() => saveToCloud(newData), 2000)
    }
  }

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const clearCategories = () => setSelectedCategories([])
  const selectAllCategories = () => setSelectedCategories(Object.keys(DSA_CATEGORIES))

  const getCategory = (title) => {
    for (const [cat, probs] of Object.entries(DSA_CATEGORIES)) {
      if (probs.some(p => title.toLowerCase().includes(p.toLowerCase()))) return cat
    }
    return ''
  }

  // Get all unique topics from problems data
  const allTopics = useMemo(() => {
    const topicSet = new Set()
    problems.forEach(p => p.topics?.forEach(t => topicSet.add(t)))
    return Array.from(topicSet).sort()
  }, [problems])

  // Get topic counts for home page "All Topics" view
  const topicCounts = useMemo(() => {
    const counts = {}
    problems.forEach(p => p.topics?.forEach(t => {
      counts[t] = (counts[t] || 0) + 1
    }))
    return counts
  }, [problems])

  const filteredProblems = useMemo(() => {
    let result = [...problems]
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(p => p.title.toLowerCase().includes(s) || p.id.toString().includes(search))
    }
    if (selectedCompany) result = result.filter(p => p.companies.some(c => c.name === selectedCompany))
    if (selectedDifficulty) result = result.filter(p => p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase())
    if (selectedTopic) result = result.filter(p => p.topics?.includes(selectedTopic))

    if (selectedCategories.length > 0) {
      const allCatProbs = selectedCategories.flatMap(cat => DSA_CATEGORIES[cat] || [])
      result = result.filter(p => allCatProbs.some(cp => p.title.toLowerCase().includes(cp.toLowerCase())))
    }

    if (selectedProgress) result = result.filter(p => (userData[p.id]?.progress || 'todo') === selectedProgress)
    return result
  }, [problems, search, selectedCompany, selectedDifficulty, selectedTopic, selectedCategories, selectedProgress, userData])

  const totalPages = Math.ceil(filteredProblems.length / perPage)
  const paginatedProblems = filteredProblems.slice((page - 1) * perPage, page * perPage)

  useEffect(() => {
    setPage(1)
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }, [search, selectedCompany, selectedDifficulty, selectedTopic, selectedCategories, selectedProgress])

  // Scroll to top when view changes or page changes
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }, [currentView, page])

  const solvedCount = Object.values(userData).filter(u => u.progress === 'solved').length
  const attemptedCount = Object.values(userData).filter(u => u.progress === 'attempted').length
  const priorityProblemsTotal = [...new Set(Object.values(DSA_CATEGORIES).flat())].length

  if (loading) return <div className="loading"><div className="spinner"></div></div>

  // LOGIN PAGE - Show if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app login-page">
        <div className="login-container">
          <h1>🎯 LeetCode Tracker</h1>
          <p>Please login to access your tracker</p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            {authError && <div className="login-error">{authError}</div>}

            <button type="submit" className="login-btn">Login</button>
          </form>
        </div>
      </div>
    )
  }

  // HOME PAGE
  if (currentView === 'home') {
    return (
      <div className="app">
        <div className="home-container">
          <div className="home-hero">
            <div className="home-header-row">
              <h1 className="home-title">🎯 LeetCode Tracker</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {isCloudConfigured && syncStatus && (
                  <span className={`sync-status ${syncStatus}`}>
                    {syncStatus === 'syncing' && '🔄 Syncing...'}
                    {syncStatus === 'synced' && '✅ Synced to Cloud'}
                    {syncStatus === 'error' && '❌ Sync Error'}
                  </span>
                )}
                <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
            <p className="home-subtitle">Master DSA with organized practice and tracked progress</p>
          </div>

          <div className="home-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalProblems || 0}</div>
              <div className="stat-label">Total Problems</div>
            </div>
            <div className="stat-card solved">
              <div className="stat-value">{solvedCount}</div>
              <div className="stat-label">Solved</div>
            </div>
            <div className="stat-card attempted">
              <div className="stat-value">{attemptedCount}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card priority">
              <div className="stat-value">{priorityProblemsTotal}</div>
              <div className="stat-label">Priority Problems</div>
            </div>
          </div>

          <div className="home-categories">
            <div className="categories-header">
              <h2>{viewMode === 'priority' ? '📚 Priority Topics' : '🏷️ All Topics'}</h2>
              <div className="view-toggle">
                <button className={`toggle-btn ${viewMode === 'priority' ? 'active' : ''}`} onClick={() => { setViewMode('priority'); setExpandedCategory(null) }}>
                  ⭐ Priority
                </button>
                <button className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`} onClick={() => { setViewMode('all'); setExpandedCategory(null) }}>
                  📋 All Topics
                </button>
              </div>
            </div>
            <p className="categories-hint">
              {viewMode === 'priority'
                ? 'Click to expand and see curated problems, then view in Problems list'
                : 'Click a topic to filter problems by that category'}
            </p>
            <div className="category-grid">
              {viewMode === 'priority' ? (
                Object.entries(DSA_CATEGORIES).map(([cat, probs]) => (
                  <div key={cat} className={`category-card ${expandedCategory === cat ? 'expanded' : ''}`}>
                    <div className="category-header" onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}>
                      <div className="category-name">{cat}</div>
                      <div className="category-count">{probs.length} problems {expandedCategory === cat ? '▲' : '▼'}</div>
                    </div>
                    {expandedCategory === cat && (
                      <div className="category-problems">
                        <ul className="problem-list">
                          {probs.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                        <button className="view-category-btn" onClick={() => { clearFilters(); setSelectedCategories([cat]); setCurrentView('problems') }}>
                          View All in Problems →
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                allTopics.slice(0, 40).map(topic => (
                  <div key={topic} className={`category-card ${expandedCategory === topic ? 'expanded' : ''}`}>
                    <div className="category-header" onClick={() => setExpandedCategory(expandedCategory === topic ? null : topic)}>
                      <div className="category-name">{topic}</div>
                      <div className="category-count">{topicCounts[topic]} problems {expandedCategory === topic ? '▲' : '▼'}</div>
                    </div>
                    {expandedCategory === topic && (
                      <div className="category-problems">
                        <p className="topic-info">Problems tagged with "{topic}"</p>
                        <button className="view-category-btn" onClick={() => { clearFilters(); setSelectedTopic(topic); setCurrentView('problems') }}>
                          View {topicCounts[topic]} Problems →
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="home-actions">
            <button className="primary-btn" onClick={() => { clearFilters(); setCurrentView('problems') }}>
              📝 Browse All Problems
            </button>
            <button className="secondary-btn" onClick={() => { clearFilters(); selectAllCategories(); setCurrentView('problems') }}>
              ⭐ View All Priority Problems
            </button>
          </div>
        </div>
      </div>
    )
  }

  // PROBLEMS VIEW
  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <button className="back-btn" onClick={() => setCurrentView('home')}>← Home</button>
          <h1>🎯 LeetCode Tracker</h1>
        </div>
        <div className="stats">
          <span>Total: <strong>{stats.totalProblems}</strong></span>
          <span>Showing: <strong>{filteredProblems.length}</strong></span>
          <span>Solved: <strong>{solvedCount}</strong></span>
        </div>
      </header>

      <div className="filter-bar">
        <input type="text" className="search-input" placeholder="🔍 Search..." value={search} onChange={(e) => setSearch(e.target.value)} />

        {/* Priority List Dropdown */}
        <div className="priority-dropdown-container" ref={priorityDropdownRef}>
          <button
            className={`priority-btn ${selectedCategories.length > 0 ? 'active' : ''}`}
            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
          >
            📚 Priority List {selectedCategories.length > 0 && `(${selectedCategories.length})`}
          </button>
          {showPriorityDropdown && (
            <div className="priority-dropdown">
              <div className="dropdown-header">
                <span>Select Topics</span>
                <div className="dropdown-actions">
                  <button className="select-all" onClick={selectAllCategories}>All</button>
                  {selectedCategories.length > 0 && (
                    <button className="clear-selection" onClick={clearCategories}>Clear</button>
                  )}
                </div>
              </div>
              {Object.keys(DSA_CATEGORIES).map(cat => (
                <label key={cat} className="dropdown-item">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  <span>{cat}</span>
                  <span className="item-count">{DSA_CATEGORIES[cat].length}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <select className="filter-select" value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
          <option value="">🏢 All Companies</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
          <option value="">🏷️ All Topics</option>
          {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="difficulty-btns">
          {['Easy', 'Medium', 'Hard'].map(d => (
            <button key={d} className={`diff-btn ${d.toLowerCase()} ${selectedDifficulty === d ? 'active' : ''}`}
              onClick={() => setSelectedDifficulty(selectedDifficulty === d ? '' : d)}>{d}</button>
          ))}
        </div>
        <select className="filter-select" value={selectedProgress} onChange={(e) => setSelectedProgress(e.target.value)}>
          <option value="">📊 All</option>
          <option value="todo">To Do</option>
          <option value="attempted">In Progress</option>
          <option value="solved">Completed</option>
        </select>
        {(search || selectedCompany || selectedDifficulty || selectedTopic || selectedCategories.length > 0 || selectedProgress) && (
          <button className="clear-btn" onClick={() => { setSearch(''); setSelectedCompany(''); setSelectedDifficulty(''); setSelectedTopic(''); setSelectedCategories([]); setSelectedProgress('') }}>✕ Clear All</button>
        )}
      </div>

      <div className="problems-container">
        {paginatedProblems.length === 0 ? (
          <div className="no-results">
            <p>No problems found matching your filters.</p>
            <button className="clear-btn" onClick={() => { setSearch(''); setSelectedCompany(''); setSelectedDifficulty(''); setSelectedTopic(''); setSelectedCategories([]); setSelectedProgress('') }}>Clear Filters</button>
          </div>
        ) : (
          paginatedProblems.map(problem => (
            <ProblemRow key={problem.id} problem={problem} userData={userData[problem.id] || {}} saveUserData={saveUserData} getCategory={getCategory} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  )
}

function ProblemRow({ problem, userData, saveUserData, getCategory }) {
  const [solution, setSolution] = useState(userData.solution || '')
  const [language, setLanguage] = useState(userData.language || 'python')
  const category = getCategory(problem.title)

  const handleSaveSolution = (value) => {
    setSolution(value)
    saveUserData(problem.id, 'solution', value)
    // Auto-mark as solved when solution has content
    if (value && value.trim().length > 0 && userData.progress !== 'solved') {
      saveUserData(problem.id, 'progress', 'solved')
    }
  }

  const editorHeight = Math.max(350, Math.min(600, problem.content?.length / 10 || 350))

  return (
    <div className={`problem-row ${userData.progress || ''}`}>
      <div className="problem-meta">
        <div className="problem-header-row">
          <span className="problem-id">#{problem.id}</span>
          <a className="problem-title" href={`https://leetcode.com/problems/${problem.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} target="_blank" rel="noopener noreferrer">
            {problem.title}
          </a>
          <span className={`diff-badge ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
          <select className="progress-select" value={userData.progress || 'todo'}
            onChange={(e) => saveUserData(problem.id, 'progress', e.target.value)}
            style={{ backgroundColor: { todo: '#6b7280', attempted: '#f59e0b', solved: '#10b981' }[userData.progress || 'todo'] }}>
            <option value="todo">To Do</option>
            <option value="attempted">In Progress</option>
            <option value="solved">Completed</option>
          </select>
        </div>
        <div className="tags-row">
          {category && <span className="category-tag">{category}</span>}
          {problem.topics.slice(0, 4).map(t => <span key={t} className="topic-tag">{t}</span>)}
          {problem.companies.slice(0, 4).map(c => <span key={c.name} className="company-tag">{c.name}</span>)}
        </div>
      </div>

      <div className="problem-columns">
        <div className="problem-content-col">
          <div className="col-header">Problem Statement</div>
          <div className="problem-statement" dangerouslySetInnerHTML={{ __html: problem.content }} />
        </div>

        <div className="solution-col">
          <div className="col-header">
            Solution
            <select className="lang-select" value={language} onChange={(e) => { setLanguage(e.target.value); saveUserData(problem.id, 'language', e.target.value) }}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <div className="editor-container" style={{ height: editorHeight }}>
            <Editor
              height="100%"
              language={language}
              value={solution}
              onChange={handleSaveSolution}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: 'on', wordWrap: 'on', scrollBeyondLastLine: false, automaticLayout: true }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
