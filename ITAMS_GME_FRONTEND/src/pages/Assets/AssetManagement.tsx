import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AssetListItem, AssetQuery, AssetStats } from '../../types/asset.types';
import { getAssets, deleteAsset, getAssetStats } from '../../services/assetService';
import { getCategoryById } from '../../services/categoryService';
import { usePermission } from '../../hooks/usePermission';
import AssetModal from './components/AssetModal';
import AssetDetailModal from './components/AssetDetailModal';
import DeleteModal from '../../components/DeleteModal/DeleteModal';
import Toast from '../../components/Toast/Toast';
import './AssetManagement.css';

type SortField = 'assetTag' | 'name' | 'status' | 'location' | 'warrantyExpiry' | 'purchasePrice' | 'createdAt';
type SortOrder = 'asc' | 'desc';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return '0.00';
  return amount.toLocaleString('en-MY', { minimumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Active':            'am-badge-active',
    'Inactive':          'am-badge-inactive',
    'Under Maintenance': 'am-badge-maintenance',
    'Dispose':           'am-badge-dispose',
  };
  return (
    <span className={`am-badge ${map[status] ?? 'am-badge-inactive'}`}>
      {status}
    </span>
  );
}

export default function AssetManagement() {
  // ── Hooks must be at top level ───────────────────────────────
  const [searchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get('categoryId');

  // ── State ───────────────────────────────────────────────────
  const [assets, setAssets]         = useState<AssetListItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 10;

  // Sorting — default warrantyExpiry asc (soonest expiry first)
  const [sortField, setSortField] = useState<SortField>('warrantyExpiry');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modal state
  const [showModal, setShowModal]             = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editId, setEditId]                   = useState<number | null>(null);
  const [detailId, setDetailId]               = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<AssetListItem | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // KPI stats
  const [stats, setStats] = useState<AssetStats | null>(null);

  // Category info — only relevant when viewing a specific category
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryIcon, setCategoryIcon] = useState<string>('ti-category');

  // Permission hook
  const { hasPermission } = usePermission();

  const categoryId = categoryIdFromUrl ? Number(categoryIdFromUrl) : undefined;

  // Print state — holds all assets fetched for printing
const [printAssets, setPrintAssets] = useState<AssetListItem[]>([]);
const [printing, setPrinting]       = useState(false);

  // ShowInTable custom fields for current category
  const [tableFields, setTableFields] = useState<{ fieldKey: string; fieldLabel: string }[]>([]);

  const [fixedTableFields, setFixedTableFields] = useState<{
  key: string;
  label: string;
  }[]>([]);

  const [showNameInTable, setShowNameInTable] = useState<boolean>(true);

  // Fetch all assets matching current filter, then trigger print
