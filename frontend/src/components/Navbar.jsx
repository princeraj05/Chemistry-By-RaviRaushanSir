import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { FlaskConical, Menu, X, LogOut, LayoutDashboard, BookOpen, User as UserIcon, ShieldAlert, Video, Users, CreditCard } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null; // Hide navbar if not authenticated

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const navLinks = user?.role?.toLowerCase() === 'admin'
    ? [
        { name: 'Admin Console', path: '/admin/dashboard', icon: ShieldAlert },
        { name: 'Courses', path: '/admin/courses', icon: BookOpen },
        { name: 'Lectures', path: '/admin/videos', icon: Video },
        { name: 'Students', path: '/admin/students', icon: Users },
        { name: 'Payments', path: '/admin/payments', icon: CreditCard },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Courses', path: '/courses', icon: BookOpen },
        { name: 'Profile', path: '/profile', icon: UserIcon },
      ];

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-slate-800/80 shadow-lg px-4 md:px-8 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to={user?.role?.toLowerCase() === 'admin' ? "/admin/dashboard" : "/dashboard"} className="flex items-center space-x-2.5 group">
          <div className="bg-gradient-to-br from-cyan-400 to-sky-600 p-2 rounded-xl text-slate-950 shadow-md group-hover:scale-105 transition-transform duration-200">
            <FlaskConical className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent group-hover:opacity-95 transition-opacity">
              Chemistry
            </span>
            <span className="text-xs block font-semibold text-sky-400/80 -mt-1 tracking-wider uppercase">
              Ravi Raushan Sir
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => {
            const IconComponent = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2 text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-sky-500/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.05)]'
                    : 'text-slate-350 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <IconComponent className="w-4.5 h-4.5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* User Menu & LogOut (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />

          <div className="text-right">
            <div className="text-sm font-semibold text-slate-100">{user.name}</div>
            <div className="text-xs font-semibold text-cyan-400/80 capitalize bg-cyan-950/40 border border-cyan-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
              {user.role}
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center space-x-3">
          <ThemeToggle compact />

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-3 border-t border-slate-800/60 flex flex-col space-y-2 animate-fadeIn">
          {navLinks.map((link) => {
            const IconComponent = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-sky-500/15 text-cyan-400 border-l-4 border-cyan-400 shadow-inner'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/45'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          
          <div className="bg-slate-900/60 p-3 rounded-xl mt-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-100">{user.name}</div>
              <div className="text-xs text-sky-400/80 capitalize">{user.role}</div>
            </div>
            {user.class && user.class !== 'Other' && (
              <span className="text-xs font-semibold bg-sky-950 text-cyan-400 border border-sky-800/50 px-2 py-1 rounded-md">
                Class {user.class}
              </span>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
