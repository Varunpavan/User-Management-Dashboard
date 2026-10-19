import { useState, useEffect, useMemo, useRef } from "react";
import UserTable from "./UserTable";
import UserModal from "./UserModal";
import "./App.css";

const API_URL = "https://jsonplaceholder.typicode.com";
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const EMPTY_FILTERS = { firstName: "", lastName: "", email: "", department: "" };

function formatUser(apiUser) {
  const nameParts = apiUser.name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: apiUser.id,
    firstName: firstName ? firstName : apiUser.name,
    lastName: lastName ? lastName : "-",
    email: apiUser.email,
    department: apiUser.company && apiUser.company.name ? apiUser.company.name : "Unassigned",
  };
}

function prepareForApi(user) {
  return {
    name: user.firstName + " " + user.lastName,
    email: user.email,
    company: { name: user.department },
  };
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    fetch(API_URL + "/users")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Request failed: " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data.map(formatUser));
      })
      .catch((err) => {
        setLoadError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterDraft, setFilterDraft] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBoxRef = useRef(null);

  // close the filter popup if you click anywhere else on the page
  useEffect(() => {
    function handleOutsideClick(e) {
      if (filterBoxRef.current && !filterBoxRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [filterOpen]);

  function openFilters() {
    setFilterDraft(filters);
    setFilterOpen(true);
  }

  function applyFilters() {
    setFilters(filterDraft);
    setFilterOpen(false);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setFilterDraft(EMPTY_FILTERS);
    setFilterOpen(false);
  }

  let activeFilterCount = 0;
  for (const key in filters) {
    if (filters[key]) activeFilterCount++;
  }

  const departmentList = useMemo(() => {
    const names = users.map((u) => u.department);
    const unique = [...new Set(names)];
    unique.sort();
    return unique;
  }, [users]);

  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // this runs the search box, the filter popup, and the sort together.
  // has to happen before pagination or the search would only look at
  // whatever page you're already on
  const filteredAndSorted = useMemo(() => {
    let result = users;
    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((u) => {
        return (
          u.firstName.toLowerCase().includes(searchText) ||
          u.lastName.toLowerCase().includes(searchText) ||
          u.email.toLowerCase().includes(searchText) ||
          u.department.toLowerCase().includes(searchText)
        );
      });
    }

    if (filters.firstName) {
      result = result.filter((u) => u.firstName.toLowerCase().includes(filters.firstName.toLowerCase()));
    }
    if (filters.lastName) {
      result = result.filter((u) => u.lastName.toLowerCase().includes(filters.lastName.toLowerCase()));
    }
    if (filters.email) {
      result = result.filter((u) => u.email.toLowerCase().includes(filters.email.toLowerCase()));
    }
    if (filters.department) {
      result = result.filter((u) => u.department === filters.department);
    }

    const sorted = [...result].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [users, search, filters, sortKey, sortDir]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [search, filters, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const currentPage = page > totalPages ? totalPages : page;

  const pageStart = (currentPage - 1) * pageSize;
  const currentPageUsers = filteredAndSorted.slice(pageStart, pageStart + pageSize);

  const firstItemNumber = filteredAndSorted.length === 0 ? 0 : pageStart + 1;
  const lastItemNumber = Math.min(currentPage * pageSize, filteredAndSorted.length);

  const [formUser, setFormUser] = useState(null); // null = modal closed, {} = adding, {...} = editing
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(values) {
    setIsSaving(true);
    setActionError(null);

    try {
      if (formUser && formUser.id) {
        const res = await fetch(API_URL + "/users/" + formUser.id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prepareForApi(values)),
        });
        if (!res.ok) throw new Error("Request failed: " + res.status);

        const updatedUsers = users.map((u) => {
          if (u.id === formUser.id) {
            return { ...u, ...values };
          }
          return u;
        });
        setUsers(updatedUsers);
      } else {
        const res = await fetch(API_URL + "/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prepareForApi(values)),
        });
        if (!res.ok) throw new Error("Request failed: " + res.status);
        const created = await res.json();

        const newUser = { ...values, id: created.id ? created.id : Date.now() };
        setUsers([newUser, ...users]);
      }
      setFormUser(null);
    } catch (err) {
      setActionError(err.message ? err.message : "Failed to save user.");
    }

    setIsSaving(false);
  }

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleDelete() {
    setIsDeleting(true);
    setActionError(null);

    fetch(API_URL + "/users/" + deleteTarget.id, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed: " + res.status);
        setUsers(users.filter((u) => u.id !== deleteTarget.id));
        setDeleteTarget(null);
      })
      .catch((err) => {
        setActionError(err.message ? err.message : "Failed to delete user.");
      })
      .finally(() => {
        setIsDeleting(false);
      });
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>User Management Dashboard</h1>
        <div>
          <h2> Hello Ms. Monica Chadalavada </h2>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setFormUser({})}>
          + Add User
        </button>
      </header>

      <div className="toolbar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              ×
            </button>
          )}
        </div>

        <div className="filter-popup-wrapper" ref={filterBoxRef}>
          <button type="button" className="btn btn-secondary" onClick={openFilters}>
            Filter {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>

          {filterOpen && (
            <div className="filter-popup">
              <div className="filter-field">
                <label>First Name</label>
                <input
                  value={filterDraft.firstName}
                  onChange={(e) => setFilterDraft({ ...filterDraft, firstName: e.target.value })}
                  placeholder="e.g. Alex"
                />
              </div>
              <div className="filter-field">
                <label>Last Name</label>
                <input
                  value={filterDraft.lastName}
                  onChange={(e) => setFilterDraft({ ...filterDraft, lastName: e.target.value })}
                  placeholder="e.g. Sharma"
                />
              </div>
              <div className="filter-field">
                <label>Email</label>
                <input
                  value={filterDraft.email}
                  onChange={(e) => setFilterDraft({ ...filterDraft, email: e.target.value })}
                  placeholder="e.g. gmail.com"
                />
              </div>
              <div className="filter-field">
                <label>Department</label>
                <select
                  value={filterDraft.department}
                  onChange={(e) => setFilterDraft({ ...filterDraft, department: e.target.value })}
                >
                  <option value="">All departments</option>
                  {departmentList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="filter-actions">
                <button type="button" className="btn btn-text" onClick={clearFilters}>Clear</button>
                <button type="button" className="btn btn-primary" onClick={applyFilters}>Apply</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <div className="banner banner-error">
          {actionError}
          <button type="button" onClick={() => setActionError(null)}>×</button>
        </div>
      )}

      {loading && <div className="loading-state">Loading users…</div>}

      {!loading && loadError && (
        <div className="banner banner-error">Failed to load users: {loadError}</div>
      )}

      {!loading && !loadError && (
        <>
          <UserTable
            users={currentPageUsers}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onEdit={setFormUser}
            onDelete={setDeleteTarget}
          />

          <div className="pagination">
            <div className="pagination-info">
              Showing {firstItemNumber}-{lastItemNumber} of {filteredAndSorted.length}
            </div>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Prev
              </button>
              <span className="pagination-page">Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
            <div className="pagination-size">
              <label htmlFor="pageSize">Rows per page</label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {formUser !== null && (
        <UserModal
          mode="form"
          user={formUser.id ? formUser : null}
          onSubmit={handleSave}
          onCancel={() => setFormUser(null)}
          busy={isSaving}
        />
      )}

      {deleteTarget && (
        <UserModal
          mode="delete"
          user={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          busy={isDeleting}
        />
      )}
    </div>
  );
}
