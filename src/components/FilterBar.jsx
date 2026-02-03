export default function FilterBar({
    companies,
    topics,
    search,
    setSearch,
    selectedCompany,
    setSelectedCompany,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedTopic,
    setSelectedTopic,
    sortBy,
    setSortBy
}) {
    const difficulties = ['Easy', 'Medium', 'Hard']

    return (
        <div className="filter-bar">
            <div className="filter-group">
                <label className="filter-label">Search</label>
                <input
                    type="text"
                    className="filter-input"
                    placeholder="Problem name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="filter-group">
                <label className="filter-label">Company</label>
                <select
                    className="filter-select"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                >
                    <option value="">All Companies</option>
                    {companies.map(company => (
                        <option key={company} value={company}>{company}</option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">Difficulty</label>
                <div className="difficulty-buttons">
                    {difficulties.map(diff => (
                        <button
                            key={diff}
                            className={`diff-btn ${diff.toLowerCase()} ${selectedDifficulty === diff ? 'active' : ''}`}
                            onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? '' : diff)}
                        >
                            {diff}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-group">
                <label className="filter-label">Topic</label>
                <select
                    className="filter-select"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                >
                    <option value="">All Topics</option>
                    {topics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">Sort By</label>
                <select
                    className="filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="id">Problem ID</option>
                    <option value="title">Title</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="companies">Most Companies</option>
                    <option value="frequency">Frequency</option>
                </select>
            </div>

            {(search || selectedCompany || selectedDifficulty || selectedTopic) && (
                <button
                    className="diff-btn"
                    onClick={() => {
                        setSearch('')
                        setSelectedCompany('')
                        setSelectedDifficulty('')
                        setSelectedTopic('')
                    }}
                    style={{ alignSelf: 'flex-end' }}
                >
                    Clear Filters
                </button>
            )}
        </div>
    )
}
