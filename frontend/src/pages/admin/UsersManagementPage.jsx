import React, { useState } from 'react';
import { 
  Search, ChevronRight, Ban, Users, X, AlertTriangle, CheckCircle2, 
  Mail, Phone, MapPin, Calendar, FileText, Repeat, ThumbsUp, ShieldAlert, User, Layers, Trash2
} from 'lucide-react';
import { SidebarMenu } from '../../components/common/SidebarMenu.jsx';
import { TopNavBar } from '../../components/common/TopNavBar.jsx';
import { ChatbotFAB } from '../../components/common/ChatbotFAB.jsx';
import { ComplaintCard } from '../../components/common/ComplaintCard.jsx';
import { useComplaints } from '../../context/ComplaintContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const UsersManagementPage = () => {
  const { theme } = useAuth();
  const { users, complaints, toggleUserBlocked, deleteUser } = useComplaints();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);

  // State for Block/Unblock Confirmation Modal
  const [userToToggle, setUserToToggle] = useState(null); // { id, name, isBlocked }

  // State for Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState(null); // { id, name, email }

  // State for User Profile Inspection View Modal
  const [inspectingUser, setInspectingUser] = useState(null); // user object
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reposts'

  const isDark = theme === 'dark';

  const filteredUsers = users.filter((u) => {
    const isRealCitizen =
      (!u?.role || u?.role === 'CITIZEN') &&
      u?.email?.toLowerCase() !== 'jaisurya7482@gmail.com' &&
      !u?.email?.includes('@citizen.portal');

    if (!isRealCitizen) return false;

    const nameStr = u?.name || u?.username || u?.email || '';
    const emailStr = u?.email || '';
    const matchesSearch =
      nameStr.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      emailStr.toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesBlocked = !showBlockedOnly || u?.isBlocked || u?.blocked;
    return matchesSearch && matchesBlocked;
  });

  const handleConfirmToggle = async () => {
    if (userToToggle) {
      await toggleUserBlocked(userToToggle.id);
      if (inspectingUser && (inspectingUser.id === userToToggle.id || inspectingUser.email === userToToggle.email)) {
        setInspectingUser((prev) => prev ? { ...prev, isBlocked: !prev.isBlocked, blocked: !prev.blocked } : null);
      }
      setUserToToggle(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      const targetId = userToDelete.id || userToDelete.userId || userToDelete.email;
      await deleteUser(targetId);
      if (inspectingUser && (inspectingUser.id === targetId || inspectingUser.email === userToDelete.email)) {
        setInspectingUser(null);
      }
      setUserToDelete(null);
    }
  };

  // Get posts submitted by inspectingUser
  const userPosts = inspectingUser 
    ? complaints.filter((c) => c.userId === inspectingUser.id || c.userEmail === inspectingUser.email || c.userName?.toLowerCase() === inspectingUser.name?.toLowerCase())
    : [];

  // Get posts reposted / supported by inspectingUser
  const userReposts = inspectingUser
    ? complaints.filter((c) => c.userReposted || c.repostReasons?.some((r) => r.includes(inspectingUser.name)))
    : [];

  // Total Upvotes received by inspectingUser
  const totalUpvotesEarned = userPosts.reduce((sum, p) => sum + (p.upvotes || 0), 0);

  return (
    <div className={`page-admin-users min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      isDark ? 'bg-slate-900 text-white' : 'bg-civic-gradient text-slate-900'
    }`}>
      <TopNavBar theme={isDark ? 'dark' : 'civic'} />

      {/* CENTERED MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-36 sm:pt-32 pb-32 sm:pb-24 flex-1 w-full flex flex-col md:flex-row gap-8 items-start relative z-10">
        <SidebarMenu type="admin" />

        <div className="flex-1 w-full max-w-4xl min-w-0 content-with-sidebar">
          {/* Header Card */}
          <div className={`p-6 sm:p-8 rounded-3xl mb-6 border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 animate-fadeIn ${
            isDark ? 'bg-slate-800/90 border-slate-700' : 'glass-civic border-white/90'
          }`}>
            <div className="text-center sm:text-left">
              <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider font-serif bg-blue-100 dark:bg-blue-900/60 px-3.5 py-1 rounded-full shadow-sm">
                👥 Registered Users Oversight
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900 dark:text-white mt-2">
                Users Management
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                Manage citizen access: block/unblock accounts, delete users, or inspect profile activity.
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg flex-shrink-0">
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          {/* ULTRA-PROFESSIONAL SEARCH & FILTER BAR */}
          <div className={`p-3.5 sm:p-4 rounded-3xl mb-6 border shadow-lg flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-slate-800/90 border-slate-700' : 'glass-civic border-white/90'
          }`}>
            {/* SEAMLESS BORDERLESS SEARCH BAR */}
            <div 
              style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#cbd5e1',
              }}
              className="flex items-center gap-3 flex-1 max-w-md px-4 py-3 rounded-full border shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
            >
              <Search className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.2] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search citizens by name or email address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  boxShadow: 'none',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  width: '100%',
                  padding: '0',
                  margin: '0',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* HIGH-CONTRAST BLOCKED USERS ONLY TOGGLE BUTTON */}
            <button
              onClick={() => setShowBlockedOnly(!showBlockedOnly)}
              style={{
                backgroundColor: showBlockedOnly ? '#e11d48' : (isDark ? '#1e293b' : '#ffffff'),
                color: showBlockedOnly ? '#ffffff' : (isDark ? '#ffffff' : '#0f172a'),
                borderColor: showBlockedOnly ? '#be123c' : (isDark ? '#475569' : '#cbd5e1'),
              }}
              className="flex items-center gap-2 text-xs font-serif font-extrabold py-3 px-5 rounded-full border shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Ban className={`w-4 h-4 ${showBlockedOnly ? 'text-white' : 'text-rose-500'}`} />
              <span>Blocked Users Only</span>
            </button>
          </div>

          {/* Users List */}
          <div className={`p-6 rounded-3xl border shadow-xl max-h-[560px] overflow-y-auto ${
            isDark ? 'bg-slate-800/90 border-slate-700' : 'glass-civic border-white/90'
          }`}>
            <div className="flex flex-col gap-3">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => {
                  const isUserBlocked = Boolean(user.isBlocked || user.blocked);
                  const userIdKey = user.id || user.userId || user.email || 'usr-item';
                  
                  return (
                    <div
                      key={`user-card-${userIdKey}-${idx}`}
                      onClick={() => {
                        setInspectingUser(user);
                        setActiveTab('posts');
                      }}
                      style={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                      }}
                      className="p-4 rounded-2xl border flex items-center justify-between gap-4 hover:scale-[1.01] transition-all cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-slate-400 font-serif min-w-[20px] flex-shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow flex-shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white font-serif flex items-center gap-2 truncate">
                            <span>{user.name}</span>
                            {isUserBlocked && (
                              <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 rounded-full text-[10px] font-extrabold border border-rose-300 dark:border-rose-700 flex-shrink-0">
                                Blocked
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                            {user.email} • {user.phone || '+91 9876543210'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* BLOCK / UNBLOCK BUTTON */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToToggle({ id: userIdKey, name: user.name, isBlocked: isUserBlocked, email: user.email });
                          }}
                          className={`pill-input text-xs font-extrabold py-1.5 px-3.5 cursor-pointer shadow-sm ${
                            isUserBlocked 
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-200' 
                              : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 hover:bg-rose-200'
                          }`}
                        >
                          {isUserBlocked ? 'Unblock User' : 'Block User'}
                        </button>

                        {/* DELETE USER BUTTON */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete({ id: userIdKey, name: user.name, email: user.email });
                          }}
                          className="p-2 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                          title="Permanently Delete User Account"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2]" />
                        </button>

                        {/* INSPECT DETAILS ARROW */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingUser(user);
                            setActiveTab('posts');
                          }}
                          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-500 dark:text-slate-300 group-hover:translate-x-1"
                          title="Inspect Full Profile & Posts"
                        >
                          <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm font-extrabold text-slate-500">No registered users match your search query.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CITIZEN PROFILE INSPECTOR MODAL */}
      {inspectingUser && (
        <div
          onClick={() => setInspectingUser(null)}
          className="fixed inset-0 w-full h-full overflow-y-auto p-3 sm:p-6 flex justify-center items-start pt-24 sm:pt-28 pb-20 transition-all duration-300"
          style={{
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl sm:max-w-4xl rounded-3xl p-5 sm:p-8 shadow-2xl border transition-all animate-fadeIn"
            style={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#334155' : '#cbd5e1',
              color: isDark ? '#ffffff' : '#0f172a',
            }}
          >
            {/* TOP MODAL HEADER WITH CLOSE BUTTON */}
            <div className="pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-serif bg-blue-100 dark:bg-blue-900/60 px-3.5 py-1 rounded-full shadow-sm">
                  🔍 Citizen Profile Inspector
                </span>
              </div>

              <button
                onClick={() => setInspectingUser(null)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-colors cursor-pointer"
                title="Close Profile View"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* USER HIGHLIGHT PROFILE CARD */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow">
                  {inspectingUser.name ? inspectingUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{inspectingUser.name}</span>
                    {(inspectingUser.isBlocked || inspectingUser.blocked) && (
                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-extrabold border border-rose-300">
                        Blocked
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {inspectingUser.email} • {inspectingUser.phone || '+91 9876543210'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {inspectingUser.location || 'Coimbatore, Tamil Nadu'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUserToToggle({ id: inspectingUser.id || inspectingUser.userId || inspectingUser.email, name: inspectingUser.name, isBlocked: Boolean(inspectingUser.isBlocked || inspectingUser.blocked), email: inspectingUser.email })}
                  className={`pill-input text-xs font-extrabold py-2 px-4 cursor-pointer shadow-sm ${
                    (inspectingUser.isBlocked || inspectingUser.blocked)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {(inspectingUser.isBlocked || inspectingUser.blocked) ? 'Unblock User' : 'Block User'}
                </button>
                <button
                  onClick={() => setUserToDelete({ id: inspectingUser.id || inspectingUser.userId || inspectingUser.email, name: inspectingUser.name, email: inspectingUser.email })}
                  className="p-2 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors cursor-pointer"
                  title="Delete Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB SELECTION */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-2.5 px-5 text-xs font-extrabold font-serif border-b-2 cursor-pointer transition-all ${
                  activeTab === 'posts'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Submitted Posts ({userPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('reposts')}
                className={`py-2.5 px-5 text-xs font-extrabold font-serif border-b-2 cursor-pointer transition-all ${
                  activeTab === 'reposts'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Supported / Reposted ({userReposts.length})
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="max-h-[420px] overflow-y-auto pr-2">
              {activeTab === 'posts' ? (
                userPosts.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {userPosts.map((post) => (
                      <ComplaintCard key={post.id} complaint={post} isAdmin={true} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs font-extrabold text-slate-500 py-8">
                    No submitted complaints found for this citizen.
                  </p>
                )
              ) : (
                userReposts.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {userReposts.map((post) => (
                      <ComplaintCard key={post.id} complaint={post} isAdmin={true} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs font-extrabold text-slate-500 py-8">
                    No supported/reposted complaints found for this citizen.
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* BLOCK / UNBLOCK CONFIRMATION MODAL */}
      {userToToggle && (
        <div
          onClick={() => setUserToToggle(null)}
          className="fixed inset-0 w-full h-full p-4 flex justify-center items-center transition-all duration-300"
          style={{
            zIndex: 999999,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-md rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center shadow-2xl border animate-scaleIn"
            style={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#ffffff' : '#0f172a',
              boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-inner ${
              userToToggle.isBlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }`}>
              {userToToggle.isBlocked ? (
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              ) : (
                <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
              )}
            </div>

            <h3 className="text-lg font-extrabold font-serif text-slate-900 dark:text-white mb-2">
              {userToToggle.isBlocked ? 'Unblock Citizen Account?' : 'Block Citizen Account?'}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-6 leading-relaxed">
              {userToToggle.isBlocked
                ? `Are you sure you want to unblock ${userToToggle.name}? They will regain full access to sign in and post grievances.`
                : `Are you sure you want to block ${userToToggle.name}? When blocked, they will be prevented from logging in.`}
            </p>

            <div className="flex items-center justify-center gap-3 w-full">
              <button
                onClick={() => setUserToToggle(null)}
                className="px-5 py-3 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmToggle}
                className={`pill-button-dark py-2.5 px-6 text-xs text-white font-extrabold shadow-md cursor-pointer ${
                  userToToggle.isBlocked
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {userToToggle.isBlocked ? 'Confirm Unblock' : 'Confirm Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div
          onClick={() => setUserToDelete(null)}
          className="fixed inset-0 w-full h-full p-4 flex justify-center items-center transition-all duration-300"
          style={{
            zIndex: 999999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-md rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center shadow-2xl border animate-scaleIn"
            style={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#ffffff' : '#0f172a',
              boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3 shadow-inner">
              <Trash2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-extrabold font-serif text-slate-900 dark:text-white mb-2">
              Permanently Delete User?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-6 leading-relaxed">
              Are you sure you want to delete <strong>{userToDelete.name}</strong> ({userToDelete.email})? This action will permanently remove their account from the system.
            </p>

            <div className="flex items-center justify-center gap-3 w-full">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-5 py-3 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                className="pill-button-dark py-2.5 px-6 text-xs text-white font-extrabold shadow-md cursor-pointer bg-rose-600 hover:bg-rose-700"
              >
                Permanently Delete 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatbotFAB />
    </div>
  );
};
