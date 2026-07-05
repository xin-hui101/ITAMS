import { useState, useEffect, useCallback } from 'react';
import type { MaintenanceListItem, MaintenanceQuery, MaintenanceStats } from '../../types/maintenance.types';
import { getMaintenance, deleteMaintenance, getMaintenanceStats } from '../../services/maintenanceService';
import { usePermission } from '../../hooks/usePermission';
import MaintenanceModal from './components/MaintenanceModal';
import MaintenanceDetailModal from './components/MaintenanceDetailModal';
import DeleteModal from '../../components/DeleteModal/DeleteModal';
import Toast from '../../components/Toast/Toast';
import './Maintenance.css';



function formatCost(cost?: number): string {
  if (!cost) return '—';
  return `RM ${cost.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    'Repair':     'mn-badge-repair',
    'Service':    'mn-badge-service',
    'Inspection': 'mn-badge-inspection',
  };
  return <span className={`mn-badge ${map[type] ?? 'mn-badge-inspection'}`}>{type}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Pending':     'mn-badge-pending',
    'In Progress': 'mn-badge-inprogress',
    'Completed':   'mn-badge-completed',
  };
  return <span className={`mn-badge ${map[status] ?? 'mn-badge-pending'}`}>{status}</span>;
}

export default function Maintenance() {
  // ── State ───────────────────────────────────────────────────
  const [records, setRecords]       = useState<MaintenanceListItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 10;

  // Modal state
  const [showModal, setShowModal]             = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editId, setEditId]                   = useState<number | null>(null);
  const [detailId, setDetailId]               = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<MaintenanceListItem | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // KPI stats
  const [stats, setStats] = useState<MaintenanceStats | null>(null);

  // Permission hook
  const { hasPermission } = usePermission();

  // ── Fetch stats for KPI cards ──────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const result = await getMaintenanceStats();
      setStats(result);
    } catch {
      setStats(null);
    }
  }, []);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query: MaintenanceQuery = {
        search:   search || undefined,
        status:   statusFilter || undefined,
        type:     typeFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      };
      const result = await getMaintenance(query);
      setRecords(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setError('Failed to load maintenance records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);

  // ── Handlers ────────────────────────────────────────────────
  function handleAdd() {
    setEditId(null);
    setShowModal(true);
  }

  function handleEdit(id: number) {
    setEditId(id);
    setShowModal(true);
  }

  function handleView(id: number) {
    setDetailId(id);
    setShowDetailModal(true);
  }

  function handleDeleteClick(record: MaintenanceListItem) {
    setDeleteTarget(record);
    setShowDeleteModal(true);
  }

  function handleModalClose(refreshed?: boolean) {
    setShowModal(false);
    if (refreshed) {
      fetchRecords();
      fetchStats();
      setToast({
        message: editId
          ? 'Maintenance record updated successfully.'
          : 'Maintenance record created successfully.',
        type: 'success',
      });
    }
    setEditId(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMaintenance(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setToast({ message: 'Maintenance record deleted successfully.', type: 'success' });
      fetchRecords();
      fetchStats();
    } catch (err: any) {
      setShowDeleteModal(false);
      setToast({ message: err.message || 'Failed to delete record.', type: 'error' });
    }
  }

  const startRecord = (page - 1) * PAGE_SIZE + 1;
  const endRecord   = Math.min(page * PAGE_SIZE, total);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="mn-page">

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* KPI Cards — matches the icon+value layout used on Asset Management */}
      {stats && (
        <div className="mn-kpi-grid">
          <div className="mn-kpi-card mn-kpi-total">
            <div className="mn-kpi-icon">
              <i className="ti ti-clipboard-list" />
            </div>
            <div className="mn-kpi-info">
              <div className="mn-kpi-value">{stats.totalRecords}</div>
              <div className="mn-kpi-label">Total Records</div>
            </div>
          </div>
          <div className="mn-kpi-card mn-kpi-pending">
            <div className="mn-kpi-icon">
              <i className="ti ti-clock" />
            </div>
            <div className="mn-kpi-info">
              <div className="mn-kpi-value">{stats.pendingCount}</div>
              <div className="mn-kpi-label">Pending</div>
            </div>
          </div>
          <div className="mn-kpi-card mn-kpi-inprogress">
            <div className="mn-kpi-icon">
              <i className="ti ti-loader" />
            </div>
            <div className="mn-kpi-info">
              <div className="mn-kpi-value">{stats.inProgressCount}</div>
              <div className="mn-kpi-label">In Progress</div>
            </div>
          </div>
          <div className="mn-kpi-card mn-kpi-completed">
            <div className="mn-kpi-icon">
              <i className="ti ti-circle-check" />
            </div>
            <div className="mn-kpi-info">
              <div className="mn-kpi-value">{stats.completedCount}</div>
              <div className="mn-kpi-label">Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar — search + status + type filter + add button on same row */}
      <div className="mn-toolbar">
        <div className="mn-search-wrap">
          <i className="ti ti-search mn-search-icon" aria-hidden="true" />
          <input
            className="mn-search-input"
            placeholder="Search by asset, technician..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="mn-filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select
          className="mn-filter-select"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="Repair">Repair</option>
          <option value="Service">Service</option>
          <option value="Inspection">Inspection</option>
        </select>
        {hasPermission('Maintenance', 'Create') && (
          <button className="mn-btn-add-inline" onClick={handleAdd}>
            <i className="ti ti-plus" />
            Add Record
          </button>
        )}
      </div>

      {/* Table */}
      <div className="mn-table-wrap">
        <table className="mn-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Asset</th>
              <th style={{ width: 100 }}>Type</th>
              <th>Description</th>
              <th style={{ width: 150 }}>Technician</th>
              <th style={{ width: 90 }}>Cost</th>
              <th style={{ width: 120 }}>Status</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="mn-loading">Loading records...</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7}>
                  <div className="mn-error">{error}</div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="mn-empty">
                    <div className="mn-empty-icon">
                      <i className="ti ti-tool" style={{ fontSize: 36 }} />
                    </div>
                    <div className="mn-empty-text">No maintenance records found</div>
                  </div>
                </td>
              </tr>
            ) : (
              records.map(record => (
                <tr key={record.id}>
                  <td>
                    <div className="mn-asset-tag">{record.assetTag}</div>
                    <div className="mn-asset-name">{record.assetName}</div>
                  </td>
                  <td><TypeBadge type={record.type} /></td>
                  <td>{record.description}</td>
                  <td>{record.technicianOrCompany ?? '—'}</td>
                  <td>{formatCost(record.cost)}</td>
                  <td><StatusBadge status={record.status} /></td>
                  <td>
                    <div className="mn-actions">
                      {/* View — always visible */}
                      <button
                        className="mn-btn-icon mn-btn-view"
                        title="View"
                        onClick={() => handleView(record.id)}
                      >
                        <i className="ti ti-eye" />
                      </button>
                      {/* Edit — only show if has permission */}
                      {hasPermission('Maintenance', 'Update') && (
                        <button
                          className="mn-btn-icon mn-btn-edit"
                          title="Edit"
                          onClick={() => handleEdit(record.id)}
                        >
                          <i className="ti ti-pencil" />
                        </button>
                      )}
                      {/* Delete — only show if has permission */}
                      {hasPermission('Maintenance', 'Delete') && (
                        <button
                          className="mn-btn-icon mn-btn-del"
                          title="Delete"
                          onClick={() => handleDeleteClick(record)}
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
        <div className="mn-pagination">
          <span className="mn-pagination-info">
            Showing {startRecord}–{endRecord} of {total} records
          </span>
          <div className="mn-pagination-btns">
            <button
              className="mn-page-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`mn-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button
              className="mn-page-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >→</button>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showModal && (
        <MaintenanceModal
          recordId={editId}
          onClose={handleModalClose}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && detailId && (
        <MaintenanceDetailModal
          recordId={detailId}
          onClose={() => { setShowDetailModal(false); setDetailId(null); }}
          onEdit={(id) => { setShowDetailModal(false); handleEdit(id); }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <DeleteModal
          userName={`${deleteTarget.assetTag} - ${deleteTarget.type}`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        />
      )}

    </div>
  );
}