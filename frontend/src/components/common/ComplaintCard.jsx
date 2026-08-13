import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, Repeat, AlertTriangle, ChevronLeft, ChevronRight, RotateCcw, Trash2, Send, CheckCircle2, Clock, MapPin, Tag, Video, Check, AlertCircle, FileText, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const formatDateTimeDDMMYYYY = (rawDate) => {
  if (!rawDate) return '';
  try {
    const rawStr = String(rawDate);
    const hasTime = rawStr.includes('T') || rawStr.includes(':') || rawStr.includes(' ');
    const d = new Date(rawStr);
    
    if (isNaN(d.getTime())) {
      const parts = rawStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      return rawStr;
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (!hasTime) {
      return `${day}/${month}/${year}`;
    }
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  } catch (e) {
    return String(rawDate);
  }
};

export const ComplaintCard = ({ complaint, isAdmin = false, onRepost }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toggleUpvote, toggleRepost, reportComplaint, cycleStatus, deleteComplaint, addFeedback, users } = useComplaints();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  // Modal States
  const [showReportReasonModal, setShowReportReasonModal] = useState(false);
  const [reportReasonText, setReportReasonText] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Resolve Author Profile Image
  const authorUser = users?.find(u => 
    (u.id && (u.id === complaint.userId || u.id === complaint.userEmail)) ||
    (u.userId && (u.userId === complaint.userId || u.userId === complaint.userEmail)) ||
    (u.email && (u.email.toLowerCase() === complaint.userEmail?.toLowerCase() || u.email.toLowerCase() === complaint.userId?.toLowerCase())) ||
    (u.name && complaint.userName && (
      u.name.toLowerCase() === complaint.userName.toLowerCase() ||
      u.name.toLowerCase().startsWith(complaint.userName.toLowerCase()) ||
      complaint.userName.toLowerCase().startsWith(u.name.toLowerCase())
    ))
  );

  const isPostOwner = user && (
    user.id === complaint.userId || 
    user.email === complaint.userEmail || 
    user.name === complaint.userName ||
    (user.name && complaint.userName && (
      user.name.toLowerCase() === complaint.userName.toLowerCase() ||
      user.name.toLowerCase().startsWith(complaint.userName.toLowerCase()) ||
      complaint.userName.toLowerCase().startsWith(user.name.toLowerCase())
    ))
  );
  
  const authorAvatar = isPostOwner 
    ? (user.profileImage || user.profileImageUrl || authorUser?.profileImageUrl || authorUser?.profileImage || complaint.userProfileImageUrl)
    : (authorUser?.profileImageUrl || authorUser?.profileImage || complaint.userProfileImageUrl);

  const images = complaint.images && complaint.images.length > 0 ? complaint.images : [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  ];

  const isOwner = user?.id === complaint.userId || user?.name === complaint.userName || complaint.userId === 'usr-1' || complaint.userName === 'Aarav Sharma';

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const handleRepostClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated && !user) {
      navigate('/login');
      return;
    }
    toggleRepost(complaint.id);
    if (onRepost) onRepost();
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated && !user) {
      navigate('/login');
      return;
    }
    setShowDetailModal(false);
    setShowReportReasonModal(true);
  };

  const confirmReportSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    reportComplaint(complaint.id, reportReasonText);
    setShowReportReasonModal(false);
    setReportReasonText('');
  };

  const confirmDelete = (e) => {
    if (e) e.stopPropagation();
    deleteComplaint(complaint.id);
    setShowDeleteModal(false);
    setShowDetailModal(false);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (feedbackText.trim()) {
      addFeedback(complaint.id, 5, feedbackText);
      setSubmittedFeedback(true);
    }
  };

  const getStatusStepIndex = (status) => {
    switch (status) {
      case 'Resolved':
      case 'COMPLETED':
        return 4;
      case 'In Progress':
      case 'ACTION_IN_PROGRESS':
        return 3;
      case 'Visited':
      case 'VISITED':
        return 2;
      case 'Rejected':
      case 'REJECTED':
        return 1;
      default:
        return 2;
    }
  };

  const currentStep = getStatusStepIndex(complaint.status);
  const formattedGrievanceId = complaint.id.startsWith('CMP') ? complaint.id : `CMP-2026-${complaint.id}`;
  const postedDateTimeFormatted = formatDateTimeDDMMYYYY(complaint.createdAt || complaint.postedDate);
  const isCompleted = complaint.status === 'COMPLETED' || complaint.status === 'Resolved' || complaint.resolvedDate || complaint.resolvedAt;
  const statusDisplayText = complaint.status === 'EMAIL_SENT' ? 'RECEIVED' : complaint.status;
  const cleanGrievanceId = formattedGrievanceId.length > 22 ? `${formattedGrievanceId.substring(0, 18)}...` : formattedGrievanceId;

  return (
    <>
      {/* MAIN CARD CONTAINER - Spacious & Executive Design */}
      <div
        onClick={() => setShowDetailModal(true)}
        className={`glass-civic rounded-3xl overflow-hidden p-5 sm:p-6 shadow-xl border border-white/90 hover-lift mb-6 transition-all cursor-pointer ${
          isAdmin ? 'border-indigo-900/30' : ''
        }`}
      >
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow overflow-hidden flex-shrink-0"
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                minHeight: '38px',
                maxWidth: '38px',
                maxHeight: '38px',
              }}
            >
              {authorAvatar ? (
                <img 
                  src={authorAvatar} 
                  alt={complaint.userName} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                />
              ) : (
                <span className="font-serif font-extrabold text-xs uppercase">{complaint.userName ? complaint.userName.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white font-serif leading-tight">{complaint.userName}</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> {postedDateTimeFormatted}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> {complaint.pincode}
                </span>
              </div>
            </div>
          </div>
                   <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wider rounded-full shadow-xs ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : complaint.status === 'In Progress' || complaint.status === 'ACTION_IN_PROGRESS'
                ? 'bg-blue-100 text-blue-800'
                : complaint.status === 'Visited' || complaint.status === 'VISITED'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {statusDisplayText}
            </span>

            {/* DELETE BUTTON FOR POST OWNER OR ADMIN */}
            {(isOwner || isAdmin) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                className="p-1.5 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors cursor-pointer"
                title="Delete Post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {complaint.redirectedFromDeptName && (
          <div className="bg-purple-50 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> Redirected from {complaint.redirectedFromDeptName}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-3">
          {/* Media Preview Column */}
          <div className="md:col-span-5 flex flex-col gap-2">
            {images.length > 1 && (
  <div className="w-full flex justify-center">
    <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-1 rounded-full text-black text-xs font-bold shadow-lg border border-white/20"><button
                    type="button"
                    onClick={handlePrevImage}
                    disabled={currentImageIndex === 0}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-opacity border-none outline-none ${
                      currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:bg-white/20 cursor-pointer'
                    }`}
                    title="Previous Image"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-black" />
                  </button>

                  <span className="text-[11px] font-mono font-extrabold px-1 text-black">
                    {currentImageIndex + 1}/{images.length}
                  </span>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    disabled={currentImageIndex === images.length - 1}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-opacity border-none outline-none ${
                      currentImageIndex === images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:bg-white/20 cursor-pointer'
                    }`}
                    title="Next Image"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-black" />
                  </button>
                </div></div>
              )}
            <div className="relative group rounded-2xl overflow-hidden h-48 sm:h-52 bg-slate-900 shadow-md w-full flex items-center justify-center">
              <img
                src={images[currentImageIndex] || images[0]}
                alt="Complaint photo evidence"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                }}
              />

              
            </div>

            {complaint.videoUrl && (
              <div className="video-preview-box h-24 rounded-xl overflow-hidden shadow-sm">
                <video src={complaint.videoUrl} controls className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3">
            <div>
              {/* Department Name Tag */}
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                  {complaint.departmentName}
                </span>
              </div>

              {/* Uploaded Address (Clean Borderless Text) */}
              <div className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium mb-3">
                <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="font-extrabold text-slate-900 dark:text-white">Uploaded Address:</strong> {complaint.address || complaint.locationName || 'Coimbatore, Tamil Nadu'}
                </span>
              </div>

              {/* Grievance Description (Clean Borderless Typography) */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Grievance Description
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-3 leading-relaxed pl-5">
                  {complaint.description || 'No description details provided.'}
                </p>
              </div>

              {/* Completed Date / Officer Progress Row */}
              {isCompleted ? (
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span><strong className="font-extrabold text-emerald-900 dark:text-emerald-200">Completed Date:</strong> {formatDateTimeDDMMYYYY(complaint.resolvedAt || complaint.resolvedDate || complaint.createdAt)}</span>
                </div>
              ) : complaint.officerNotes ? (
                <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-start gap-1.5">
                  <span className="font-extrabold text-blue-700 uppercase flex-shrink-0">Progress:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{complaint.officerNotes}</span>
                </div>
              ) : null}
            </div>

            {/* Metric Footer */}
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-700/80 pt-2.5">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-extrabold">
                  <ThumbsUp className="w-4 h-4 text-blue-600" /> {complaint.upvotes} Upvotes
                </span>
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-extrabold">
                  <Repeat className="w-4 h-4 text-purple-600" /> {complaint.reposts} Reposts
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]" title={formattedGrievanceId}>
                ID: {cleanGrievanceId}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        {!isAdmin ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3">
            <div className="flex items-center gap-2">
              {/* UPVOTE BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAuthenticated && !user) {
                    navigate('/login');
                    return;
                  }
                  toggleUpvote(complaint.id);
                }}
                className={`pill-input flex items-center gap-1.5 text-xs font-extrabold transition-all ${
                  complaint.userUpvoted
                    ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-md scale-105'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-50 border-slate-300'
                }`}
              >
                <ThumbsUp className="w-4 h-4" fill={complaint.userUpvoted ? "currentColor" : "none"} strokeWidth={complaint.userUpvoted ? 2 : 1.5} />
                <span>{complaint.userUpvoted ? 'Upvoted' : 'Upvote'} ({complaint.upvotes})</span>
              </button>

              {/* REPOST BUTTON */}
              <button
                onClick={handleRepostClick}
                className={`pill-input flex items-center gap-1.5 text-xs font-extrabold transition-all ${
                  complaint.userReposted
                    ? 'bg-purple-100 text-purple-700 border-purple-400 shadow-md scale-105'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-50 border-slate-300'
                }`}
              >
                <Repeat className="w-4 h-4" strokeWidth={complaint.userReposted ? 2.5 : 1.5} />
                <span>{complaint.userReposted ? 'Reposted' : 'Repost'} ({complaint.reposts})</span>
              </button>

              {/* DELETE POST BUTTON FOR OWNER */}
            
            </div>

            {/* REPORT BUTTON */}
            <button
              onClick={handleReportClick}
              disabled={complaint.userReported}
              className={`pill-input flex items-center gap-1.5 text-xs font-extrabold border-slate-300 transition-all ${
                complaint.userReported
                  ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" fill={complaint.userReported ? "currentColor" : "none"} />
              <span>{complaint.userReported ? 'Reported' : 'Report'}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleStatus(complaint.id);
              }}
              className="pill-button-indigo text-xs py-2 px-4 shadow-sm text-white font-extrabold"
            >
              Process Started ➔ ({complaint.status})
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cycleStatus(complaint.id);
                }}
                className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold hover:bg-emerald-200"
              >
                Mark Resolved
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteComplaint(complaint.id);
                }}
                className="p-2 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200"
                title="Delete Complaint"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION GLASS MODAL */}
      {showDeleteModal && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteModal(false);
          }}
          className="compact-modal-overlay"
          style={{ zIndex: 6500 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="compact-modal-card text-center flex flex-col items-center justify-center py-6 px-6"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3 shadow-inner">
              <Trash2 className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h3 className="text-base font-extrabold font-serif text-slate-900 mb-1">
              Delete Grievance Post?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-6">
              Are you sure you want to delete this reported issue ({formattedGrievanceId})? This action cannot be undone.
            </p>

            <div className="flex items-center gap-3 w-full justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 rounded-full border border-slate-300 text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="pill-button-dark py-2 px-5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT REASON PROMPT MODAL */}
      {showReportReasonModal && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowReportReasonModal(false);
          }}
          className="compact-modal-overlay"
          style={{ zIndex: 5000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="compact-modal-card text-left flex flex-col gap-4"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReportReasonModal(false);
              }}
              className="compact-modal-close-btn"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold font-serif text-slate-900">
                Report Grievance Issue
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Please enter the reason for reporting complaint #{formattedGrievanceId}:
            </p>

            <textarea
              required
              rows={3}
              placeholder="e.g. Inaccurate location, duplicate post, or inappropriate media..."
              value={reportReasonText}
              onChange={(e) => setReportReasonText(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />

            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReportReasonModal(false);
                }}
                className="px-4 py-2 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReportSubmit}
                className="pill-button-dark py-2 px-5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL POST WIDESCREEN DETAIL MODAL */}
      {showDetailModal && (
        <div
          onClick={() => setShowDetailModal(false)}
          className="detail-modal-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="detail-modal-card"
          >
            {/* Top Close & Back Button */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="pill-input bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 py-1.5 px-3 border-slate-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to List
              </button>

              <div className="flex items-center gap-2">
                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="compact-modal-close-btn"
                  style={{ position: 'static' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* FLIPKART STYLE ORDER TRACKER PROGRESS TIMELINE */}
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 mb-6 shadow-inner">
              <h4 className="text-xs font-bold font-serif text-slate-500 uppercase tracking-wider mb-4">
                Grievance Resolution Progress Tracker:
              </h4>

              <div className="tracker-timeline-grid">
                {/* Step 1: Registered */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">Registered</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{complaint.postedDate}</p>
                  </div>
                </div>

                {/* Step 2: Visited */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm ${
                  currentStep >= 2 ? 'bg-purple-50 border-purple-300' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {currentStep >= 2 ? '✓' : '2'}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">Visited</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Officer Opened Link</p>
                  </div>
                </div>

                {/* Step 3: In Progress */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm ${
                  currentStep >= 3 ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {currentStep >= 3 ? '✓' : '3'}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">In Progress</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Field Inspection</p>
                  </div>
                </div>

                {/* Step 4: Resolved */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm ${
                  currentStep === 4 ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {currentStep === 4 ? '✓' : '4'}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">Resolved</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {complaint.resolvedDate || 'Pending Action'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DETAIL MODAL GRID CONTENT */}
            <div className="detail-modal-grid">
              {/* Left Column: Full Media Gallery */}
              <div className="flex flex-col gap-4">
                {images.length > 1 && (
  <div className="w-full flex justify-center">
    <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-1 rounded-full text-black text-xs font-bold shadow-lg border border-white/20"><button
                    type="button"
                    onClick={handlePrevImage}
                    disabled={currentImageIndex === 0}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-opacity border-none outline-none ${
                      currentImageIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'opacity-100 hover:bg-white/20 cursor-pointer'
                    }`}
                    title="Previous Image"
                  >
                    <ChevronLeft className="w-4 h-4 text-black" />
                  </button>

                  <span className="text-[11px] font-mono font-extrabold px-1 text-black">
                    {currentImageIndex + 1}/{images.length}
                  </span>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    disabled={currentImageIndex === images.length - 1}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-opacity border-none outline-none ${
                      currentImageIndex === images.length - 1 ? 'opacity-40 cursor-not-allowed' : 'opacity-100 hover:bg-white/20 cursor-pointer'
                    }`}
                    title="Next Image"
                  >
                    <ChevronRight className="w-4 h-4 text-black" />
                  </button>
                </div></div>
              )}

                <div className="relative rounded-2xl overflow-hidden h-64 bg-slate-900 shadow-md w-full flex items-center justify-center">
                  <img
                    src={images[currentImageIndex] || images[0]}
                    alt="Grievance evidence large"
                    className="w-full h-full object-cover"
                  />
                  
                </div>

                {complaint.videoUrl && (
                  <div className="rounded-2xl overflow-hidden bg-slate-900 shadow-md">
                    <p className="text-xs font-bold text-white p-2.5 bg-slate-800 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-purple-400" /> Video Evidence Attached
                    </p>
                    <video src={complaint.videoUrl} controls className="w-full max-h-48 object-cover" />
                  </div>
                )}
              </div>

              {/* Right Column: Complete Details & Department Information */}
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      {complaint.departmentName}
                    </span>
                    <span className="text-xs font-bold text-slate-500">ID: {formattedGrievanceId}</span>
                  </div>

                  <h2 className="text-xl font-bold font-serif text-slate-900 mb-2">
                    Grievance at {complaint.address}
                  </h2>

                  <p className="text-xs text-slate-600 font-medium mb-4">
                    <strong>Pincode:</strong> {complaint.pincode} • <strong>Filed On:</strong> {complaint.postedDate}
                  </p>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
                    <h5 className="text-xs font-bold font-serif text-slate-500 uppercase tracking-wider mb-1">
                      Detailed Description:
                    </h5>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line">
                      {complaint.description}
                    </p>
                  </div>

                  {complaint.officerNotes && (
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 mb-4 shadow-sm">
                      <h5 className="text-xs font-bold font-serif text-blue-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Progress:
                      </h5>
                      <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                        {complaint.officerNotes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs font-extrabold text-slate-900 border-t border-slate-200 pt-3">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> {complaint.upvotes} Upvotes</span>
                    <span className="flex items-center gap-1"><Repeat className="w-4 h-4" /> {complaint.reposts} Reposts</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-500" /> {complaint.reports || 0} Reports</span>
                  </div>
                </div>

                {/* Citizen Resolution Feedback Form (Only shown if resolved) */}
                {complaint.status === 'Resolved' && (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 mt-2">
                    <h5 className="text-xs font-bold font-serif text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Citizen Feedback on Resolution:
                    </h5>

                    {complaint.feedback || submittedFeedback ? (
                      <p className="text-xs text-emerald-800 font-bold bg-white p-3 rounded-xl border border-emerald-200">
                        "{complaint.feedback?.comment || feedbackText}"
                      </p>
                    ) : (
                      <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-2">
                        <textarea
                          rows={2}
                          placeholder="Satisfied with the municipal repair? Leave a comment..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-emerald-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                        />
                        <button
                          type="submit"
                          className="pill-button-dark py-1.5 px-4 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold self-end"
                        >
                          Submit Feedback
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer Back Button */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end">
             
            </div>
          </div>
        </div>
      )}
    </>
  );
};