async function handlePrint() {
  setPrinting(true);
  try {
    const result = await getAssets({
      search:     search || undefined,
      status:     statusFilter || undefined,
      categoryId,
      page:     1,
      pageSize: 9999, // fetch all
    });
    setPrintAssets(result.data);
    // Wait for DOM to update with print data, then print
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 300);
  } catch {
    setPrinting(false);
  }
}
  // ── Fetch category info when filtering by specific category ──
  useEffect(() => {
    if (!categoryId) {
      setCategoryName('');
      setCategoryIcon('ti-category');
      setTableFields([]);
      return;
    }
    getCategoryById(categoryId)
      .then(cat => {
        setCategoryName(cat.name);
        setCategoryIcon(cat.icon ?? 'ti-category');
        // Custom fields ShowInTable
      setTableFields(
        cat.fields
          .filter(f => f.showInTable)
          .map(f => ({ fieldKey: f.fieldKey, fieldLabel: f.fieldLabel }))
      );

      // Fixed fields ShowInTable
      if (cat.fixedFieldsConfig) {
        try {
          const config = JSON.parse(cat.fixedFieldsConfig);
          setShowNameInTable(config.nameInTable ?? true);
          const fixed = [];
          if (config.brandInTable)         fixed.push({ key: 'brand',         label: 'Brand' });
          if (config.modelInTable)         fixed.push({ key: 'model',         label: 'Model' });
          if (config.serialNumberInTable)  fixed.push({ key: 'serialNumber',  label: 'Serial No.' });
          if (config.purchasePriceInTable) fixed.push({ key: 'purchasePrice', label: 'Price' });
          if (config.warrantyExpiryInTable) fixed.push({ key: 'warrantyExpiry', label: 'Warranty' });
          setFixedTableFields(fixed);
        } catch {
          setFixedTableFields([]);
          setShowNameInTable(true);
        }
      }
    })
      .catch(() => setCategoryName(''));
  }, [categoryId]);

  // ── Fetch stats for KPI cards ──────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const result = await getAssetStats(categoryId);
      setStats(result);
    } catch {
      setStats(null);
    }
  }, [categoryId]);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query: AssetQuery = {
        search:     search || undefined,
        status:     statusFilter || undefined,
        categoryId,
        page,
        pageSize:   PAGE_SIZE,
      };
      const result = await getAssets(query);
      setAssets(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setError('Failed to load assets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryId, page]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryId]);

  // ── Sort ────────────────────────────────────────────────────
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Warranty defaults to ascending (soonest expiry first)
      // Other fields default to descending
      setSortOrder(field === 'warrantyExpiry' ? 'asc' : 'desc');
    }
  }

  const sortedAssets = [...assets].sort((a, b) => {
    // Warranty and purchase price need numeric/date comparison, not string
    if (sortField === 'warrantyExpiry') {
      // Assets with no warranty date are pushed to the end regardless of order
      const dateA = a.warrantyExpiry ? new Date(a.warrantyExpiry).getTime() : Infinity;
      const dateB = b.warrantyExpiry ? new Date(b.warrantyExpiry).getTime() : Infinity;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
    if (sortField === 'purchasePrice') {
      const priceA = (a as any).purchasePrice ?? 0;
      const priceB = (b as any).purchasePrice ?? 0;
      return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    }

    const valA = (a[sortField as keyof AssetListItem] ?? '') as string;
    const valB = (b[sortField as keyof AssetListItem] ?? '') as string;
    return sortOrder === 'asc'
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  function SortIcon({ field }: { field: SortField }) {
    const active = sortField === field;
    return (
      <div className={`am-sort-icon ${active ? sortOrder : ''}`}>
        <span className="up" />
        <span className="down" />
      </div>
    );
  }

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

  function handleDeleteClick(asset: AssetListItem) {
    setDeleteTarget(asset);
    setShowDeleteModal(true);
  }

  function handleModalClose(refreshed?: boolean) {
    setShowModal(false);
    if (refreshed) {
      fetchAssets();
      fetchStats();
      setToast({
        message: editId ? 'Asset updated successfully.' : 'Asset created successfully.',
        type: 'success',
      });
    }
    setEditId(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteAsset(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setToast({ message: 'Asset deleted successfully.', type: 'success' });
      fetchAssets();
      fetchStats();
    } catch (err: any) {
      setShowDeleteModal(false);
      setToast({ message: err.message || 'Failed to delete asset.', type: 'error' });
    }
  }

  const startRecord = (page - 1) * PAGE_SIZE + 1;
  const endRecord   = Math.min(page * PAGE_SIZE, total);

  // KPI label changes depending on whether viewing all assets or a specific category
  const totalLabel = categoryName ? `Total ${categoryName}` : 'Total Assets';

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="am-page">

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Category name header — only shown when filtering by a specific category */}
      {categoryName && (
        <div className="am-category-header">
          <i className={`ti ${categoryIcon}`} />
          {categoryName} Assets
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="am-kpi-grid" id="am-print-kpi">
          {/* Total Categories */}
          {!categoryId && (
            <div className="am-kpi-card am-kpi-categories">
              <div className="am-kpi-icon">
                <i className="ti ti-category" />
              </div>
              <div className="am-kpi-info">
                <div className="am-kpi-value">{stats.totalCategories}</div>
                <div className="am-kpi-label">Total Categories</div>
              </div>
            </div>
          )}
          
          {/* Total Assets */}
          <div className="am-kpi-card am-kpi-total">
            <div className="am-kpi-icon">
              <i className="ti ti-devices" />
            </div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.totalAssets}</div>
              <div className="am-kpi-label">{totalLabel}</div>
            </div>
          </div>
          
          {/* Total Asset Value */}
          <div className="am-kpi-card am-kpi-value-card">
  <div className="am-kpi-icon am-kpi-icon-rm">
    RM
  </div>
  <div>
    <div className="am-kpi-value">{formatCurrency(stats.totalValue)}</div>
    <div className="am-kpi-label">Total Asset Value</div>
  </div>
</div>
          
          {/* Active */}
          <div className="am-kpi-card am-kpi-active">
            <div className="am-kpi-icon">
              <i className="ti ti-circle-check" />
            </div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.activeCount}</div>
              <div className="am-kpi-label">Active</div>
            </div>
          </div>
          
          {/* Inactive */}
          <div className="am-kpi-card am-kpi-inactive">
            <div className="am-kpi-icon">
              <i className="ti ti-circle-minus" />
            </div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.inactiveCount}</div>
              <div className="am-kpi-label">Inactive</div>
            </div>
          </div>
          
          {/* Under Maintenance */}
          <div className="am-kpi-card am-kpi-maintenance">
            <div className="am-kpi-icon">
              <i className="ti ti-tool" />
            </div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.underMaintenanceCount}</div>
              <div className="am-kpi-label">Under Maintenance</div>
            </div>
          </div>
          
          {/* Dispose */}
          <div className="am-kpi-card am-kpi-dispose">
            <div className="am-kpi-icon">
              <i className="ti ti-trash" />
            </div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.disposeCount}</div>
              <div className="am-kpi-label">Dispose</div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar — search + status filter + add button + print button on same row */}
