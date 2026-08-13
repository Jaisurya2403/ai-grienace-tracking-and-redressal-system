import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Home, Video, Trash2, X, Eye, Sparkles, User, AlertCircle } from 'lucide-react';
import { BackButton } from '../../components/common/BackButton.jsx';
import { useComplaints } from '../../context/ComplaintContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { imagesApi } from '../../api/apiClient.js';

export const RegisterComplaintPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { departments, checkDuplicateComplaint, classifyDepartment } = useComplaints();

  const [address, setAddress] = useState(user?.location || '');
  const [pincode, setPincode] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [aiMatchedDept, setAiMatchedDept] = useState(null);

  // Up to 5 Images (Starts EMPTY)
  const [imagesList, setImagesList] = useState([]);
  
  // Compact Lightbox Modal View State
  const [viewModalImage, setViewModalImage] = useState(null);

  // Video (Optional - Max 20MB)
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoName, setVideoName] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationWarning, setValidationWarning] = useState(null);

  // Auto-select first department when departments load from backend
  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id);
    }
  }, [departments]);

  // Live AI Department Auto-Classification
  useEffect(() => {
    if (!description || description.trim().length < 4) {
      setAiMatchedDept(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (classifyDepartment) {
        const res = await classifyDepartment(description, imagesList);
        if (res && res.recommendedDeptId) {
          setAiMatchedDept(res);
          const matched = departments.find(
            (d) =>
              d.id === res.recommendedDeptId ||
              (d.code && res.recommendedDeptId.toLowerCase().includes(d.code.toLowerCase())) ||
              (d.name && res.recommendedDeptName && d.name.toLowerCase().includes(res.recommendedDeptName.toLowerCase().split(' ')[0]))
          );
          if (matched) {
            setDepartmentId(matched.id);
          }
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [description, imagesList, departments, classifyDepartment]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (imagesList.length === 0) {
      setValidationWarning('Photo evidence is COMPULSORY. Please upload at least 1 photo of the grievance before registering.');
      return;
    }

    const selectedDeptId = departmentId || departments[0]?.id || 'dept-pwd';

    setIsAnalyzing(true);

    // Upload files to backend imagesApi
    const uploadedImageIds = [];
    for (const imgItem of imagesList) {
      if (typeof imgItem === 'string' && imgItem.startsWith('data:')) {
        try {
          // Convert dataURL to File object for upload
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

    const dupResult = await checkDuplicateComplaint(description, pincode, selectedDeptId, address, imagesList);
    setIsAnalyzing(false);

    const targetDept = departments.find((d) => d.id === selectedDeptId);
    const deptName = targetDept ? targetDept.name : 'Public Works Department (PWD)';
    const deptOfficerEmail = targetDept ? (targetDept.officialEmail || targetDept.email || '') : '';

    const pendingPayload = {
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
      attachmentImageIds: uploadedImageIds,
      videoUrl: videoPreview,
      aiResult: dupResult,
    };

    sessionStorage.setItem('mcp_pending_complaint', JSON.stringify(pendingPayload));
    navigate('/user/ai-check');
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

              {aiMatchedDept && (
                <div className="sm:ml-[110px] p-2.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-extrabold flex items-center gap-2 shadow-sm animate-fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 animate-pulse" />
                  <span>✨ AI Auto-Matched Department: <strong>{aiMatchedDept.recommendedDeptName}</strong> ({aiMatchedDept.detectedProblem})</span>
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
            disabled={isAnalyzing}
            className="pill-button-dark border border-slate-300figma-register-cta-btn bg-slate-900 hover:bg-slate-950 text-white w-full justify-center py-4 text-base shadow-xl hover:scale-105  transition-transform cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-5 h-5 text-blue-400 animate-spin" />
                <span>Running Gemini AI Duplicate Search...</span>
              </>
            ) : (
              <>
                <span>Submit Complaint ➔</span>
              </>
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
    </div>
  );
};
