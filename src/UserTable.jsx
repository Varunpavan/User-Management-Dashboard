const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "email", label: "Email address" },
  { key: "department", label: "Department" },
];

export default function UserTable({ users, sortKey, sortDir, onSort, onEdit, onDelete }) {
  function getSortIcon(key) {
    if (key !== sortKey) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  if (users.length === 0) {
    return <div className="empty-state">No people match your search or filters. Try adjusting your criteria.</div>;
  }

  return (
    <table className="user-table">
      <thead>
        <tr>
          {COLUMNS.map((col) => {
            const iconClass = col.key === sortKey ? "sort-icon" : "sort-icon sort-icon-inactive";
            return (
              <th key={col.key} onClick={() => onSort(col.key)} role="button" aria-label={`Sort by ${col.label}`}>
                {col.label} <span className={iconClass} aria-hidden="true">{getSortIcon(col.key)}</span>
              </th>
            );
          })}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td data-label="ID" className="user-id">#{user.id}</td>
            <td data-label="First name" className="person-cell">
              <span className="person-avatar" aria-hidden="true">{user.firstName.charAt(0)}{user.lastName !== "-" ? user.lastName.charAt(0) : ""}</span>
              <span>{user.firstName}</span>
            </td>
            <td data-label="Last name">{user.lastName}</td>
            <td data-label="Email address">{user.email}</td>
            <td data-label="Department"><span className="department-pill">{user.department}</span></td>
            <td data-label="Actions" className="actions-cell">
              <button type="button" className="btn btn-small" onClick={() => onEdit(user)}>Edit</button>
              <button type="button" className="btn btn-small btn-danger" onClick={() => onDelete(user)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
