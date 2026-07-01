const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "department", label: "Department" },
];

export default function UserTable({ users, sortKey, sortDir, onSort, onEdit, onDelete }) {
  function getSortIcon(key) {
    if (key !== sortKey) {
      return "↕";
    }
    if (sortDir === "asc") {
      return "↑";
    }
    return "↓";
  }

  if (users.length === 0) {
    return <div className="empty-state">No users match your search/filters.</div>;
  }

  return (
    <table className="user-table">
      <thead>
        <tr>
          {COLUMNS.map((col) => {
            const iconClass = col.key === sortKey ? "sort-icon" : "sort-icon sort-icon-inactive";
            return (
              <th key={col.key} onClick={() => onSort(col.key)} role="button">
                {col.label} <span className={iconClass}>{getSortIcon(col.key)}</span>
              </th>
            );
          })}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td data-label="ID">{user.id}</td>
            <td data-label="First Name">{user.firstName}</td>
            <td data-label="Last Name">{user.lastName}</td>
            <td data-label="Email">{user.email}</td>
            <td data-label="Department">{user.department}</td>
            <td data-label="Actions" className="actions-cell">
              <button type="button" className="btn btn-small" onClick={() => onEdit(user)}>
                Edit
              </button>
              <button type="button" className="btn btn-small btn-danger" onClick={() => onDelete(user)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
