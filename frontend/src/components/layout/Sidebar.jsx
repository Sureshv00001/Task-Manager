import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CheckSquare, Settings, BarChart2, Calendar as CalendarIcon, Briefcase } from 'lucide-react';

const Sidebar = ({ isOpen, setOpen }) => {
  const { user } = useAuth();

  const getLinks = () => {
    const baseLinks = [
      { name: 'Dashboard', path: `/${user?.role}`, icon: <LayoutDashboard size={20} /> },
      { name: 'Projects', path: `/${user?.role}?tab=projects`, icon: <Briefcase size={20} /> },
    ];

    if (user?.role === 'admin' || user?.role === 'manager') {
      return [
        ...baseLinks,
        { name: 'Tasks', path: `/${user?.role}?tab=tasks`, icon: <CheckSquare size={20} /> },
        { name: 'Calendar', path: `/${user?.role}?tab=calendar`, icon: <CalendarIcon size={20} /> },
        { name: 'Users', path: `/${user?.role}?tab=users`, icon: <Users size={20} /> },
        { name: 'Performance', path: `/${user?.role}?tab=performance`, icon: <BarChart2 size={20} /> }
      ];
    } else {
      return [
        ...baseLinks,
        { name: 'My Tasks', path: `/employee`, icon: <CheckSquare size={20} /> },
        { name: 'Calendar', path: `/employee?tab=calendar`, icon: <CalendarIcon size={20} /> }
      ];
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex flex-col border-r border-border-color ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-16 border-b border-border-color lg:hidden">
          <span className="text-xl font-bold text-primary-600">TaskManager</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            {getLinks().map((link, index) => (
              <NavLink
                key={index}
                to={link.path}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold shadow-sm' 
                      : 'text-text-secondary hover:bg-primary-500/5 hover:text-text-primary'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <div className={`mr-3 ${window.location.pathname === link.path ? 'text-primary-600' : 'text-text-secondary opacity-50'}`}>
                  {link.icon}
                </div>
                {link.name}
              </NavLink>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-border-color">
          <div className="bg-gradient-to-br from-primary-500/10 to-blue-500/10 p-5 rounded-2xl border border-primary-500/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-primary-500/10 rounded-full blur-xl group-hover:bg-primary-500/20 transition-colors"></div>
            <h4 className="text-sm font-bold text-text-primary mb-1">Expert Support</h4>
            <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">Have questions or need technical assistance? Our team is here to help.</p>
            <button 
              onClick={() => window.location.href = 'mailto:support@taskmanager.com?subject=Task Manager Support Request'}
              className="text-xs font-bold bg-primary-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all w-full transform hover:-translate-y-0.5"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
