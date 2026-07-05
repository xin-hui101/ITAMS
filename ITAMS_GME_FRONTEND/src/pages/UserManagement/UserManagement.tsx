import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserListItem, UserQuery, Role } from '../../types/user.types';
import { getUsers, deleteUser, getRoles } from '../../services/userService';
import UserModal from './components/UserModal';
import UserDetailModal from './components/UserDetailModal';
import DeleteModal from '../../components/DeleteModal/DeleteModal';
import Toast from '../../components/Toast/Toast';
import './UserManagement.css';
import { usePermission } from '../../hooks/usePermission';

type SortField = 'fullName' | 'username' | 'createdAt';
type SortOrder = 'asc' | 'desc';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  // ── State ───────────────────────────────────────────────────
  const [users, setUsers]           = useState<UserListItem[]>([]);
  const [roles, setRoles]           = useState<Role[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 10;

  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modal state
  const [showModal, setShowModal]             = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId]   = useState<number | null>(null);
  const [editUserId, setEditUserId]           = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<UserListItem | null>(null);

// Toast state — message + type
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

const { hasPermission } = usePermission();
  // ── Fetch ───────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query: UserQuery = {
        search:   search || undefined,
        roleId:   roleFilter ? Number(roleFilter) : undefined,
        isActive: statusFilter === '' ? undefined : statusFilter === 'true',
        page,
        pageSize: PAGE_SIZE,
      };
      const result = await getUsers(query);
      setUsers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => { getRoles().then(setRoles).catch(() => {}); }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

  // ── Sort ────────────────────────────────────────────────────
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    const valA = a[sortField] as string;
    const valB = b[sortField] as string;
    return sortOrder === 'asc'
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  function SortIcon({ field }: { field: SortField }) {
    const active = sortField === field;
    return (
      <div className={`um-sort-icon ${active ? sortOrder : ''}`}>
        <span className="up" />
        <span className="down" />
      </div>
    );
  }

  // ── Delete ──────────────────────────────────────────────────
  function handleDeleteClick(user: UserListItem) {
    // Prevent deleting yourself
    if (user.id === currentUser?.id) {
      setToast({ message: 'You cannot delete your own account.', type: 'error' });
      return;
    }
    setDeleteTarget(user);
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteUser(deleteTarget.id);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setToast({ message: 'User deleted successfully.', type: 'success' });
    fetchUsers();
  }

  // ── Modal Handlers ───────────────────────────────────────────
  function handleAddUser() {
    setEditUserId(null);
    setShowModal(true);
  }

  function handleEditUser(id: number) {
    setEditUserId(id);
    setShowModal(true);
  }

  function handleViewUser(id: number) {
    setSelectedUserId(id);
    setShowDetailModal(true);
  }

  function handleModalClose(refreshed?: boolean) {
    setShowModal(false);
    setEditUserId(null);
    if (refreshed) {
    fetchUsers();
    // editUserId has value = edit, null = create
    if (editUserId) {
      setToast({ message: 'User updated successfully.', type: 'success' });
    } else {
      setToast({ message: 'User created successfully.', type: 'success' });
    }
    }
    setEditUserId(null);
  }

  // ── Pagination ───────────────────────────────────────────────
  const startRecord = (page - 1) * PAGE_SIZE + 1;
  const endRecord   = Math.min(page * PAGE_SIZE, total);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="um-page">

      {/* Toast */}
      {toast && (
        <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
        />
    )
     }
{/* Toolbar */}
<div className="um-toolbar">
  {/* Total Users */}
  <div className="um-total">
    <i className="ti ti-users" />
    <span>Total: <strong>{total}</strong></span>
  </div>

  <div className="um-search-wrap">
    <i className="ti ti-search um-search-icon" aria-hidden="true" />
    <input
      className="um-search-input"
      placeholder="Search by name, email or username..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
  </div>
  <select
    className="um-filter-select"
    value={roleFilter}
    onChange={e => setRoleFilter(e.target.value)}
  >
    <option value="">All Roles</option>
    {roles.map(r => (
      <option key={r.id} value={r.id}>{r.name}</option>
    ))}
  </select>
  <select
    className="um-filter-select"
    value={statusFilter}
    onChange={e => setStatusFilter(e.target.value)}
  >
    <option value="">All Status</option>
    <option value="true">Active</option>
    <option value="false">Inactive</option>
  </select>
</div>

      {/* Table */}
      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('fullName')}>
                <div className="um-th-inner">User <SortIcon field="fullName" /></div>
              </th>
              <th className="sortable" onClick={() => handleSort('username')}>
                <div className="um-th-inner">Username <SortIcon field="username" /></div>
              </th>
              <th>Role</th>
              <th>Status</th>
              <th className="sortable" onClick={() => handleSort('createdAt')}>
                <div className="um-th-inner">Created <SortIcon field="createdAt" /></div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="um-loading">Loading users...</div></td></tr>
            ) : error ? (
              <tr><td colSpan={6}><div className="um-error">{error}</div></td></tr>
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="um-empty">
                    <div className="um-empty-icon">👤</div>
                    <div className="um-empty-text">No users found</div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="um-user-cell">
                      <div className="um-avatar">{getInitials(user.fullName)}</div>
                      <div>
                        <div className="um-user-name">{user.fullName}</div>
                        <div className="um-user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.username}</td>
                  <td><span className="um-badge um-badge-role">{user.role}</span></td>
                  <td>
                    <span className={`um-badge ${user.isActive ? 'um-badge-active' : 'um-badge-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="um-actions">
                      <button
                        className="um-btn-icon um-btn-view"
                        title="View"
                        onClick={() => handleViewUser(user.id)}
                      >
                        <i className="ti ti-eye" />
                      </button>
                      {hasPermission('Users', 'Update') && (
                        <button
                        className="um-btn-icon um-btn-edit"
                        title="Edit"
                        onClick={() => handleEditUser(user.id)}
                        >
                        <i className="ti ti-pencil" />
                        </button>
                    )}
                      {hasPermission('Users', 'Delete') && (
                        <button
                        className="um-btn-icon um-btn-del"
                        title="Delete"
                        onClick={() => handleDeleteClick(user)}
                        >
                        <i className="ti ti-trash" />
                        </button>
                    )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="um-pagination">
          <span className="um-pagination-info">
            Showing {startRecord}–{endRecord} of {total} users
          </span>
          <div className="um-pagination-btns">
            <button
              className="um-page-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`um-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button
              className="um-page-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >→</button>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      {hasPermission('Users', 'Create') && (
        <button className="um-btn-add" onClick={handleAddUser}>
        + Add User
        </button>
      )}

      {/* User Modal */}
      {showModal && (
        <UserModal userId={editUserId} onClose={handleModalClose} />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => { setShowDetailModal(false); setSelectedUserId(null); }}
          onEdit={(id) => { setShowDetailModal(false); handleEditUser(id); }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <DeleteModal
          userName={deleteTarget.fullName}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        />
      )}

    </div>
  );
}