<div className="am-toolbar">
  <div className="am-search-wrap">
    <i className="ti ti-search am-search-icon" aria-hidden="true" />
    <input
      className="am-search-input"
      placeholder="Search by name, tag, brand or model..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
  </div>
  <select
    className="am-filter-select"
    value={statusFilter}
    onChange={e => setStatusFilter(e.target.value)}
  >
    <option value="">All Status</option>
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
    <option value="Under Maintenance">Under Maintenance</option>
    <option value="Dispose">Dispose</option>
  </select>
  {hasPermission('Assets', 'Create') && (
    <button className="am-btn-add-inline" onClick={handleAdd}>
      <i className="ti ti-plus" />
      Add Asset
    </button>
  )}
  {/* Print button */}
  <button className="am-btn-print" onClick={handlePrint} disabled={printing}>
  <i className="ti ti-printer" />
  {printing ? 'Preparing...' : 'Print'}
</button>
</div>

      {/* Table */}
      <div className="am-table-wrap" id="am-print-table">
        <table className="am-table">
          <thead>
            <tr>
              {showNameInTable && (
                <th className="sortable" style={{ minWidth: 200 }} onClick={() => handleSort('name')}>
                  <div className="am-th-inner">Name <SortIcon field="name" /></div>
                </th>
              )}
              <th className="sortable" style={{ minWidth: 110, width: 110 }} onClick={() => handleSort('assetTag')}>
                <div className="am-th-inner">Asset ID <SortIcon field="assetTag" /></div>
              </th>
              
              <th className="sortable" style={{ minWidth: 200 }} onClick={() => handleSort('name')}>
                <div className="am-th-inner">Name <SortIcon field="name" /></div>
              </th>
              
              {!categoryId && <th style={{ minWidth: 120, width: 120 }}>Category</th>}
              
              <th className="sortable" style={{ minWidth: 110, width: 110 }} onClick={() => handleSort('location')}>
                <div className="am-th-inner">Location <SortIcon field="location" /></div>
              </th>
              
              {/* Dynamic fixed field columns */}
              {fixedTableFields.map(f => (
                <th key={f.key} style={{ minWidth: 130 }}>{f.label}</th>
              ))}
              
              {/* Dynamic custom field columns: */}
              {tableFields.map(f => (
                <th key={f.fieldKey} style={{ minWidth: 150 }}>{f.fieldLabel}</th>
              ))}
              
              <th className="sortable" style={{ minWidth: 140, width: 140 }} onClick={() => handleSort('status')}>
                <div className="am-th-inner">Status <SortIcon field="status" /></div>
              </th>
              
              <th style={{ minWidth: 100, width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="am-loading">Loading assets...</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8}>
                  <div className="am-error">{error}</div>
                </td>
              </tr>
            ) : sortedAssets.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="am-empty">
                    <div className="am-empty-icon">
                      <i className="ti ti-device-laptop" style={{ fontSize: 36 }} />
                    </div>
                    <div className="am-empty-text">No assets found</div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedAssets.map(asset => (
                <tr key={asset.id}>
                  <td>
                    <span className="am-asset-tag">{asset.assetTag}</span>
                  </td>
                  {showNameInTable && (
                  <td>
                    <div className="am-name-cell">
                      <span className="am-name">{asset.name || asset.brand || asset.assetTag}</span>
                      {(asset.brand || asset.model) && (
                        <span className="am-sub">
                          {[asset.brand, asset.model].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  </td>
                  )}
                  {!categoryId && (
                    <td>
                      <span className="am-badge-category">{asset.category}</span>
                    </td>
                  )}
                  <td>{asset.location ?? '—'}</td>
{/* Dynamic fixed field values */}
{fixedTableFields.map(f => (
  <td key={f.key}>
    {f.key === 'brand'         ? asset.brand ?? '—'
    : f.key === 'model'        ? asset.model ?? '—'
    : f.key === 'serialNumber' ? (asset as any).serialNumber ?? '—'
    : f.key === 'purchasePrice' ? (asset.purchasePrice ? formatCurrency(asset.purchasePrice) : '—')
    : f.key === 'warrantyExpiry' ? formatDate(asset.warrantyExpiry)
    : '—'}
  </td>
))}
                  {/* Dynamic custom field values */}
    {tableFields.map(f => (
      <td key={f.fieldKey}>
        {asset.customFields?.find(cf => cf.fieldKey === f.fieldKey)?.value ?? '—'}
      </td>
    ))}
                  <td>
                    <StatusBadge status={asset.status} />
                  </td>
                  <td>
                    <div className="am-actions">
                      {/* View — always visible */}
                      <button
                        className="am-btn-icon am-btn-view"
                        title="View"
                        onClick={() => handleView(asset.id)}
                      >
                        <i className="ti ti-eye" />
                      </button>
                      {/* Edit — only show if has permission */}
                      {hasPermission('Assets', 'Update') && (
                        <button
                          className="am-btn-icon am-btn-edit"
                          title="Edit"
                          onClick={() => handleEdit(asset.id)}
                        >
                          <i className="ti ti-pencil" />
                        </button>
                      )}
                      {/* Delete — only show if has permission */}
                      {hasPermission('Assets', 'Delete') && (
                        <button
                          className="am-btn-icon am-btn-del"
                          title="Delete"
                          onClick={() => handleDeleteClick(asset)}
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
        <div className="am-pagination">
          <span className="am-pagination-info">
            Showing {startRecord}–{endRecord} of {total} assets
          </span>
          <div className="am-pagination-btns">
            <button
              className="am-page-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`am-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button
              className="am-page-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >→</button>
          </div>
        </div>
      )}

{/* Hidden print table — only visible during print, contains all assets */}
<div className="am-print-only" id="am-print-table-all">
  <table className="am-table" style={{ width: '100%' }}>
    <thead>
      <tr>
        <th>Asset ID</th>
        <th>Name</th>
        <th>Brand</th>
        <th>Model</th>
        {!categoryId && <th>Category</th>}
        <th>Location</th>
        <th>Price (RM)</th>
        <th>Warranty</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {printAssets.map(asset => (
        <tr key={asset.id}>
          <td>{asset.assetTag}</td>
          <td>{asset.name}</td>
          <td>{asset.brand ?? '—'}</td>
          <td>{asset.model ?? '—'}</td>
          {!categoryId && <td>{asset.category}</td>}
          <td>{asset.location ?? '—'}</td>
          <td>{asset.purchasePrice ? asset.purchasePrice.toLocaleString('en-MY', { minimumFractionDigits: 2 }) : '—'}</td>
          <td>{asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : '—'}</td>
          <td>{asset.status}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {/* Asset Modal — pass categoryId so it can be pre-selected and locked on a specific category page */}
      {showModal && (
        <AssetModal
          assetId={editId}
          defaultCategoryId={!editId ? categoryId : undefined}
          onClose={handleModalClose}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && detailId && (
        <AssetDetailModal
          assetId={detailId}
          onClose={() => { setShowDetailModal(false); setDetailId(null); }}
          onEdit={(id) => { setShowDetailModal(false); handleEdit(id); }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <DeleteModal
          userName={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        />
      )}

    </div>
  );
}