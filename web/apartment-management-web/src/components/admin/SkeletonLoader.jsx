import './SkeletonLoader.css';

export function SkeletonTable({ rows = 5, columns = 6 }) {
  return (
    <div className="skeleton-table-wrapper" style={{ marginTop: '20px' }}>
      <table className="admin-table skeleton-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="skeleton skeleton-text" style={{ width: colIndex === 0 ? '80%' : '50%' }}></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="admin-card skeleton-card">
      <div className="skeleton skeleton-text" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '100%', marginBottom: '8px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: '8px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
    </div>
  );
}