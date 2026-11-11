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

  const [formUser, setFormUser] = useState(null);
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
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="PeopleDesk home">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>people<span className="brand-accent">desk</span></span>
        </a>
        <div className="topbar-right">
          <span className="workspace-label"><span className="status-dot" /> Workspace</span>
          <div className="profile-chip">
            <span className="profile-avatar">MC</span>
            <span className="profile-name">Monica Chadalavadas</span>
            <span className="profile-chevron" aria-hidden="true">⌄</span>
          </div>
        </div>
      </header>

      <main className="app">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">PEOPLE OPERATIONS <span> / </span> OVERVIEW</p>
            <h1>Your people, <span>in one place.</span></h1>
            <p className="welcome-copy">A clear view of your team and the details that keep things moving.</p>
          </div>
          <button type="button" className="btn btn-primary add-user-button" onClick={() => setFormUser({})}>
            <span className="button-plus" aria-hidden="true">+</span> Add a user
          </button>
        </section>

        <section className="stats-grid" aria-label="User directory summary">
          <article className="stat-card stat-card-primary">
            <div className="stat-icon" aria-hidden="true">♙</div>
            <p className="stat-label">People in directory</p>
            <div className="stat-value-row"><strong>{loading ? "—" : users.length}</strong><span className="stat-trend">team members</span></div>
            <span className="stat-footnote">Across your organization</span>
          </article>
          <article className="stat-card">
            <div className="stat-icon stat-icon-lavender" aria-hidden="true">▦</div>
            <p className="stat-label">Departments</p>
            <div className="stat-value-row"><strong>{loading ? "—" : departmentList.length}</strong><span className="stat-trend">represented</span></div>
            <span className="stat-footnote">Teams in your workspace</span>
          </article>
          <article className="stat-card">
            <div className="stat-icon stat-icon-mint" aria-hidden="true">⌕</div>
            <p className="stat-label">Current view</p>
            <div className="stat-value-row"><strong>{loading ? "—" : filteredAndSorted.length}</strong><span className="stat-trend">people</span></div>
            <span className="stat-footnote">Matching your search and filters</span>
          </article>
        </section>

        {actionError && (
          <div className="banner banner-error" role="alert">
            {actionError}
            <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss error">×</button>
          </div>
        )}

        <section className="directory-card">
          <div className="directory-heading">
            <div>
              <div className="directory-title-row"><h2>Team directory</h2><span className="directory-count">{loading ? "Loading" : `${filteredAndSorted.length} members`}</span></div>
              <p>Manage your people and keep their details up to date.</p>
            </div>
            <span className="directory-kicker"><span className="status-dot" /> All systems operational</span>
          </div>

          <div className="toolbar">
            <div className="search-bar">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                type="text"
                placeholder="Search people, email, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search users"
              />
              {search && (
                <button type="button" className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">×</button>
              )}
            </div>

            <div className="filter-popup-wrapper" ref={filterBoxRef}>
              <button type="button" className="btn btn-secondary filter-button" onClick={filterOpen ? () => setFilterOpen(false) : openFilters} aria-expanded={filterOpen}>
                <span aria-hidden="true">☷</span> Filters {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
              </button>

              {filterOpen && (
                <div className="filter-popup">
                  <div className="filter-popup-title"><strong>Filter people</strong><span>Refine your directory</span></div>
                  <div className="filter-field">
                    <label htmlFor="filter-first-name">First name</label>
                    <input id="filter-first-name" value={filterDraft.firstName} onChange={(e) => setFilterDraft({ ...filterDraft, firstName: e.target.value })} placeholder="e.g. Alex" />
                  </div>
                  <div className="filter-field">
                    <label htmlFor="filter-last-name">Last name</label>
                    <input id="filter-last-name" value={filterDraft.lastName} onChange={(e) => setFilterDraft({ ...filterDraft, lastName: e.target.value })} placeholder="e.g. Sharma" />
                  </div>
                  <div className="filter-field">
                    <label htmlFor="filter-email">Email</label>
                    <input id="filter-email" value={filterDraft.email} onChange={(e) => setFilterDraft({ ...filterDraft, email: e.target.value })} placeholder="e.g. gmail.com" />
                  </div>
                  <div className="filter-field">
                    <label htmlFor="filter-department">Department</label>
                    <select id="filter-department" value={filterDraft.department} onChange={(e) => setFilterDraft({ ...filterDraft, department: e.target.value })}>
                      <option value="">All departments</option>
                      {departmentList.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="filter-actions">
                    <button type="button" className="btn btn-text" onClick={clearFilters}>Clear all</button>
                    <button type="button" className="btn btn-primary" onClick={applyFilters}>Apply filters</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading && <div className="loading-state"><span className="loading-spinner" /> Loading your directory…</div>}
          {!loading && loadError && <div className="banner banner-error">Could not load users: {loadError}</div>}

          {!loading && !loadError && (
            <>
              <div className="table-scroll">
                <UserTable users={currentPageUsers} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} onEdit={setFormUser} onDelete={setDeleteTarget} />
              </div>
              <div className="pagination">
                <div className="pagination-info">Showing <strong>{firstItemNumber}–{lastItemNumber}</strong> of <strong>{filteredAndSorted.length}</strong> people</div>
                <div className="pagination-controls">
                  <button type="button" className="btn btn-secondary page-button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} aria-label="Previous page">←</button>
                  <span className="pagination-page"><strong>{currentPage}</strong> <span>of</span> {totalPages}</span>
                  <button type="button" className="btn btn-secondary page-button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages} aria-label="Next page">→</button>
                </div>
                <div className="pagination-size">
                  <label htmlFor="pageSize">Rows</label>
                  <select id="pageSize" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                    {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </section>

        <footer className="app-footer"><span>© 2026 PeopleDesk</span><span>Made for teams that care about people.</span></footer>
      </main>

      {formUser !== null && (
        <UserModal mode="form" user={formUser.id ? formUser : null} onSubmit={handleSave} onCancel={() => setFormUser(null)} busy={isSaving} />
      )}
      {deleteTarget && (
        <UserModal mode="delete" user={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} busy={isDeleting} />
      )}
    </div>
  );
}
