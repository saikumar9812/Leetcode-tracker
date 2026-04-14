import { useState, useEffect, useMemo, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import './App.css'

// Complete Priority DSA Problems - Exact LeetCode Names
const DSA_CATEGORIES = {
  'Arrays & Hashing': [
    'Two Sum', 'Group Anagrams', 'Top K Frequent Elements', 'Product of Array Except Self',
    'Longest Consecutive Sequence', 'Subarray Sum Equals K', 'Valid Anagram', 'Find the Duplicate Number',
    '3Sum', 'Search a 2D Matrix', 'Search a 2D Matrix II', 'Spiral Matrix', 'Rotate Array',
    'Sort Colors', 'Best Time to Buy and Sell Stock', 'Best Time to Buy and Sell Stock II',
    'Best Time to Buy and Sell Stock III', 'Best Time to Buy and Sell Stock IV',
    'Jump Game', 'Jump Game II', 'Capacity to Ship Packages Within D Days',
    'Maximum Subarray', 'Gas Station', 'Container With Most Water', 'Trapping Rain Water'
  ],
  'Sliding Window': [
    'Longest Substring Without Repeating Characters', 'Minimum Window Substring',
    'Longest Repeating Character Replacement', 'Permutation in String',
    'Find the Longest Substring Containing Vowels in Even Counts', 'Longest Valid Parentheses'
  ],
  'Linked Lists': [
    'Reverse Linked List', 'Linked List Cycle', 'Linked List Cycle II', 'Middle of the Linked List',
    'Merge Two Sorted Lists', 'Add Two Numbers', 'Intersection of Two Linked Lists',
    'Palindrome Linked List', 'Copy List with Random Pointer', 'LRU Cache', 'Reverse Nodes in k-Group'
  ],
  'Stacks & Monotonic': [
    'Valid Parentheses', 'Min Stack', 'Implement Stack using Queues', 'Implement Queue using Stacks',
    'Evaluate Reverse Polish Notation', 'Largest Rectangle in Histogram',
    'Daily Temperatures', 'Remove K Digits'
  ],
  'Trees': [
    'Maximum Depth of Binary Tree', 'Same Tree', 'Symmetric Tree', 'Binary Tree Level Order Traversal',
    'Binary Tree Zigzag Level Order Traversal', 'Binary Tree Right Side View', 'Validate Binary Search Tree',
    'Kth Smallest Element in a BST', 'Lowest Common Ancestor of a Binary Tree',
    'Lowest Common Ancestor of a Binary Search Tree', 'Diameter of Binary Tree', 'Path Sum',
    'Boundary of Binary Tree', 'Convert Sorted Array to Binary Search Tree',
    'Flatten Binary Tree to Linked List', 'Serialize and Deserialize Binary Tree'
  ],
  'Heaps': [
    'Kth Largest Element in an Array', 'Kth Largest Element in a Stream', 'Find Median from Data Stream',
    'Merge k Sorted Lists', 'Reorganize String', 'The K Weakest Rows in a Matrix',
    'Meeting Rooms II', 'Boats to Save People'
  ],
  'Graphs': [
    'Number of Islands', 'Rotting Oranges', 'Word Ladder', 'Course Schedule I & II',
    'Clone Graph', 'Alien Dictionary', 'Redundant Connection', 'Shortest Path in Binary Matrix',
    'Cheapest Flights Within K Stops', 'Network Delay Time (Dijkstra)',
    'Minimum Knight Moves', 'Critical Connections in a Network'
  ],
  'Backtracking': [
    'Permutations', 'Combinations', 'Subsets', 'N-Queens',
    'Word Search', 'Combination Sum', 'Sudoku Solver', 'Palindrome Partitioning',
    'Generate Parentheses', 'Largest Number'
  ],
  'DP Fundamentals': [
    'Partition Equal Subset Sum', 'Coin Change', 'House Robber', 'House Robber II',
    'Partition Equal Subset Sum', 'Longest Palindromic Substring', 'Longest Common Subsequence',
    'Edit Distance', 'Longest Increasing Subsequence', 'Word Break', 'Super Egg Drop',
    'Decode Ways', 'Interleaving String', 'Race Car'
  ],
  'Advanced Strings': [
    'Encode and Decode Strings', 'Group Shifted Strings', 'Substring with Concatenation of All Words',
    'Palindromic Substrings', 'Longest Duplicate Substring'
  ],
  'Intervals & Greedy': [
    'Merge Intervals', 'Non-overlapping Intervals', 'Meeting Rooms II',
    'Two Best Non-Overlapping Events', 'Task Scheduler', 'Jump Game', 'Gas Station'
  ],
  'Graph Variants': [
    'Pacific Atlantic Water Flow', 'Surrounded Regions', 'Graph Valid Tree',
    'Critical Connections in a Network', 'Number of Provinces', 'Word Ladder II', 'Shortest Bridge',
    'Min Cost to Connect All Points'
  ],
  'Heap Variants': [
    'Minimum Cost to Hire K Workers', 'IPO', 'Kth Smallest Element in a Sorted Matrix',
    'Find K Pairs with Smallest Sums'
  ],
}

// Premium or custom-named problems → override URL (NeetCode for premium)
const PROBLEM_URL_OVERRIDES = {
  'Alien Dictionary': 'https://neetcode.io/problems/foreign-dictionary',
  'Minimum Knight Moves': 'https://neetcode.io/problems/minimum-knight-moves',
  'Course Schedule I & II': 'https://leetcode.com/problems/course-schedule/',
  'Network Delay Time (Dijkstra)': 'https://leetcode.com/problems/network-delay-time/',
}

const getCategory = (title) => {
  for (const [cat, probs] of Object.entries(DSA_CATEGORIES)) {
    if (probs.some(p => title.toLowerCase().includes(p.toLowerCase()))) return cat
  }
  return ''
}

// ─── Shared sync bar ────────────────────────────────────────────────────────
function SyncBar({ syncStatus, isCloudConfigured, forceReloadFromCloud, handleLogout }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {isCloudConfigured && syncStatus && (
        <span className={`sync-status ${syncStatus}`}>
          {syncStatus === 'syncing' && '🔄 Syncing...'}
          {syncStatus === 'synced' && '✅ Synced'}
          {syncStatus === 'error' && '❌ Error'}
        </span>
      )}
      {isCloudConfigured && (
        <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={forceReloadFromCloud} title="Force reload from cloud">
          🔄 Reload
        </button>
      )}
      <button className="secondary-btn" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

// ─── Home page ───────────────────────────────────────────────────────────────
function HomePage({ problems, userData, stats, solvedCount, attemptedCount, priorityProblemsTotal, allTopics, topicCounts, syncStatus, isCloudConfigured, forceReloadFromCloud, handleLogout, initialViewMode, priorityCategories, savePriorityCats }) {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [homeSearch, setHomeSearch] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [renamingCat, setRenamingCat] = useState(null)   // { old, value }
  const [addingTo, setAddingTo] = useState(null)          // { cat, value }
  const [newCatInput, setNewCatInput] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = homeSearch.trim()
    navigate(q ? `/problems?search=${encodeURIComponent(q)}` : '/problems')
  }

  // ── Priority edit helpers ──
  const deleteProblem = (cat, prob) => {
    const updated = { ...priorityCategories, [cat]: priorityCategories[cat].filter(p => p !== prob) }
    savePriorityCats(updated)
  }
  const addProblem = (cat, prob) => {
    const trimmed = prob.trim()
    if (!trimmed) return
    const updated = { ...priorityCategories, [cat]: [...priorityCategories[cat], trimmed] }
    savePriorityCats(updated)
    setAddingTo(null)
  }
  const deleteCategory = (cat) => {
    const updated = { ...priorityCategories }
    delete updated[cat]
    savePriorityCats(updated)
    if (expandedCategory === cat) setExpandedCategory(null)
  }
  const renameCategory = (oldName, newName) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) { setRenamingCat(null); return }
    const entries = Object.entries(priorityCategories).map(([k, v]) => [k === oldName ? trimmed : k, v])
    savePriorityCats(Object.fromEntries(entries))
    if (expandedCategory === oldName) setExpandedCategory(trimmed)
    setRenamingCat(null)
  }
  const addCategory = (name) => {
    const trimmed = name.trim()
    if (!trimmed || priorityCategories[trimmed]) return
    savePriorityCats({ ...priorityCategories, [trimmed]: [] })
    setNewCatInput('')
    setShowNewCat(false)
  }

  return (
    <div className="app">
      <div className="home-container">
        <div className="home-hero">
          <div className="home-header-row">
            <h1 className="home-title">🎯 LeetCode Tracker</h1>
            <SyncBar syncStatus={syncStatus} isCloudConfigured={isCloudConfigured} forceReloadFromCloud={forceReloadFromCloud} handleLogout={handleLogout} />
          </div>
          <p className="home-subtitle">Master DSA with organized practice and tracked progress</p>
          <form className="home-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="home-search-input"
              placeholder="🔍 Search problems by name or number..."
              value={homeSearch}
              onChange={(e) => setHomeSearch(e.target.value)}
            />
            <button type="submit" className="home-search-btn">Search</button>
          </form>
        </div>

        <div className="home-stats">
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/problems')}>
            <div className="stat-value">{stats.totalProblems || 0}</div>
            <div className="stat-label">Total Problems</div>
          </div>
          <div className="stat-card solved" style={{ cursor: 'pointer' }} onClick={() => navigate('/problems?progress=solved')}>
            <div className="stat-value">{solvedCount}</div>
            <div className="stat-label">Solved</div>
          </div>
          <div className="stat-card attempted" style={{ cursor: 'pointer' }} onClick={() => navigate('/problems?progress=attempted')}>
            <div className="stat-value">{attemptedCount}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card priority" style={{ cursor: 'pointer' }} onClick={() => navigate(`/problems?categories=${encodeURIComponent(Object.keys(DSA_CATEGORIES).join(','))}`)}>
            <div className="stat-value">{priorityProblemsTotal}</div>
            <div className="stat-label">Priority Problems</div>
          </div>
        </div>

        <div className="home-categories">
          <div className="categories-header">
            <h2>{viewMode === 'priority' ? '📚 Priority Topics' : '🏷️ All Topics'}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {viewMode === 'priority' && (
                <button
                  className={`secondary-btn ${isEditing ? 'active' : ''}`}
                  style={{ padding: '5px 12px', fontSize: '12px', background: isEditing ? 'var(--accent)' : '' }}
                  onClick={() => { setIsEditing(!isEditing); setRenamingCat(null); setAddingTo(null); setShowNewCat(false) }}
                >
                  {isEditing ? '✓ Done' : '✏️ Edit'}
                </button>
              )}
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${viewMode === 'priority' ? 'active' : ''}`}
                  onClick={() => { setViewMode('priority'); setExpandedCategory(null); setIsEditing(false); navigate('/priority') }}
                >⭐ Priority</button>
                <button
                  className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                  onClick={() => { setViewMode('all'); setExpandedCategory(null); setIsEditing(false); navigate('/topics') }}
                >📋 All Topics</button>
              </div>
            </div>
          </div>
          <p className="categories-hint">
            {viewMode === 'priority'
              ? isEditing ? 'Edit categories and problems — changes save to cloud automatically' : 'Click to expand and see curated problems, then view in Problems list'
              : 'Click a topic to filter problems by that category'}
          </p>
          <div className="category-grid">
            {viewMode === 'priority' ? (
              <>
                {Object.entries(priorityCategories).map(([cat, probs]) => (
                  <div key={cat} className={`category-card ${expandedCategory === cat ? 'expanded' : ''}`}>
                    <div className="category-header" onClick={() => !isEditing && setExpandedCategory(expandedCategory === cat ? null : cat)}>
                      {isEditing && renamingCat?.old === cat ? (
                        <input
                          className="edit-inline-input"
                          value={renamingCat.value}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                          onChange={e => setRenamingCat({ old: cat, value: e.target.value })}
                          onBlur={() => renameCategory(cat, renamingCat.value)}
                          onKeyDown={e => { if (e.key === 'Enter') renameCategory(cat, renamingCat.value); if (e.key === 'Escape') setRenamingCat(null) }}
                        />
                      ) : (
                        <div className="category-name"
                          onClick={e => { if (isEditing) { e.stopPropagation(); setRenamingCat({ old: cat, value: cat }) } }}
                          style={isEditing ? { cursor: 'text', textDecoration: 'underline dotted' } : {}}
                        >{cat}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!isEditing && <div className="category-count">{probs.length} problems {expandedCategory === cat ? '▲' : '▼'}</div>}
                        {isEditing && (
                          <button className="edit-del-btn" title="Delete category"
                            onClick={e => { e.stopPropagation(); deleteCategory(cat) }}>✕</button>
                        )}
                      </div>
                    </div>
                    {(expandedCategory === cat || isEditing) && (
                      <div className="category-problems">
                        <ul className="problem-list">
                          {probs.map((p, i) => {
                            const matchingProblem = problems.find(prob =>
                              prob.title.toLowerCase().includes(p.toLowerCase()) ||
                              p.toLowerCase().includes(prob.title.toLowerCase())
                            )
                            const isSolved = matchingProblem && userData[matchingProblem.id]?.progress === 'solved'
                            return (
                              <li key={i} className={isSolved ? 'solved' : ''}
                                style={{ cursor: isEditing ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                onClick={() => { if (isEditing) return; if (PROBLEM_URL_OVERRIDES[p]) { window.open(PROBLEM_URL_OVERRIDES[p], '_blank', 'noopener,noreferrer') } else { navigate(`/problems?search=${encodeURIComponent(p)}`) } }}>
                                <span>{p}</span>
                                {isEditing && (
                                  <button className="edit-del-btn" style={{ flexShrink: 0 }}
                                    onClick={e => { e.stopPropagation(); deleteProblem(cat, p) }}>✕</button>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                        {isEditing && (
                          addingTo?.cat === cat ? (
                            <div className="edit-add-row">
                              <input
                                className="edit-inline-input"
                                placeholder="Problem name..."
                                value={addingTo.value}
                                autoFocus
                                onChange={e => setAddingTo({ cat, value: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') addProblem(cat, addingTo.value); if (e.key === 'Escape') setAddingTo(null) }}
                              />
                              <button className="edit-add-btn" onClick={() => addProblem(cat, addingTo.value)}>Add</button>
                              <button className="edit-del-btn" onClick={() => setAddingTo(null)}>✕</button>
                            </div>
                          ) : (
                            <button className="edit-add-problem-btn" onClick={() => setAddingTo({ cat, value: '' })}>＋ Add problem</button>
                          )
                        )}
                        {!isEditing && (
                          <button className="view-category-btn" onClick={() => navigate(`/problems?categories=${encodeURIComponent(cat)}`)}>
                            View All in Problems →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="category-card edit-new-category">
                    {showNewCat ? (
                      <div className="edit-add-row" style={{ padding: '12px' }}>
                        <input
                          className="edit-inline-input"
                          placeholder="Category name..."
                          value={newCatInput}
                          autoFocus
                          onChange={e => setNewCatInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addCategory(newCatInput); if (e.key === 'Escape') { setShowNewCat(false); setNewCatInput('') } }}
                        />
                        <button className="edit-add-btn" onClick={() => addCategory(newCatInput)}>Add</button>
                        <button className="edit-del-btn" onClick={() => { setShowNewCat(false); setNewCatInput('') }}>✕</button>
                      </div>
                    ) : (
                      <div className="category-header" style={{ cursor: 'pointer' }} onClick={() => setShowNewCat(true)}>
                        <div className="category-name" style={{ color: 'var(--accent)' }}>＋ New Category</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              allTopics.slice(0, 40).map(topic => (
                <div key={topic} className="category-card" style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/problems?topic=${encodeURIComponent(topic)}`)}>
                  <div className="category-header">
                    <div className="category-name">{topic}</div>
                    <div className="category-count">{topicCounts[topic]} problems →</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="home-actions">
          <button className="primary-btn" onClick={() => navigate('/problems')}>
            📝 Browse All Problems
          </button>
          <button className="secondary-btn" onClick={() => navigate(`/problems?categories=${encodeURIComponent(Object.keys(priorityCategories).join(','))}`)}>
            ⭐ View All Priority Problems
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Problems page ───────────────────────────────────────────────────────────
function ProblemsPage({ problems, companies, allTopics, userData, saveUserData, stats, solvedCount, syncStatus, isCloudConfigured, forceReloadFromCloud, handleLogout, priorityCategories }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const priorityDropdownRef = useRef(null)

  // Filter state lives in the URL
  const search = searchParams.get('search') || ''
  const selectedCompany = searchParams.get('company') || ''
  const selectedDifficulty = searchParams.get('difficulty') || ''
  const selectedTopic = searchParams.get('topic') || ''
  const selectedCategories = searchParams.get('categories') ? searchParams.get('categories').split(',').filter(Boolean) : []
  const selectedProgress = searchParams.get('progress') || ''

  const setParam = (key, value) => {
    setPage(1)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  const toggleCategory = (cat) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat]
    setParam('categories', next.join(','))
  }

  const clearFilters = () => { setPage(1); setSearchParams({}, { replace: true }) }

  useEffect(() => {
    function handleClickOutside(e) {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(e.target))
        setShowPriorityDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => window.scrollTo(0, 0))
  }, [search, selectedCompany, selectedDifficulty, selectedTopic, selectedCategories.join(','), selectedProgress])

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
      const allCatProbs = selectedCategories.flatMap(cat => (priorityCategories || DSA_CATEGORIES)[cat] || [])
      result = result.filter(p => allCatProbs.some(cp => p.title.toLowerCase().includes(cp.toLowerCase())))
    }
    if (selectedProgress) result = result.filter(p => (userData[p.id]?.progress || 'todo') === selectedProgress)
    return result
  }, [problems, search, selectedCompany, selectedDifficulty, selectedTopic, selectedCategories.join(','), selectedProgress, userData])

  const hasFilters = search || selectedCompany || selectedDifficulty || selectedTopic || selectedCategories.length > 0 || selectedProgress

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/priority')}>← Home</button>
          <h1>🎯 LeetCode Tracker</h1>
        </div>
        <div className="stats">
          <span>Total: <strong>{stats.totalProblems}</strong></span>
          <span>Showing: <strong>{filteredProblems.length}</strong></span>
          <span>Solved: <strong>{solvedCount}</strong></span>
        </div>
        <SyncBar syncStatus={syncStatus} isCloudConfigured={isCloudConfigured} forceReloadFromCloud={forceReloadFromCloud} handleLogout={handleLogout} />
      </header>

      <div className="filter-bar">
        <input type="text" className="search-input" placeholder="🔍 Search..." value={search} onChange={(e) => setParam('search', e.target.value)} />

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
                  <button className="select-all" onClick={() => setParam('categories', Object.keys(priorityCategories || DSA_CATEGORIES).join(','))}>All</button>
                  {selectedCategories.length > 0 && (
                    <button className="clear-selection" onClick={() => setParam('categories', '')}>Clear</button>
                  )}
                </div>
              </div>
              {Object.keys(priorityCategories || DSA_CATEGORIES).map(cat => (
                <label key={cat} className="dropdown-item">
                  <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} />
                  <span>{cat}</span>
                  <span className="item-count">{(priorityCategories || DSA_CATEGORIES)[cat].length}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <select className="filter-select" value={selectedCompany} onChange={(e) => setParam('company', e.target.value)}>
          <option value="">🏢 All Companies</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={selectedTopic} onChange={(e) => setParam('topic', e.target.value)}>
          <option value="">🏷️ All Topics</option>
          {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="difficulty-btns">
          {['Easy', 'Medium', 'Hard'].map(d => (
            <button key={d}
              className={`diff-btn ${d.toLowerCase()} ${selectedDifficulty === d ? 'active' : ''}`}
              onClick={() => setParam('difficulty', selectedDifficulty === d ? '' : d)}
            >{d}</button>
          ))}
        </div>
        <select className="filter-select" value={selectedProgress} onChange={(e) => setParam('progress', e.target.value)}>
          <option value="">📊 All</option>
          <option value="todo">To Do</option>
          <option value="attempted">In Progress</option>
          <option value="solved">Completed</option>
        </select>
        {hasFilters && <button className="clear-btn" onClick={clearFilters}>✕ Clear All</button>}
      </div>

      <div className="problems-container">
        {filteredProblems.length === 0 ? (
          <div className="no-results">
            <p>No problems found matching your filters.</p>
            <button className="clear-btn" onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          filteredProblems.map(problem => (
            <ProblemRow key={problem.id} problem={problem} userData={userData[problem.id] || {}} saveUserData={saveUserData} getCategory={getCategory} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Problem row ─────────────────────────────────────────────────────────────
function ProblemRow({ problem, userData, saveUserData, getCategory }) {
  const [solution, setSolution] = useState(userData.solution || '')
  const [language, setLanguage] = useState(userData.language || 'python')
  const category = getCategory(problem.title)

  const handleSaveSolution = (value) => {
    let cleanValue = value || ''
    if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) cleanValue = cleanValue.slice(1, -1)
    cleanValue = cleanValue.replace(/""/g, '"')
    setSolution(cleanValue)
    saveUserData(problem.id, 'solution', cleanValue)
    if (cleanValue && cleanValue.trim().length > 0 && userData.progress !== 'solved') {
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
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                scrollbar: { alwaysConsumeMouseWheel: false }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Root app ────────────────────────────────────────────────────────────────
function App() {
  const AUTH_HASH = "c0c4f90164bc7f8f84c86cda19c39b6fb337d6007418e89f2ac357bb5e2aa800"
  const ALLOWED_USER = "saikumar98125"

  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('leetcode-auth') === 'true')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

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
    if (cleanUsername !== ALLOWED_USER.toLowerCase()) { setAuthError('Invalid username'); return }
    try {
      const inputHash = await hashPassword(cleanPassword)
      if (inputHash === AUTH_HASH) {
        setIsAuthenticated(true)
        localStorage.setItem('leetcode-auth', 'true')
      } else {
        setAuthError('Invalid password')
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

  const [syncStatus, setSyncStatus] = useState('')
  const [problems, setProblems] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [userData, setUserData] = useState({})
  const [priorityCategories, setPriorityCategories] = useState(DSA_CATEGORIES)

  const firebaseModule = useRef(null)
  const unsubscribeRef = useRef(null)
  const userDataRef = useRef({})

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

    const initFirebase = async () => {
      try {
        const fb = await import('./firebase.js')
        firebaseModule.current = fb
        if (fb.isFirebaseConfigured) {
          setSyncStatus('syncing')
          unsubscribeRef.current = fb.subscribeToUserData(ALLOWED_USER, (data) => {
            userDataRef.current = data
            setUserData(data)
            setSyncStatus('synced')
          })
          const savedCats = await fb.loadPriorityCategories(ALLOWED_USER)
          if (savedCats) setPriorityCategories(savedCats)
        }
      } catch (err) {
        console.error('Firebase init error:', err)
        setSyncStatus('error')
      }
    }
    initFirebase()
    return () => { if (unsubscribeRef.current) unsubscribeRef.current() }
  }, [])

  const saveUserData = (problemId, field, value) => {
    setUserData(prev => {
      const updated = {
        ...prev,
        [problemId]: { ...prev[problemId], [field]: value, updatedAt: Date.now() }
      }
      userDataRef.current = updated
      return updated
    })
    clearTimeout(window.firebaseSyncTimeout)
    window.firebaseSyncTimeout = setTimeout(async () => {
      if (firebaseModule.current?.isFirebaseConfigured) {
        setSyncStatus('syncing')
        const success = await firebaseModule.current.saveUserDataToFirebase(ALLOWED_USER, userDataRef.current)
        setSyncStatus(success ? 'synced' : 'error')
      }
    }, 500)
  }

  const savePriorityCats = async (newCats) => {
    setPriorityCategories(newCats)
    if (firebaseModule.current?.isFirebaseConfigured) {
      await firebaseModule.current.savePriorityCategories(ALLOWED_USER, newCats)
    }
  }

  const forceReloadFromCloud = async () => {
    if (!firebaseModule.current?.isFirebaseConfigured) return
    try {
      setSyncStatus('syncing')
      const data = await firebaseModule.current.loadUserDataOnce(ALLOWED_USER)
      userDataRef.current = data
      setUserData(data)
      setSyncStatus('synced')
    } catch (err) {
      console.error('Firebase reload error:', err)
      setSyncStatus('error')
    }
  }

  const allTopics = useMemo(() => {
    const topicSet = new Set()
    problems.forEach(p => p.topics?.forEach(t => topicSet.add(t)))
    return Array.from(topicSet).sort()
  }, [problems])

  const topicCounts = useMemo(() => {
    const counts = {}
    problems.forEach(p => p.topics?.forEach(t => { counts[t] = (counts[t] || 0) + 1 }))
    return counts
  }, [problems])

  const solvedCount = Object.values(userData).filter(u => u.progress === 'solved').length
  const attemptedCount = Object.values(userData).filter(u => u.progress === 'attempted').length
  const priorityProblemsTotal = [...new Set(Object.values(DSA_CATEGORIES).flat())].length
  const isCloudConfigured = firebaseModule.current?.isFirebaseConfigured || false

  if (loading) return <div className="loading"><div className="spinner"></div></div>

  if (!isAuthenticated) {
    return (
      <div className="app login-page">
        <div className="login-container">
          <h1>🎯 LeetCode Tracker</h1>
          <p>Please login to access your tracker</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" required />
            </div>
            {authError && <div className="login-error">{authError}</div>}
            <button type="submit" className="login-btn">Login</button>
          </form>
        </div>
      </div>
    )
  }

  const sharedProps = {
    problems, companies, allTopics, topicCounts,
    userData, saveUserData,
    priorityCategories, savePriorityCats,
    stats, solvedCount, attemptedCount, priorityProblemsTotal,
    syncStatus, isCloudConfigured, forceReloadFromCloud, handleLogout
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/priority" replace />} />
      <Route path="/priority" element={<HomePage {...sharedProps} initialViewMode="priority" />} />
      <Route path="/topics" element={<HomePage {...sharedProps} initialViewMode="all" />} />
      <Route path="/problems" element={<ProblemsPage {...sharedProps} />} />
      <Route path="*" element={<Navigate to="/priority" replace />} />
    </Routes>
  )
}

export default App
