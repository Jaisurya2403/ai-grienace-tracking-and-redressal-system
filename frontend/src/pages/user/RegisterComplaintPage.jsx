import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Home, Video, Trash2, X, Eye, Sparkles, User, AlertCircle } from 'lucide-react';
import { BackButton } from '../../components/common/BackButton.jsx';
import { useComplaints } from '../../context/ComplaintContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { imagesApi } from '../../api/apiClient.js';
import { matchDepartmentRules, findUnsolvedGrievanceMatches } from '../../services/ruleEngineAiService.js';
import { verifyComplaintConsistency, verifyPincodeAddress } from '../../services/groqAiService.js';

export const RegisterComplaintPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { departments, complaints = [], addComplaint } = useComplaints();

  const [address, setAddress] = useState(user?.location || '');
  const [pincode, setPincode] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [aiMatchedRule, setAiMatchedRule] = useState(null);

  // Up to 5 Images (Starts EMPTY)
  const [imagesList, setImagesList] = useState([]);
  
  // Compact Lightbox Modal View State
  const [viewModalImage, setViewModalImage] = useState(null);

  // Video (Optional - Max 20MB)
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoName, setVideoName] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationWarning, setValidationWarning] = useState(null);
  const [groqMismatchModal, setGroqMismatchModal] = useState(null);

  // Auto-select first department when departments load from backend
  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id);
    }
  }, [departments]);

  // MODULE 1: Real-Time Rule-Based AI Department Recognition & Auto-Fill (100+ keywords)
  useEffect(() => {
    if (!description || description.trim().length < 3) {
      setAiMatchedRule(null);
      return;
    }

    const matched = matchDepartmentRules(description, departments);
    if (matched && matched.deptId) {
      setAiMatchedRule(matched);
      setDepartmentId(matched.deptId);
    } else {
      // RULE D: Route to "Other Department" if no specific department matches
      const otherDept = departments.find(d => 
        d.id === 'dept-other' || 
        d.name?.toLowerCase().includes('other') || 
        d.name?.toLowerCase().includes('general')
      );
      if (otherDept) {
        setDepartmentId(otherDept.id);
        setAiMatchedRule({
          deptId: otherDept.id,
          deptName: otherDept.name,
          confidence: 'GENERAL MATCH',
          matchedKeywords: ['general inquiry']
        });
      }
    }
  }, [description, departments]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const remainingSlots = 5 - imagesList.length;

      if (remainingSlots <= 0) {
        setValidationWarning('You have already reached the maximum limit of 5 photo evidence images.');
        return;
      }

      const filesToProcess = selectedFiles.slice(0, remainingSlots);

      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setImagesList((prev) => [...prev, reader.result]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeSingleImage = (indexToRemove) => {
    setImagesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 20 * 1024 * 1024) {
        setValidationWarning('Video file size exceeds 20MB limit. Please select a smaller video clip.');
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
      setVideoName(file.name);
    }
  };

  const removeVideo = () => {
    setVideoPreview(null);
    setVideoName(null);
  };

  const proceedWithRegistration = async (complaintPayload) => {
    setIsSubmitting(true);

    // Upload files to backend imagesApi
    const uploadedImageIds = [];
    for (const imgItem of imagesList) {
      if (typeof imgItem === 'string' && imgItem.startsWith('data:')) {
        try {
          const res = await fetch(imgItem);
          const blob = await res.blob();
          const file = new File([blob], `evidence-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const uploadRes = await imagesApi.uploadImage(file);
          if (uploadRes && uploadRes.imageId) {
            uploadedImageIds.push(uploadRes.imageId);
          }
        } catch (err) {
          console.warn('Image upload fallback:', err);
          uploadedImageIds.push(`img-${Date.now()}`);
        }
      } else if (typeof imgItem === 'string') {
        uploadedImageIds.push(imgItem);
      }
    }

    const payloadWithUploadedFiles = {
      ...complaintPayload,
      attachmentImageIds: uploadedImageIds,
    };

    // MODULE 2: SEARCH UNSOLVED GRIEVANCES BY PINCODE & DEPARTMENT
    const matchingUnsolved = findUnsolvedGrievanceMatches(pincode, complaintPayload.departmentId, description, complaints);

    // ALWAYS NAVIGATE TO REVIEW PAGE (SHOW MATCHES OR SHOW NO MATCHING FOUND NOTIFICATION CARD)
    const reviewPayload = {
      ...payloadWithUploadedFiles,
      aiResult: {
        existingComplaintFound: Boolean(matchingUnsolved && matchingUnsolved.length > 0),
        matchType: 'RULE_MATCH',
        confidence: 0.95,
        reason: matchingUnsolved && matchingUnsolved.length > 0
          ? `Rule AI identified ${matchingUnsolved.length} unresolved civic problem(s) matching Pincode ${pincode} & Department ${complaintPayload.departmentName}.`
          : `Rule AI searched Pincode ${pincode} for ${complaintPayload.departmentName} and found no unresolved matching complaints.`,
        candidateGrievances: matchingUnsolved || [],
        matchedComplaints: matchingUnsolved || [],
      },
    };
    sessionStorage.setItem('mcp_pending_complaint', JSON.stringify(reviewPayload));
    setIsSubmitting(false);
    navigate('/complaints/new/review');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (imagesList.length === 0) {
      setValidationWarning('Photo evidence is COMPULSORY. Please upload at least 1 photo of the grievance before registering.');
      return;
    }

    if (!pincode || pincode.trim().length !== 6 || isNaN(pincode)) {
      setValidationWarning('Please enter a valid 6-digit Indian PIN code (e.g. 641004).');
      return;
    }

    const selectedDeptId = departmentId || departments[0]?.id || 'dept-pwd';
    const targetDept = departments.find((d) => d.id === selectedDeptId);
    const deptName = targetDept ? targetDept.name : 'Public Works Department (PWD)';

    setIsSubmitting(true);

    // GROQ AI ADVANCED CONSISTENCY & GEOGRAPHIC VERIFICATION (PRIORITY 1: DESC, 2: EVIDENCE, 3: DEPT)
    const groqVerification = await verifyComplaintConsistency(description, deptName, selectedDeptId, imagesList, videoName, pincode, address, departments);
    const geoVerification = await verifyPincodeAddress(address, pincode);

    const deptOfficerEmail = targetDept ? (targetDept.officialEmail || targetDept.email || '') : '';

    const complaintPayload = {
      userId: user?.id || 'usr-superadmin',
      userName: user?.name || 'Super Admin Jai Surya',
      userEmail: user?.email || user?.id || '',
      officerEmail: deptOfficerEmail,
      address,
      pincode,
      departmentId: selectedDeptId,
      departmentName: deptName,
      description,
      images: imagesList,
      attachmentImageIds: [],
      videoUrl: videoPreview,
      groqVerification,
      geoVerification,
    };

    // IF GROQ AI DETECTS MISMATCH OR INVALID PINCODE -> SHOW INTERACTIVE MISMATCH MODAL AND PAUSE
    if (groqVerification.hasWarning || !geoVerification.isValid) {
      setIsSubmitting(false);

      let modalTitle = '⚠️ Groq AI Verification Alert';
      if (groqVerification.mismatchType === 'ALL_THREE_MISMATCHED') {
        modalTitle = '🔴 Groq AI Alert: All Details Mismatched';
      } else if (groqVerification.mismatchType === 'DESC_IMAGE_MISMATCH') {
        modalTitle = '⚠️ Groq AI Alert: Description & Image Mismatch';
      } else if (groqVerification.mismatchType === 'DEPARTMENT_MISMATCH') {
        modalTitle = '⚠️ Groq AI Alert: Department Mismatch';
      }

      setGroqMismatchModal({
        title: modalTitle,
        mismatchType: groqVerification.mismatchType,
        explanation: groqVerification.explanation || 'Groq AI detected a discrepancy in your submission details.',
        imageUnderstanding: groqVerification.imageUnderstanding || null,
        selectedDeptName: deptName,
        recommendedDepartment: groqVerification.recommendedDepartment || 'Water Supply & Sewerage',
        recommendedDeptId: groqVerification.recommendedDeptId || 'dept-water',
        geoReason: !geoVerification.isValid 
          ? geoVerification.reason 
          : (geoVerification.exactAreaDetected ? `Exact Location: ${geoVerification.exactAreaDetected}` : null),
        complaintPayload,
      });
      return;
    }

    // IF EVERYTHING MATCHES CLEANLY -> PROCEED DIRECTLY
    await proceedWithRegistration(complaintPayload);
  };

  return (
    <div className="page-register-complaint min-h-screen p-4 sm:p-10 relative flex flex-col justify-center items-center pb-32 sm:pb-24 bg-civic-gradient text-slate-900 transition-colors duration-300">
      <div className="max-w-3xl w-full relative z-10">
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BackButton label="Back" />
            <Link
              to="/home"
              className="home-square-btn bg-white/80 hover:bg-white text-slate-900 border border-slate-300 shadow-sm"
              title="Return Home"
            >
              <Home className="w-6 h-6 stroke-[2] text-slate-900" />
            </Link>
          </div>

          {/* CLICKABLE PROFILE ICON */}
          <Link
            to="/dashboard/profile"
            className="rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-900 shadow-md flex items-center justify-center bg-slate-900 text-white cursor-pointer hover:scale-105 transition-transform"
            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px', borderRadius: '50%' }}
            title="View My Profile"
          >
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : user?.name ? (
              <span className="font-serif font-extrabold text-sm text-white uppercase">{user.name.charAt(0)}</span>
            ) : (
              <User className="w-5 h-5 text-white stroke-[1.8]" />
            )}
          </Link>
        </div>

        {/* Section 1: Details: */}
        <h2 className=" text-white-600 font-extrabold text-xl font-serif mb-2">
          Details:
        </h2>

        <div className="glass-civic p-6 rounded-3xl mb-6 shadow-md border border-white/90">
          <p className="text-base font-serif font-bold text-slate-900">
            Name: <span className="font-semibold">{user?.name || 'Citizen User'}</span>
          </p>
          <p className="text-base font-serif font-bold text-slate-900 mt-2">
            Email: <span className="font-semibold">{user?.email || 'citizen@portal.in'}</span>
          </p>
        </div>

        {/* Section 2: Complaints: */}
        <h2 className="complaints-heading text-slate-900 font-extrabold text-xl font-serif mb-2">
          Complaints:
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="glass-civic p-6 sm:p-8 rounded-3xl shadow-xl border border-white/90 flex flex-col gap-5">
            {/* Address */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="form-label-serif text-slate-900 font-bold text-sm">
                Address :
              </label>
              <input
                type="text"
                required
                placeholder="Street address / Landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pill-input flex-1 bg-white/90 text-sm font-extrabold text-slate-900 border border-slate-300 shadow-sm"
              />
            </div>

            {/* Pincode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="form-label-serif text-slate-900 font-bold text-sm">
                Pincode :
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 641004"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="pill-input flex-1 bg-white/90 text-sm font-extrabold text-slate-900 border border-slate-300 shadow-sm"
              />
            </div>

            {/* Complaint Text */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
              <label className="form-label-serif mt-2 text-slate-900 font-bold text-sm">
                Complaint :
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe the civic issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full sm:flex-1 p-4 rounded-3xl bg-white/90 text-sm font-extrabold text-slate-900 border border-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department Selection */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="form-label-serif text-slate-900 font-bold text-sm">
                  Department :
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="pill-input flex-1 bg-white/90 text-sm font-extrabold text-slate-900 border border-slate-300 shadow-sm cursor-pointer"
                >
                  {departments.length === 0 && (
                    <option value="" disabled>Loading departments...</option>
                  )}
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {aiMatchedRule && (
                <div className="sm:ml-[110px] p-2.5 rounded-2xl bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-400 text-emerald-950 dark:text-emerald-200 text-xs font-extrabold flex items-center justify-between gap-2 shadow-sm animate-fadeIn mt-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0 animate-pulse" />
                    <span>
                      ✨ <strong>AI Rule Engine Auto-Selected:</strong> {aiMatchedRule.deptName}
                      {Array.isArray(aiMatchedRule.matchedKeywords) && aiMatchedRule.matchedKeywords.length > 0 && (
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block sm:inline sm:ml-1">
                          (Matched: "{aiMatchedRule.matchedKeywords.join('", "')}")
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-300 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100 flex-shrink-0">
                    {aiMatchedRule.confidence} Match
                  </span>
                </div>
              )}
            </div>

            {/* COMPULSORY MULTI-PHOTO UPLOAD SECTION */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2 border-t border-slate-200/80 pt-4">
              <div>
                <label className="form-label-serif block text-slate-900 font-bold text-sm">
                  Photo Evidence :
                </label>
                <span className="text-[11px] font-extrabold text-rose-600 block mt-0.5">
                  * COMPULSORY (Upload up to 5 photos)
                </span>
                <span className="text-[11px] font-bold text-slate-600 block">
                  {imagesList.length}/5 photos attached
                </span>
              </div>

              <div className="flex-1 w-full flex flex-col gap-3">
                {/* Upload Button */}
                {imagesList.length < 5 && (
                  <label className="cursor-pointer bg-blue-50/90 text-blue-700 border-2 border-dashed border-blue-300 hover:bg-blue-100 p-3.5 rounded-2xl flex items-center justify-center gap-2 font-extrabold text-xs transition-all shadow-sm hover:scale-[1.01]">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Upload Grievance Photos ({5 - imagesList.length} slots left)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}

                {/* THUMBNAIL GALLERY */}
                {imagesList.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white/80 border border-slate-200 shadow-inner">
                    {imagesList.map((imgUrl, idx) => (
                      <div key={idx} className="relative group">
                        <div
                          onClick={() => setViewModalImage(imgUrl)}
                          className="img-preview-box cursor-pointer hover:opacity-90 transition-opacity"
                          title="Click to view image"
                        >
                          <img src={imgUrl} alt={`Evidence ${idx + 1}`} />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSingleImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition-colors"
                          title="Delete photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold italic text-rose-600">
                    ⚠️ At least 1 photo evidence is required to register a complaint.
                  </p>
                )}
              </div>
            </div>

            {/* OPTIONAL VIDEO UPLOAD SECTION */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2 border-t border-slate-200/80 pt-4">
              <div>
                <label className="form-label-serif block text-slate-900 font-bold text-sm">
                  Video Clip :
                </label>
                <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                  Optional (Max 20MB)
                </span>
              </div>

              <div className="flex-1 w-full">
                {!videoPreview ? (
                  <label className="cursor-pointer bg-white/90 text-slate-700 border-2 border-dashed border-slate-300 hover:bg-slate-50 p-3.5 rounded-2xl flex items-center justify-center gap-2 font-extrabold text-xs transition-all shadow-sm hover:scale-[1.01]">
                    <Video className="w-4 h-4 text-purple-600" />
                    <span>Upload Video Clip (Optional, max 20MB)</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900 truncate">📹 {videoName}</span>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="text-xs text-rose-600 hover:text-rose-700 font-extrabold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Video
                      </button>
                    </div>
                    <div className="video-preview-box">
                      <video src={videoPreview} controls />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="pill-button-dark border border-slate-300 bg-slate-900 hover:bg-slate-950 text-white w-full justify-center py-4 text-base shadow-xl hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
                <span>Submitting... ⏳</span>
              </>
            ) : (
              <span>Submit Complaint ➔</span>
            )}
          </button>
        </form>
      </div>

      {/* COMPACT LIGHTBOX IMAGE MODAL */}
      {viewModalImage && (
        <div
          onClick={() => setViewModalImage(null)}
          className="compact-modal-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="compact-modal-card text-center flex flex-col items-center"
          >
            <button
              onClick={() => setViewModalImage(null)}
              className="compact-modal-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold font-serif text-slate-900 mb-3">
              Grievance Evidence Photo
            </h3>
            <img src={viewModalImage} alt="Grievance evidence large preview" />
            <button
              onClick={() => setViewModalImage(null)}
              className="pill-button-dark mt-4 py-2 px-6 text-xs text-white font-extrabold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CENTERED GLASS TOAST VALIDATION MODAL */}
      {validationWarning && (
        <div
          onClick={() => setValidationWarning(null)}
          className="compact-modal-overlay"
          style={{ zIndex: 6000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="compact-modal-card text-center flex flex-col items-center justify-center py-6 px-8"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-inner">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h3 className="text-base font-extrabold font-serif text-slate-900 mb-1">
              Required Information Missing
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-5">
              {validationWarning}
            </p>

            <button
              onClick={() => setValidationWarning(null)}
              className="pill-button-dark py-2.5 px-7 text-xs text-white font-extrabold cursor-pointer"
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}

      {/* GROQ AI MULTI-MODAL MISMATCH MODAL */}
      {groqMismatchModal && (
        <div
          onClick={() => {
            // Clean up temporary image IDs if user closes modal without submitting
            if (groqMismatchModal.uploadedMongoIds) {
              groqMismatchModal.uploadedMongoIds.forEach(id => imagesApi.deleteImage(id));
            }
            setGroqMismatchModal(null);
          }}
          className="compact-modal-overlay"
          style={{ zIndex: 10000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="compact-modal-card text-center flex flex-col items-center justify-center py-6 px-8 max-w-lg w-full"
          >
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-inner">
              <AlertCircle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-extrabold font-serif text-slate-900 mb-2">
              ⚠️ Groq AI Verification Alert
            </h3>

            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 mb-4 text-left w-full">
              <p className="text-xs text-amber-900 font-bold mb-2">
                {groqMismatchModal.explanation}
              </p>
              {groqMismatchModal.imageUnderstanding && (
                <div className="text-xs text-blue-900 font-semibold bg-blue-50/90 p-3 rounded-xl border border-blue-200 mb-2.5">
                  👁️ <strong>Groq Vision AI (qwen/qwen3.6-27b) Image Recognition:</strong><br />
                  <span className="text-slate-800 font-bold block mt-1">{groqMismatchModal.imageUnderstanding}</span>
                </div>
              )}
              {groqMismatchModal.recommendedDepartment && (
                <div className="text-xs text-slate-800 font-semibold bg-white p-3 rounded-xl border border-amber-200 mt-2">
                  <strong>Selected Department:</strong> <span className="text-red-600 line-through font-bold">{groqMismatchModal.selectedDeptName}</span><br />
                  <strong>Groq AI Recommended:</strong> <span className="text-emerald-700 font-bold">{groqMismatchModal.recommendedDepartment}</span>
                </div>
              )}
              {groqMismatchModal.geoReason && (
                <p className="text-xs text-slate-700 font-bold mt-2">
                  📍 <strong>Location Verification:</strong> {groqMismatchModal.geoReason}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              {groqMismatchModal.recommendedDeptId && (
                <button
                  type="button"
                  onClick={() => {
                    if (groqMismatchModal.recommendedDeptId) {
                      setDepartmentId(groqMismatchModal.recommendedDeptId);
                    }
                    setGroqMismatchModal(null);
                  }}
                  className="pill-button-dark bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 text-xs font-extrabold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  Auto-Fix to {groqMismatchModal.recommendedDepartment} ⚡
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const payload = groqMismatchModal.complaintPayload;
                  setGroqMismatchModal(null);
                  proceedWithRegistration(payload);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 px-5 text-xs font-extrabold rounded-full cursor-pointer"
              >
                Proceed Anyway ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
