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
    'Fault':             'am-badge-fault',
  };
  return (
    <span className={`am-badge ${map[status] ?? 'am-badge-inactive'}`}>
      {status}
    </span>
  );
}

export default function AssetManagement() {
  const [searchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get('categoryId');

  const [assets, setAssets]         = useState<AssetListItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 10;

  const [sortField, setSortField] = useState<SortField>('warrantyExpiry');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [showModal, setShowModal]             = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editId, setEditId]                   = useState<number | null>(null);
  const [detailId, setDetailId]               = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<AssetListItem | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [stats, setStats] = useState<AssetStats | null>(null);

  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryIcon, setCategoryIcon] = useState<string>('ti-category');

  const { hasPermission } = usePermission();

  const categoryId = categoryIdFromUrl ? Number(categoryIdFromUrl) : undefined;

  const [printAssets, setPrintAssets] = useState<AssetListItem[]>([]);
  const [printing, setPrinting]       = useState(false);

  const [tableFields, setTableFields] = useState<{ fieldKey: string; fieldLabel: string }[]>([]);

  const [fixedTableFields, setFixedTableFields] = useState<{ key: string; label: string }[]>([]);

  const [showNameInTable, setShowNameInTable] = useState<boolean>(true);

  async function handlePrint() {
    setPrinting(true);
    try {
      const result = await getAssets({
        search:     search || undefined,
        status:     statusFilter || undefined,
        categoryId,
        page:     1,
        pageSize: 9999,
      });
      setPrintAssets(result.data);
      setTimeout(() => {
        window.print();
        setPrinting(false);
      }, 300);
    } catch {
      setPrinting(false);
    }
  }

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
        setTableFields(
          cat.fields
            .filter(f => f.showInTable)
            .map(f => ({ fieldKey: f.fieldKey, fieldLabel: f.fieldLabel }))
        );
        if (cat.fixedFieldsConfig) {
          try {
            const config = JSON.parse(cat.fixedFieldsConfig);
            setShowNameInTable(config.nameInTable ?? true);
            const fixed = [];
            if (config.brandInTable)          fixed.push({ key: 'brand',         label: 'Brand' });
            if (config.modelInTable)          fixed.push({ key: 'model',         label: 'Model' });
            if (config.serialNumberInTable)   fixed.push({ key: 'serialNumber',  label: 'Serial No.' });
            if (config.purchasePriceInTable)  fixed.push({ key: 'purchasePrice', label: 'Price' });
            if (config.warrantyExpiryInTable) fixed.push({ key: 'warrantyExpiry', label: 'Warranty' });
            if (config.purchaseDateInTable)   fixed.push({ key: 'purchaseDate',  label: 'DOP' });
            setFixedTableFields(fixed);
          } catch {
            setFixedTableFields([]);
            setShowNameInTable(true);
          }
        }
      })
      .catch(() => setCategoryName(''));
  }, [categoryId]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getAssetStats(categoryId);
      setStats(result);
    } catch {
      setStats(null);
    }
  }, [categoryId]);

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
        sortField,
        sortOrder,
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
  }, [search, statusFilter, categoryId, page, sortField, sortOrder]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryId]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'warrantyExpiry' ? 'asc' : 'desc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    const active = sortField === field;
    return (
      <div className={`am-sort-icon ${active ? sortOrder : ''}`}>
        <span className="up" />
        <span className="down" />
      </div>
    );
  }

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
  const totalLabel  = categoryName ? `Total ${categoryName}` : 'Total Assets';

  return (
    <div className="am-page">

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {categoryName && (
        <div className="am-category-header">
          <i className={`ti ${categoryIcon}`} />
          {categoryName} Assets
        </div>
      )}

      {stats && (
        <div className="am-kpi-grid" id="am-print-kpi">
          {!categoryId && (
            <div className="am-kpi-card am-kpi-categories">
              <div className="am-kpi-icon"><i className="ti ti-category" /></div>
              <div className="am-kpi-info">
                <div className="am-kpi-value">{stats.totalCategories}</div>
                <div className="am-kpi-label">Total Categories</div>
              </div>
            </div>
          )}
          <div className="am-kpi-card am-kpi-total">
            <div className="am-kpi-icon"><i className="ti ti-devices" /></div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.totalAssets}</div>
              <div className="am-kpi-label">{totalLabel}</div>
            </div>
          </div>
          <div className="am-kpi-card am-kpi-value-card">
            <div className="am-kpi-icon am-kpi-icon-rm">RM</div>
            <div>
              <div className="am-kpi-value">{formatCurrency(stats.totalValue)}</div>
              <div className="am-kpi-label">Total Asset Value</div>
            </div>
          </div>
          <div className="am-kpi-card am-kpi-active">
            <div className="am-kpi-icon"><i className="ti ti-circle-check" /></div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.activeCount}</div>
              <div className="am-kpi-label">Active</div>
            </div>
          </div>
          <div className="am-kpi-card am-kpi-inactive">
            <div className="am-kpi-icon"><i className="ti ti-circle-minus" /></div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.inactiveCount}</div>
              <div className="am-kpi-label">Inactive</div>
            </div>
          </div>
          <div className="am-kpi-card am-kpi-maintenance">
            <div className="am-kpi-icon"><i className="ti ti-tool" /></div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.underMaintenanceCount}</div>
              <div className="am-kpi-label">Under Maintenance</div>
            </div>
          </div>
          <div className="am-kpi-card am-kpi-dispose">
            <div className="am-kpi-icon"><i className="ti ti-trash" /></div>
            <div className="am-kpi-info">
              <div className="am-kpi-value">{stats.disposeCount}</div>
              <div className="am-kpi-label">Dispose</div>
            </div>
          </div>
        </div>
      )}

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
          <option value="Fault">Fault</option>
        </select>
        {hasPermission('Assets', 'Create') && (
          <button className="am-btn-add-inline" onClick={handleAdd}>
            <i className="ti ti-plus" />
            Add Asset
          </button>
        )}
        <button className="am-btn-print" onClick={handlePrint} disabled={printing}>
          <i className="ti ti-printer" />
          {printing ? 'Preparing...' : 'Print'}
        </button>
      </div>

      <div className="am-table-wrap" id="am-print-table">
        <table className="am-table">
          <thead>
            <tr>
              <th className="sortable" style={{ minWidth: 110, width: 110 }} onClick={() => handleSort('assetTag')}>
                <div className="am-th-inner">Asset ID <SortIcon field="assetTag" /></div>
              </th>
              {showNameInTable && (
                <th className="sortable" style={{ minWidth: 200 }} onClick={() => handleSort('name')}>
                  <div className="am-th-inner">Name <SortIcon field="name" /></div>
                </th>
              )}
              {!categoryId && <th style={{ minWidth: 120, width: 120 }}>Category</th>}
              <th className="sortable" style={{ minWidth: 110, width: 110 }} onClick={() => handleSort('location')}>
                <div className="am-th-inner">Location <SortIcon field="location" /></div>
              </th>
              {fixedTableFields.map(f => (
                <th key={f.key} style={{ minWidth: 130 }}>{f.label}</th>
              ))}
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
            ) : assets.length === 0 ? (
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
              assets.map(asset => (
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
                  {fixedTableFields.map(f => (
                    <td key={f.key}>
                      {f.key === 'brand'          ? asset.brand ?? '—'
                      : f.key === 'model'         ? asset.model ?? '—'
                      : f.key === 'serialNumber'  ? (asset as any).serialNumber ?? '—'
                      : f.key === 'purchasePrice' ? (asset.purchasePrice ? formatCurrency(asset.purchasePrice) : '—')
                      : f.key === 'warrantyExpiry' ? formatDate(asset.warrantyExpiry)
                      : f.key === 'purchaseDate'  ? formatDate((asset as any).purchaseDate)
                      : '—'}
                    </td>
                  ))}
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
                      <button
                        className="am-btn-icon am-btn-view"
                        title="View"
                        onClick={() => handleView(asset.id)}
                      >
                        <i className="ti ti-eye" />
                      </button>
                      {hasPermission('Assets', 'Update') && (
                        <button
                          className="am-btn-icon am-btn-edit"
                          title="Edit"
                          onClick={() => handleEdit(asset.id)}
                        >
                          <i className="ti ti-pencil" />
                        </button>
                      )}
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

      {showModal && (
        <AssetModal
          assetId={editId}
          defaultCategoryId={!editId ? categoryId : undefined}
          onClose={handleModalClose}
        />
      )}

      {showDetailModal && detailId && (
        <AssetDetailModal
          assetId={detailId}
          onClose={() => { setShowDetailModal(false); setDetailId(null); }}
          onEdit={(id) => { setShowDetailModal(false); handleEdit(id); }}
        />
      )}

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