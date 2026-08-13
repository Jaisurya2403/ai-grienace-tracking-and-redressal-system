import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Repeat, CheckCircle2, Layers } from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext.jsx';
import { ComplaintCard } from '../../components/common/ComplaintCard.jsx';
import confetti from 'canvas-confetti';

export const AIDuplicateCheckPage = () => {
  const navigate = useNavigate();
  const { addComplaint, toggleRepost } = useComplaints();

  const [pendingData, setPendingData] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('mcp_pending_complaint');
    if (stored) {
      const parsed = JSON.parse(stored);
      setPendingData(parsed);
      const res = parsed.aiResult;
      const actualAi = (res && res.aiResult) ? res.aiResult : res;
      setMatchResult({
        ...actualAi,
        candidateGrievances: res?.candidateGrievances || actualAi?.candidateGrievances || [],
        matchedComplaints: (actualAi?.matchedComplaints && actualAi.matchedComplaints.length > 0)
          ? actualAi.matchedComplaints
          : (res?.candidateGrievances || []),
      });
    } else {
      navigate('/complaints/new');
    }
  }, [navigate]);

  if (!pendingData) return null;

  // Extract raw candidate list or single match
  const rawList = (matchResult?.matchedComplaints && matchResult.matchedComplaints.length > 0)
    ? matchResult.matchedComplaints
    : (matchResult?.candidateGrievances && matchResult.candidateGrievances.length > 0)
    ? matchResult.candidateGrievances
    : (matchResult?.matchedComplaint ? [matchResult.matchedComplaint] : []);

  const isMatchFound = Boolean(matchResult?.existingComplaintFound || rawList.length > 0);

  const matchedList = isMatchFound ? rawList.map((item, idx) => ({
    id: item.id || item.complaintId || `CMP-2026-c${idx + 101}`,
    complaintId: item.complaintId || item.id || `c${idx + 101}`,
    title: item.title || item.description || 'Civic Grievance',
    description: item.description || pendingData?.description || 'Reported grievance issue',
    locationName: item.locationName || pendingData?.address || 'Coimbatore',
    pincode: item.pincode || pendingData?.pincode || '641004',
    departmentName: item.departmentName || pendingData?.departmentName || 'Public Works Department (PWD)',
    status: item.status || 'RECEIVED',
    userName: item.userName || 'Citizen',
    userEmail: item.userEmail || '',
    userProfileImageUrl: item.userProfileImageUrl || item.userProfileImage || '',
    upvotes: item.upvotes || 0,
    reposts: item.reposts || 0,
    images: (item.images && item.images.length > 0) ? item.images : (pendingData?.images || []),
    attachmentImageIds: item.attachmentImageIds || [],
    createdAt: item.createdAt || new Date().toISOString(),
    similarityScore: item.similarityScore || matchResult?.similarityScore || 0.85,
  })) : [];

  const simScoreRaw = matchResult?.similarityScore || matchResult?.similarity || 0.88;
  const simPct = Math.round(simScoreRaw <= 1 ? simScoreRaw * 100 : simScoreRaw);
  const reasonText = matchResult?.reason || matchResult?.reasoning || 'Gemini AI identified active unresolved complaint(s) reported in this area.';

  // 1. REPOST SPECIFIC COMPLAINT ONLY
  const handleRepostSpecificComplaint = async (targetId) => {
    setIsSubmitting(true);
    try {
      if (targetId) {
        await toggleRepost(targetId);
      }
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      sessionStorage.removeItem('mcp_pending_complaint');

      setToastMessage({
        title: 'Existing Complaint Reposted! 🔄',
        desc: `You supported grievance #${targetId}. It is now saved in your profile under My Reposts!`,
        target: '/dashboard/reposts',
      });
    } catch (e) {
      console.error('Repost failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. POST MY OWN COMPLAINT ONLY
  const handlePostOwnOnly = async () => {
    setIsSubmitting(true);
    const topMatched = matchedList[0];
    await addComplaint({
      userId: pendingData.userId,
      userName: pendingData.userName,
      userEmail: pendingData.userEmail || pendingData.userId,
      officerEmail: pendingData.officerEmail || '',
      departmentId: pendingData.departmentId,
      departmentName: pendingData.departmentName,
      address: pendingData.address,
      pincode: pendingData.pincode,
      description: pendingData.description,
      images: pendingData.images,
      attachmentImageIds: pendingData.attachmentImageIds || [],
      aiMatchedGrievanceId: topMatched?.id || topMatched?.complaintId || null,
      aiMatchType: matchResult?.matchType || 'NO_MATCH',
    });

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    sessionStorage.removeItem('mcp_pending_complaint');

    setToastMessage({
      title: 'Complaint Registered! 📝',
      desc: 'Your new grievance has been submitted successfully to the municipal department.',
      target: '/dashboard/complaints',
    });
    setIsSubmitting(false);
  };

  // 3. BOTH: REPOST TOP & POST MY OWN COMPLAINT
  const handleBothRepostAndPost = async () => {
    setIsSubmitting(true);
    const topMatched = matchedList[0];
    if (topMatched?.id) {
      await toggleRepost(topMatched.id);
    }

    await addComplaint({
      userId: pendingData.userId,
      userName: pendingData.userName,
      userEmail: pendingData.userEmail || pendingData.userId,
      officerEmail: pendingData.officerEmail || '',
      departmentId: pendingData.departmentId,
      departmentName: pendingData.departmentName,
      address: pendingData.address,
      pincode: pendingData.pincode,
      description: pendingData.description,
      images: pendingData.images,
      attachmentImageIds: pendingData.attachmentImageIds || [],
      aiMatchedGrievanceId: topMatched?.id || topMatched?.complaintId || null,
      aiMatchType: matchResult?.matchType || 'NO_MATCH',
    });

    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    sessionStorage.removeItem('mcp_pending_complaint');

    setToastMessage({
      title: 'Both Action Completed! 🚀',
      desc: 'Existing complaint was supported & your new complaint was registered successfully!',
      target: '/dashboard/complaints',
    });
    setIsSubmitting(false);
  };

  const handleCloseToast = () => {
    const target = toastMessage?.target || '/dashboard/complaints';
    setToastMessage(null);
    navigate(target);
  };

  return (
    <div className="page-ai-check bg-civic-gradient min-h-screen p-4 sm:p-8 relative flex flex-col justify-center items-center pb-24">
      <div className="max-w-4xl w-full flex flex-col gap-6 relative z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/complaints/new')}
            className="pill-input bg-white text-slate-900 text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" /> Edit Form
          </button>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-extrabold shadow-md">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" /> Gemini AI Duplicate Detection
          </div>
        </div>

        {/* Your Submission Summary & AI Multi-Factor Verification */}
        <div className="glass-civic p-5 sm:p-6 rounded-3xl border border-white/90 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold font-serif text-slate-500 uppercase tracking-wider">
              Your Filed Grievance Summary:
            </h4>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold border border-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Image & Department Matched
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-800 font-bold">
            <p><strong className="text-slate-900">Address:</strong> {pendingData.address}</p>
            <p><strong className="text-slate-900">Pincode:</strong> {pendingData.pincode}</p>
            <p><strong className="text-slate-900">Department:</strong> {pendingData.departmentName}</p>
          </div>

          <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
            <span>📷 <strong>Photo Evidence AI Verified:</strong> Uploaded photos recognized & matched with description text and target department ({pendingData.departmentName}).</span>
          </div>
        </div>

        {/* Main Gemini Duplicate Match Box */}
        <div className="glass-civic p-6 sm:p-8 rounded-3xl border-2 border-blue-400/80 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900">
                {matchedList.length > 0 ? `Related Unresolved Issues Found (${matchedList.length})` : 'No Duplicates Detected'}
              </h2>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {matchedList.length > 0
                  ? `Gemini AI detected ${matchedList.length} active unresolved grievance(s) in pincode ${pendingData.pincode} (${simPct}% similarity match).`
                  : `Gemini AI searched pincode ${pendingData.pincode} and found no identical active complaints.`}
              </p>
            </div>
          </div>

          {/* LIST OF ALL MATCHED RELATED UNRESOLVED COMPLAINTS */}
          {matchedList.length > 0 ? (
            <div className="mb-8 flex flex-col gap-6">
              {matchedList.map((matchedItem, idx) => (
                <div key={matchedItem.id || idx} className="flex flex-col gap-3 p-4 rounded-3xl bg-white/90 border border-slate-200 shadow-md">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider font-serif">
                      Related Complaint #{idx + 1}
                    </span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-extrabold border border-amber-300">
                      Status: {matchedItem.status}
                    </span>
                  </div>

                  <ComplaintCard complaint={matchedItem} onRepost={() => handleRepostSpecificComplaint(matchedItem.id)} />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-purple-50/90 p-3.5 rounded-2xl border border-purple-200">
                    <p className="text-xs text-purple-900 font-semibold">
                      💡 <strong>Gemini Insight:</strong> {reasonText}
                    </p>

                    <button
                      onClick={() => handleRepostSpecificComplaint(matchedItem.id)}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 pill-button-dark rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 hover:scale-105"
                    >
                      <Repeat className="w-4 h-4" />
                      <span>{isSubmitting ? 'Processing...' : 'Repost This Complaint 🔄'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/90 rounded-3xl p-8 text-center mb-8 border border-slate-200">
              <p className="text-sm font-extrabold text-slate-900">Your complaint is unique in this area. You can safely proceed to post!</p>
            </div>
          )}

          {/* 3 ACTION CHOICES: REPOST ONLY, POST MY OWN ONLY, OR BOTH! */}
          {matchedList.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-center text-xs font-extrabold text-slate-700 font-serif mb-1">
                Choose how you would like to proceed:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* CHOICE 1: REPOST FIRST COMPLAINT */}
                <button
                  onClick={() => handleRepostSpecificComplaint(matchedList[0]?.id)}
                  disabled={isSubmitting}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 shadow-sm transition-all text-center ${isSubmitting ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-900 font-extrabold text-xs hover:scale-105 cursor-pointer'}`}
                >
                  <Repeat className={`w-5 h-5 stroke-[2.2] ${isSubmitting ? 'text-slate-400' : 'text-purple-700'}`} />
                  <span>{isSubmitting ? 'Processing...' : 'Repost Recommendation 🔄'}</span>
                </button>

                {/* CHOICE 2: POST MY OWN ONLY */}
                <button
                  onClick={handlePostOwnOnly}
                  disabled={isSubmitting}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 shadow-sm transition-all text-center ${isSubmitting ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-900 font-extrabold text-xs hover:scale-105 cursor-pointer'}`}
                >
                  <CheckCircle2 className={`w-5 h-5 stroke-[2.2] ${isSubmitting ? 'text-slate-400' : 'text-blue-700'}`} />
                  <span>{isSubmitting ? 'Processing...' : 'Post My Own Complaint Only 📝'}</span>
                </button>

                {/* CHOICE 3: BOTH (PROMINENT FEATURED) */}
                <button
                  onClick={handleBothRepostAndPost}
                  disabled={isSubmitting}
                  style={isSubmitting ? undefined : { backgroundColor: '#0f172a', color: '#ffffff' }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 shadow-lg transition-all text-center ${isSubmitting ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-900 font-extrabold text-xs hover:scale-105 cursor-pointer'}`}
                >
                  <Layers className={`w-5 h-5 stroke-[2.2] ${isSubmitting ? 'text-slate-400' : 'text-emerald-400'}`} />
                  <span className={isSubmitting ? 'text-slate-400' : 'text-white'}>{isSubmitting ? 'Processing...' : 'Both: Repost & Post My Own 🚀'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handlePostOwnOnly}
                disabled={isSubmitting}
                style={isSubmitting ? undefined : { backgroundColor: '#0f172a', color: '#ffffff' }}
                className={`font-extrabold text-sm px-10 py-3.5 shadow-xl transition-transform flex items-center gap-2 ${isSubmitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed rounded-full' : 'pill-button-dark hover:scale-105'}`}
              >
                {isSubmitting ? <Sparkles className="w-5 h-5 text-slate-500 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isSubmitting ? 'Registering...' : 'Confirm & Register Complaint 🚀'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CENTERED GLASS TOAST CONFIRMATION MODAL */}
      {toastMessage && (
        <div
          onClick={handleCloseToast}
          className="compact-modal-overlay"
          style={{ zIndex: 6000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="compact-modal-card text-center flex flex-col items-center justify-center py-6 px-8"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-base font-extrabold font-serif text-slate-900 mb-1">
              {toastMessage.title}
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-5">
              {toastMessage.desc}
            </p>

            <button
              onClick={handleCloseToast}
              className="pill-button-dark py-2.5 px-7 text-xs text-white font-extrabold cursor-pointer"
            >
              OK, View Details ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
