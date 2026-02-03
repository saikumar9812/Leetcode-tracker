export default function Header({ stats, filteredCount }) {
    return (
        <header className="header">
            <h1>
                <span>🎯</span> LeetCode Tracker
            </h1>

            <div className="stats">
                <div className="stat-item">
                    <span>Total:</span>
                    <span className="stat-value">{stats.totalProblems || 0}</span>
                </div>
                <div className="stat-item">
                    <span>Companies:</span>
                    <span className="stat-value">{stats.totalCompanies || 0}</span>
                </div>
                <div className="stat-item">
                    <span>Showing:</span>
                    <span className="stat-value">{filteredCount}</span>
                </div>
            </div>
        </header>
    )
}
