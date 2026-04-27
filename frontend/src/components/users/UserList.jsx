import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, Plus, Trash2, Edit2, CheckSquare, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UserList = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee', manager: '' });
  const [editingId, setEditingId] = useState(null);
  const [managers, setManagers] = useState([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: { page, limit: 10, search, role: roleFilter }
      });
      setUsers(res.data.users);
      setTotalPages(res.data.pages);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await api.get('/users/managers');
      setManagers(res.data);
    } catch (error) {
      console.error('Failed to fetch managers');
    }
  };

  useEffect(() => {
    fetchUsers();
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      fetchManagers();
    }
  }, [page, roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      
      // Auto-assign current manager if the user is a manager
      if (currentUser.role === 'manager' && !editingId) {
        payload.manager = currentUser._id;
        payload.role = 'employee'; // Force employee role
      }

      if (editingId) {
        // Prevent password update if empty
        if (!payload.password) delete payload.password;
        
        await api.put(`/users/${editingId}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', payload);
        toast.success('User created successfully');
      }
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', role: 'employee', manager: '' });
      setEditingId(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('User deleted');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  };

  const openEdit = (user) => {
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '', 
      role: user.role, 
      manager: user.manager?._id || user.manager || '' 
    });
    setEditingId(user._id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-text-primary">Manage Users</h2>
        <button 
          onClick={() => {
            setFormData({ name: '', email: '', password: '', role: 'employee', manager: '' });
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center shadow-sm transition-colors text-sm font-medium"
        >
          {showForm ? 'Cancel' : <><Plus size={18} className="mr-2" /> Add User</>}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit User' : 'Create New User'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-background text-text-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
              <input 
                required 
                type="email" 
                autoComplete="new-user-email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full px-4 py-2 border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-background text-text-primary" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Password {editingId && '(leave blank to keep current)'}</label>
              <input 
                required={!editingId} 
                minLength={6} 
                type="password" 
                autoComplete="new-password"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                className="w-full px-4 py-2 border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-background text-text-primary" 
              />
            </div>
            {currentUser.role === 'admin' ? (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-secondary text-text-primary text-sm">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                <div className="w-full px-4 py-2 border border-border-color rounded-xl bg-primary-500/5 text-primary-600 text-sm font-bold flex items-center gap-2">
                  <CheckSquare size={14} /> Employee (Fixed)
                </div>
                <p className="text-[10px] text-text-secondary mt-1">As a Manager, you can only create Employee accounts.</p>
              </div>
            )}

            {formData.role === 'employee' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Assigned Manager</label>
                {currentUser.role === 'admin' ? (
                  <select value={formData.manager} onChange={(e) => setFormData({...formData, manager: e.target.value})} className="w-full px-4 py-2 border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 bg-secondary text-text-primary text-sm">
                    <option value="">Select Manager</option>
                    {managers.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2 border border-border-color rounded-xl bg-primary-500/5 text-primary-600 text-sm font-bold flex items-center gap-2">
                    <Users size={14} /> {currentUser.name} (You)
                  </div>
                )}
              </div>
            )}
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-2 rounded-xl font-medium shadow-md hover:shadow-lg transition-all">
                {editingId ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List section */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border-color">
        <div className="p-4 border-b border-border-color bg-secondary/50 flex flex-col sm:flex-row gap-4">
           <form onSubmit={handleSearch} className="flex-1 relative">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-secondary text-text-primary"
            />
            <Search className="absolute left-3 top-2.5 text-text-secondary opacity-50" size={18} />
            <button type="submit" className="hidden">Search</button>
          </form>
          {currentUser.role === 'admin' && (
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="border border-border-color rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-text-primary text-sm"
            >
              <option value="" className="bg-secondary">All Roles</option>
              <option value="admin" className="bg-secondary">Admin</option>
              <option value="manager" className="bg-secondary">Manager</option>
              <option value="employee" className="bg-secondary">Employee</option>
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background text-text-secondary text-xs uppercase tracking-wider border-b border-border-color">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color text-sm">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-text-secondary">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-text-secondary">No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} className="hover:bg-primary/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary flex items-center">
                      <div className="relative mr-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        {u.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-secondary rounded-full"></span>
                        )}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        <div className={`text-[10px] font-bold uppercase ${u.isOnline ? 'text-green-500' : 'text-text-secondary opacity-50'}`}>
                          {u.isOnline ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-[10px] font-bold capitalize
                          ${u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                            u.role === 'manager' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                          {u.role}
                        </span>
                        {u.role === 'employee' && (
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border
                              ${u.workload === 'busy' 
                                ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'}`}>
                              {u.workload} ({u.activeTasks} Tasks)
                            </span>
                            {u.manager && (
                              <span className="text-[9px] text-text-secondary font-medium">
                                Manager: <span className="text-primary-600">{u.manager.name}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEdit(u)} className="text-primary-600 hover:text-primary-900 mr-3 p-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u._id)} 
                        disabled={currentUser._id === u._id}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
       {/* Pagination */}
       {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-border-color rounded-lg bg-background text-text-primary disabled:opacity-50">Prev</button>
          <span className="px-4 py-2 text-text-secondary">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border border-border-color rounded-lg bg-background text-text-primary disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
};

export default UserList;
