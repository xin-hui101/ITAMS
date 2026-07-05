import { useState, useEffect } from 'react';
import type { Role, Permission, UserDetail } from '../../../types/user.types';
import {
  getRoles,
  getPermissions,
  createUser,
  updateUser,
  getUserById,
} from '../../../services/userService';
import './UserModal.css';

interface Props {
  userId: number | null; // null = create, number = edit
  onClose: (refreshed?: boolean) => void;
}

interface FormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
  isActive: boolean;
  permissionIds: number[];
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  roleId?: string;
}

const EMPTY_FORM: FormData = {
  fullName:      '',
  username:      '',
  email:         '',
  password:      '',
  phone:         '',
  roleId:        '',
  isActive:      true,
  permissionIds: [],
};

export default function UserModal({ userId, onClose }: Props) {
  const isEdit = userId !== null;

  const [form, setForm]           = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [roles, setRoles]         = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(false);
  const [apiError, setApiError]   = useState('');

  // Load roles and permissions on mount
  useEffect(() => {
    Promise.all([getRoles(), getPermissions()])
      .then(([r, p]) => { setRoles(r); setPermissions(p); })
      .catch(() => {});
  }, []);

  // If editing, load existing user data
  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    getUserById(userId!)
      .then((user: UserDetail) => {
        setForm({
          fullName:      user.fullName,
          username:      user.username,
          email:         user.email,
          password:      '',
          phone:         user.phone ?? '',
          roleId:        String(user.roleId),
          isActive:      user.isActive,
          permissionIds: permissions
            .filter(p => user.permissions.includes(`${p.module}:${p.action}`))
            .map(p => p.id),
        });
      })
      .catch(() => setApiError('Failed to load user data.'))
      .finally(() => setFetching(false));
  }, [userId, isEdit, permissions]);

  // Group permissions by module for display
  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {}
  );

  // ── Field change handler ─────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors])
      setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  }

  // ── Permission toggle ────────────────────────────────────────
  function handlePermissionToggle(id: number) {
    setForm(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter(p => p !== id)
        : [...prev.permissionIds, id],
    }));
  }

  // ── Validation ───────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Enter a valid email.';
    }
    if (!isEdit && !form.password) {
      errs.password = 'Password is required.';
    } else if (!isEdit && form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (!form.roleId) errs.roleId = 'Role is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    try {
      if (isEdit) {
        await updateUser(userId!, {
          fullName:      form.fullName,
          username:      form.username,
          email:         form.email,
          phone:         form.phone || undefined,
          roleId:        Number(form.roleId),
          isActive:      form.isActive,
          permissionIds: form.permissionIds,
        });
      } else {
        await createUser({
          fullName:      form.fullName,
          username:      form.username,
          email:         form.email,
          password:      form.password,
          phone:         form.phone || undefined,
          roleId:        Number(form.roleId),
          isActive:      form.isActive,
          permissionIds: form.permissionIds,
        });
      }
      onClose(true); // true = refresh list
    } catch (err: any) {
      setApiError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={() => onClose()}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">
            {isEdit ? 'Edit User' : 'Add New User'}
          </span>
          <button className="modal-close" onClick={() => onClose()}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {fetching ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
              Loading...
            </div>
          ) : (
            <>
              {apiError && (
                <div className="modal-api-error">{apiError}</div>
              )}

              <div className="form-grid">

                {/* Full Name */}
                <div className="form-field">
                  <label className="form-label">
                    Full Name <span>*</span>
                  </label>
                  <input
                    className={`form-input ${errors.fullName ? 'form-input--error' : ''}`}
                    name="fullName"
                    placeholder="e.g. John Doe"
                    value={form.fullName}
                    onChange={handleChange}
                  />
                  {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                </div>

                {/* Username */}
                <div className="form-field">
                  <label className="form-label">
                    Username <span>*</span>
                  </label>
                  <input
                    className={`form-input ${errors.username ? 'form-input--error' : ''}`}
                    name="username"
                    placeholder="e.g. johndoe"
                    value={form.username}
                    onChange={handleChange}
                  />
                  {errors.username && <span className="form-error">{errors.username}</span>}
                </div>

                {/* Email */}
                <div className="form-field">
                  <label className="form-label">
                    Email <span>*</span>
                  </label>
                  <input
                    className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                    name="email"
                    type="email"
                    placeholder="e.g. john@company.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                {/* Phone */}
                <div className="form-field">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    name="phone"
                    placeholder="e.g. 012-3456789"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Password (create only) */}
                {!isEdit && (
                  <div className="form-field">
                    <label className="form-label">
                      Password <span>*</span>
                    </label>
                    <input
                      className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                      name="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={handleChange}
                    />
                    {errors.password && <span className="form-error">{errors.password}</span>}
                  </div>
                )}

                {/* Role */}
                <div className="form-field">
                  <label className="form-label">
                    Role <span>*</span>
                  </label>
                  <select
                    className={`form-select ${errors.roleId ? 'form-input--error' : ''}`}
                    name="roleId"
                    value={form.roleId}
                    onChange={handleChange}
                  >
                    <option value="">Select role...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {errors.roleId && <span className="form-error">{errors.roleId}</span>}
                </div>

                {/* Active toggle */}
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <div className="form-toggle">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <span className="toggle-slider" />
                    </label>
                    <span className="toggle-label">
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Permissions */}
              <div className="permissions-section">
                <div className="permissions-title">Permissions</div>
                <div className="permissions-grid">
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module} className="permission-group">
                      <div className="permission-module">{module}</div>
                      <div className="permission-items">
                        {perms.map(perm => (
                          <label key={perm.id} className="permission-item">
                            <input
                              type="checkbox"
                              checked={form.permissionIds.includes(perm.id)}
                              onChange={() => handlePermissionToggle(perm.id)}
                            />
                            {perm.action}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={() => onClose()}>
            Cancel
          </button>
          <button
            className="modal-btn-save"
            onClick={handleSubmit}
            disabled={loading || fetching}
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>

      </div>
    </div>
  );
}