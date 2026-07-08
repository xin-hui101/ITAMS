import { useState, useEffect, useCallback, useRef } from 'react';
import { useCategoryRefresh } from '../../context/CategoryRefreshContext';
import type { CategoryListItem, CategoryQuery } from '../../types/category.types';
import { getCategories, deleteCategory } from '../../services/categoryService';
import { usePermission } from '../../hooks/usePermission';
import CategoryModal from './components/CategoryModal';
import CategoryDetailModal from './components/CategoryDetailModal';
import DeleteModal from '../../components/DeleteModal/DeleteModal';
import Toast from '../../components/Toast/Toast';
import './CategoryManagement.css';

// Count total fields including fixed fields
function countFixedFields(config?: string): number {
  // Always 3: Asset Tag, Name, Status
  let count = 3;
  if (!config) return count;
  try {
    const parsed = JSON.parse(config);
    if (parsed.serialNumber) count++;
    if (parsed.brand)        count++;
    if (parsed.model)        count++;
    if (parsed.location)     count++;
    if (parsed.purchaseDate) count++;
  } catch {}
  return count;
}

// Card width + gap used to calculate how many cards fit per row
const CARD_MIN_WIDTH = 240;
const CARD_GAP       = 16;
const ROWS_PER_PAGE  = 3; // How many rows to show per page

export default function CategoryManagement() {
  // ── State ───────────────────────────────────────────────────
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  // Dynamic page size based on container width
  const gridRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(12);

  const [showModal, setShowModal]             = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editId, setEditId]                   = useState<number | null>(null);
  const [detailId, setDetailId]               = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<CategoryListItem | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { hasPermission } = usePermission();
  const { triggerRefresh } = useCategoryRefresh();

  // ── Calculate page size based on container width ─────────────
  useEffect(() => {
    function calculatePageSize() {
      if (!gridRef.current) return;
      const containerWidth = gridRef.current.offsetWidth;
      // How many cards fit per row
      const cardsPerRow = Math.max(
        1,
        Math.floor((containerWidth + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP))
      );
      setPageSize(cardsPerRow * ROWS_PER_PAGE);
    }

    calculatePageSize();

    // Recalculate when window resizes
    const observer = new ResizeObserver(calculatePageSize);
    if (gridRef.current) observer.observe(gridRef.current);

    return () => observer.disconnect();
  }, []);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query: CategoryQuery = {
        search:   search || undefined,
        page,
        pageSize,
      };
      const result = await getCategories(query);
      setCategories(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { setPage(1); }, [search, pageSize]);

  // ── Handlers ────────────────────────────────────────────────
  function handleAdd() { setEditId(null); setShowModal(true); }

  function handleEdit(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setEditId(id);
    setShowModal(true);
  }

  function handleDeleteClick(e: React.MouseEvent, cat: CategoryListItem) {
    e.stopPropagation();
    setDeleteTarget(cat);
    setShowDeleteModal(true);
  }

  function handleCardClick(id: number) {
    setDetailId(id);
    setShowDetailModal(true);
  }

  function handleModalClose(refreshed?: boolean) {
    setShowModal(false);
    if (refreshed) {
      fetchCategories();
      triggerRefresh(); // Notify Sidebar to refresh
      setToast({
        message: editId ? 'Category updated successfully.' : 'Category created successfully.',
        type: 'success',
      });
    }
    setEditId(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      triggerRefresh();
      setToast({ message: 'Category deleted successfully.', type: 'success' });
      fetchCategories();
    } catch (err: any) {
      setShowDeleteModal(false);
      setToast({ message: err.message || 'Failed to delete category.', type: 'error' });
    }
  }

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord   = Math.min(page * pageSize, total);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="cat-page">

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Toolbar — total count + search + add button on same row */}
      <div className="cat-toolbar">
        <div className="cat-total">
          <i className="ti ti-category" />
          <span>Total: <strong>{total}</strong></span>
        </div>

        <div className="cat-search-wrap">
          <i className="ti ti-search cat-search-icon" aria-hidden="true" />
          <input
            className="cat-search-input"
            placeholder="Search by name, code or prefix..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {hasPermission('Categories', 'Create') && (
          <button className="cat-btn-add-inline" onClick={handleAdd}>
            <i className="ti ti-plus" />
            Add Category
          </button>
        )}
      </div>

      {/* Cards Grid */}
      <div className="cat-grid" ref={gridRef}>
        {loading ? (
          <div className="cat-loading">Loading categories...</div>
        ) : error ? (
          <div className="cat-error">{error}</div>
        ) : categories.length === 0 ? (
          <div className="cat-empty">
            <div className="cat-empty-icon">
              <i className="ti ti-category" style={{ fontSize: 40 }} />
            </div>
            <div className="cat-empty-text">No categories found</div>
          </div>
        ) : (
          categories.map(cat => (
            <div
              key={cat.id}
              className="cat-card"
              onClick={() => handleCardClick(cat.id)}
            >
              {/* Top row — icon + buttons */}
              <div className="cat-card-top">
                <div className="cat-card-icon">
                  <i className={`ti ${cat.icon ?? 'ti-category'}`} aria-hidden="true" />
                </div>
                <div className="cat-card-actions">
                  {hasPermission('Categories', 'Update') && (
                    <button
                      className="cat-btn-icon cat-btn-edit"
                      title="Edit"
                      onClick={e => handleEdit(e, cat.id)}
                    >
                      <i className="ti ti-pencil" />
                    </button>
                  )}
                  {hasPermission('Categories', 'Delete') && (
                    <button
                      className="cat-btn-icon cat-btn-del"
                      title="Delete"
                      onClick={e => handleDeleteClick(e, cat)}
                    >
                      <i className="ti ti-trash" />
                    </button>
                  )}
                </div>
              </div>

              {/* Name + Prefix on same row */}
              <div className="cat-card-name-row">
                <span className="cat-card-name">{cat.name}</span>
                <span className="cat-card-prefix-inline">{cat.assetPrefix}</span>
              </div>

              {/* Description */}
              <div className="cat-card-desc">
                {cat.description || 'No description'}
              </div>

              {/* Stats */}
              <div className="cat-card-stats">
                <div className="cat-stat cat-stat-asset">
                  <i className="ti ti-devices" />
                  {cat.assetCount} assets
                </div>
                <div className="cat-stat cat-stat-field">
                  <i className="ti ti-list" />
                  {countFixedFields(cat.fixedFieldsConfig) + cat.fieldCount} fields
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="cat-pagination">
          <span className="cat-pagination-info">
            Showing {startRecord}–{endRecord} of {total} categories
          </span>
          <div className="cat-pagination-btns">
            <button
              className="cat-page-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`cat-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button
              className="cat-page-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >→</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <CategoryModal categoryId={editId} onClose={handleModalClose} />
      )}
      {showDetailModal && detailId && (
        <CategoryDetailModal
          categoryId={detailId}
          onClose={() => { setShowDetailModal(false); setDetailId(null); }}
          onEdit={(id) => { setShowDetailModal(false); setEditId(id); setShowModal(true); }}
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