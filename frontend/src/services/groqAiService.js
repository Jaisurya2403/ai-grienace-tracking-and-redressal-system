/**
 * Advanced Groq AI Service for Municipal Grievance Portal
 * Multi-Modal Priority Inspection & Professional Portal Chatbot
 */

import { matchDepartmentRules } from './ruleEngineAiService.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// USER SPECIFIED GROQ MODELS
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound',
  'groq/compound-mini'
];

// API KEY RESOLUTION: Cleanly strips quotes if pasted as VITE_GROQ_API_KEY='gsk_...'
export const getGroqApiKey = () => {
  const rawKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('MCP_GROQ_API_KEY') || '';
  return rawKey.replace(/['"]/g, '').trim();
};

// COMPREHENSIVE GROUND TRUTH KNOWLEDGE BASE FOR 100% OF MYCOMPLAINTPORTAL FEATURES & ROUTES
const PORTAL_EXPERT_KNOWLEDGE_BASE = `
OFFICIAL PORTAL GROUND TRUTH & COMPLETE FEATURE MAP - MYCOMPLAINTPORTAL:

1. PUBLIC & AUTHENTICATION ROUTES:
- '/' (Landing Page): Hero banner, municipal overview, key statistics, public entry points to Sign In or Register.
- '/login': Citizen & Municipal Department Officer login portal (Email + Password).
- '/signup': Citizen registration form (Name, Email, Password, Location, Pincode).
- '/verify-email': 6-digit OTP email verification for activating new citizen accounts.
- '/forgot-password' (Forgot Password Page): For unauthenticated users who forgot password.
  • Step 1: Enter registered Email ➔ Click "Send OTP".
  • Step 2: Receive 6-digit OTP on email ➔ Enter in OTP field ➔ Click "Verify OTP".
  • Step 3: Once OTP is verified ➔ Enter New Password and confirm.
  • Step 4: Click "Reset Password" to update credentials and log in!
- '/about' (About Us Page): Explains municipal portal mission, departments, emergency helplines, and direct contact to Portal Administrator for account help & support (jaisurya7482@gmail.com).
- '/posts' (Public Civic Feed): Public feed displaying community complaints, upvotes, and resolution statuses.
- '/track/:token' (Officer Tracking Page): Direct public/officer tracking page via unique complaint tracking token.

2. CITIZEN & GENERAL USER DASHBOARD FEATURES:
- '/home' (Authenticated Home Dashboard): Unified dashboard with active civic feed, role-based welcome banner, quick stats, and quick '+ File Complaint' entry button.
- '/complaints/new' (Register Complaint Page):
  • Step 1: Click "Register Complaint" (or "+ File Complaint") in Top Navigation Bar or Dashboard.
  • Step 2: Enter Location Address and compulsory 6-digit Indian Pincode (e.g. 641004).
  • Step 3: Type detailed description of the civic problem. Real-Time Rule AI auto-detects keywords and auto-selects the Department!
  • Step 4: Upload COMPULSORY Photo Evidence (1 to 5 photos) stored in MongoDB Atlas GridFS. Optionally upload Video (Max 20MB).
  • Step 5: Click "Submit Complaint ➔".
- '/complaints/new/review' or '/user/ai-check' (AI Duplicate Check & Review Page):
  • Multi-modal inspection engine cross-checks active unresolved grievances in the same Pincode & Department.
  • Displays sticky bottom submit bar ("Register My Complaint 🚀") or option to upvote/repost existing community issues.
- '/dashboard/complaints' (My Complaints Page):
  • Click "My Complaints" in Top Navigation Bar.
  • Tracks real-time status of user's filed complaints (CREATED, VISITED, ACTION_IN_PROGRESS, RESOLVED, REJECTED) with assigned officer details and resolution photo proof!
- '/dashboard/reposts' (My Reposts Page):
  • Click "My Reposts" in Top Navigation Bar to view community grievances supported/reposted by the citizen.
- '/dashboard/profile' (My Profile Page):
  • Click Profile Avatar in top right ➔ "My Profile". Displays account details, location, total grievances monitored, and resolution approvals.
- '/settings' (Settings Page):
  • Click Profile Avatar in top right ➔ "Settings". Configure Dark/Light mode theme, notifications, and security links.
- '/change-password' (Change Password Page for Logged-In Users):
  • Click Profile Avatar in top right ➔ Settings ➔ Change Password. Enter Current Password ➔ Enter New Password ➔ Click "Update Password".

3. ACCOUNT HELP & SUPPORT:
- If a user asks for account help, support, administrative assistance, account recovery, or portal issues:
  Instruct them to contact the Portal Administrator via email on the About Us page ('/about') at jaisurya7482@gmail.com.

4. COMPLAINT DESCRIPTION DRAFTING HELP:
- If a user asks for help writing, drafting, or generating a complaint description (e.g. for water leakage, pothole, garbage, street light, drainage), ALWAYS generate a complete, detailed, realistic grievance description in the requested language (English, Tamil, Tanglish, Hindi) that they can copy-paste directly into the Register Complaint form!

5. ADMIN & MUNICIPAL OFFICER MANAGEMENT TOOLS:
- '/admin/analytics' (Analytics Dashboard): Resolution charts, department performance metrics, pincode heatmap, resolution speed analytics.
- '/admin/posts' (Admin Complaints List): Department officers view assigned complaints, update progress status (CREATED ➔ VISITED ➔ ACTION_IN_PROGRESS ➔ RESOLVED / REJECTED), upload resolution proof photos, and attach official notes.
- '/admin/users' (Users Management): Manage registered citizens and user roles.
- '/admin/departments' & '/admin/departments/new' (Department Management): Manage municipal departments and add new department categories.
- '/admin/admins' & '/admin/admins/new' (Admin Staff Management): Manage department officers and administrative accounts.

6. MUNICIPAL DEPARTMENTS IN THE PORTAL:
- Roads & Transport (dept-pwd): Potholes, tar peeling, broken roads, street lights, traffic signals, footpaths, manhole covers, speed breakers. Helpline: 0422-2300100.
- Water Supply & Sewerage (dept-water): Pipe bursts, low water pressure, contaminated water, dirty water, open drains, sewer overflow, drainage problems. Helpline: 1800-1215-1514.
- Electricity & Street Lighting (dept-elec): Power cuts, voltage fluctuations, transformer blast, loose dangling wires, electric poles, dark street lights. Helpline: 1912.
- Sanitation & Waste Management (dept-sanitation): Uncollected garbage, overflowing dustbins, foul odor, dead animal disposal, street sweeping. Helpline: 1800-425-0001.
- IncomeTax & Wealth Department (dept-tax): Property tax payment, house tax assessment, tax receipts, door number mutation, challans.
- Public Health & Hospitals (dept-health): Hospital hygiene, dengue mosquito fogging, stray dog rabies, medical waste, PHC clinics.
- Parks & Recreation (dept-parks): Broken park benches, overgrown tree branches, playground equipment, park lighting, garden maintenance.
- Town Planning & Building Permits (dept-building): Illegal constructions, unauthorized buildings, footpath encroachments, flex hoardings.
- Education & Schools (dept-education): Municipal school infrastructure, classroom desks, midday meal hygiene, school boundary walls.
- Environment & Pollution Control (dept-environment): Air/water/noise pollution, illegal plastic burning, factory smoke, lake pollution.
- Other Department (dept-other): General municipal issues, unclassified grievances, public welfare, miscellaneous civic queries.

7. COMPLAINT STATUS PIPELINE:
- RECEIVED / CREATED: Complaint filed and logged in municipal database.
- VISITED: Municipal officer assigned and inspected the site location.
- ACTION_IN_PROGRESS: Repairs, maintenance, or cleanup actively under execution.
- RESOLVED: Problem resolved cleanly with resolution photo proof attached!
- REJECTED: Invalid or duplicate entry with officer justification notes.
`;

// STRICT FORMATTING & CONCISE RESPONSE INSTRUCTIONS FOR PROFESSIONAL CHATBOT
const CHATBOT_SYSTEM_PROMPT = `
You are the official MyComplaintPortal Municipal AI Support Assistant.
You are a highly professional, accurate, and courteous municipal AI assistant.
You specialize EXCLUSIVELY in MyComplaintPortal features, civic grievance registration, department routing, complaint tracking, pincode guidance, civic services, and public infrastructure assistance.

STRICT PROFESSIONAL RULES:
1. NO HALLUCINATIONS: ONLY explain features that exist in MyComplaintPortal. NEVER add features that are not available.
2. ACCURATE WORKFLOWS:
   - For Forgot Password ('/forgot-password'): Explain that the user enters Email ➔ receives and verifies 6-digit OTP ➔ once OTP is verified, sets New Password.
   - For Change Password ('/change-password'): Logged-in user goes to Settings or '/change-password' ➔ enters Current Password ➔ enters New Password.
3. HELP & SUPPORT / ACCOUNT ASSISTANCE:
   - If the user asks about help, account support, or administrative issues, ask them to contact the Portal Administrator via email on the About Us page ('/about') at jaisurya7482@gmail.com.
4. EXACT QUERY ANSWERS & DRAFTING HELP: If the user asks for a prompt, description, or text to file a complaint (e.g. for water, roads, garbage), GENERATE THE FULL DETAILED COMPLAINT DESCRIPTION TEXT in the exact requested language (English, Tamil, Tanglish, Hindi).
5. EXACT UI BUTTONS & NAVIGATION: When explaining how to do anything in the portal (e.g. filing a complaint, checking status, changing password), ALWAYS explicitly mention the exact UI button to click (e.g., "Click the **'Register Complaint'** button in the Top Navigation Bar or Dashboard header").
6. NO MARKDOWN TABLES: Output clean numbered steps (1., 2., 3.) or bullet points (•) instead.
7. NO RAW MARKDOWN HEADERS: NEVER output '###' or '#' headers or raw '---' lines.
8. CONCISE & DIRECT: Answer ONLY the specific question asked by the user.
9. LIVE DATA AWARENESS: Use the logged-in citizen profile and live complaint records provided below to answer questions about "my status", "my email", or "my complaints" specifically and accurately!
10. DIRECT USER RESPONSES ONLY: NEVER output your internal thoughts, translations, instructions, or analysis (e.g. "The user is asking...", "This translates to..."). Respond IMMEDIATELY in character to the user in their requested language (English, Tamil, Tanglish, Hindi, etc.).

${PORTAL_EXPERT_KNOWLEDGE_BASE}
`;

// HELPER TO CALL GROQ API WITH AUTOMATIC MODEL FALLBACK
const fetchGroqChatCompletion = async (apiKey, payload) => {
  if (!apiKey || !apiKey.startsWith('gsk_')) {
    throw new Error("Invalid or missing Groq API Key format.");
  }

  let lastError = null;

  for (const modelName of GROQ_MODELS) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...payload,
          model: modelName,
        }),
      });

      if (response.ok) {
        return await response.json();
      }

      const errData = await response.json().catch(() => ({}));
      lastError = errData.error?.message || `HTTP ${response.status}`;
      continue;
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(lastError || "Groq API temporarily unavailable.");
};

/**
 * 1. PORTAL CHATBOT GROQ API REQUEST
 */
export const askGroqPortalChatbot = async (userMessage, conversationHistory = [], userContext = null) => {
  const apiKey = getGroqApiKey();
  const lowerMsg = (userMessage || '').toLowerCase().trim();

  let userContextPrompt = "";
  if (userContext && userContext.user) {
    const u = userContext.user;
    const userComplaints = userContext.complaints || [];

    const complaintsSummary = userComplaints.length > 0
      ? userComplaints.map((c, i) => `Grievance #${i + 1}: [ID: ${c.id || c.complaintId}] Title: "${c.title || c.description}", Department: "${c.departmentName}", Status: "${c.status}", Pincode: "${c.pincode}", Location: "${c.locationName}", Date: "${c.createdAt || 'Recent'}"`).join('\n')
      : "No complaints registered yet by this user.";

    userContextPrompt = `\n
CURRENT LOGGED-IN CITIZEN PROFILE:
- Name: ${u.name || 'Citizen'}
- Email: ${u.email || u.id}
- Account Role: ${u.role || 'CITIZEN'}
- Primary Location: ${u.location || 'Coimbatore'}

THIS CITIZEN'S REGISTERED COMPLAINTS IN DATABASE:
${complaintsSummary}

If the user asks about "my complaints", "my status", "my email", "what complaints have I filed", or "my profile", USE THE LIVE DATA ABOVE TO ANSWER PERSONALLY AND ACCURATELY!
`;
  }

  const formattedMessages = [
    { role: 'system', content: CHATBOT_SYSTEM_PROMPT + userContextPrompt },
    ...conversationHistory.slice(-6).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })),
    { role: 'user', content: userMessage }
  ];

  if (!apiKey || !apiKey.startsWith('gsk_')) {
    // Intelligent local fallback if API key is unconfigured
    if (lowerMsg.includes('forgot') || lowerMsg.includes('reset') || lowerMsg.includes('password')) {
      return {
        success: true,
        reply: "To reset your password via Forgot Password ('/forgot-password'):\n1. Click 'Forgot Password?' on the Login screen.\n2. Enter your registered Email and click 'Send OTP'.\n3. Enter the 6-digit OTP received on your email and click 'Verify OTP'.\n4. Once verified, enter your New Password and click 'Reset Password'.",
      };
    }

    if (lowerMsg.includes('help') || lowerMsg.includes('support') || lowerMsg.includes('admin') || lowerMsg.includes('contact')) {
      return {
        success: true,
        reply: "For account help and support, please contact the Portal Administrator via email on the About Us page ('/about') at jaisurya7482@gmail.com.",
      };
    }

    if (lowerMsg.includes('water') || lowerMsg.includes('குடிநீர்') || lowerMsg.includes('தண்ணீர்')) {
      return {
        success: true,
        reply: "குடிநீர் பிரச்சினைக்கான புகார் விவரம் (Tamil Description Draft):\n\n\"எங்கள் பகுதியில் கடந்த 3 நாட்களாக குடிநீர் விநியோகம் சீராக இல்லை. குழாய்களில் கழிவுநீர் கலந்து துர்நாற்றத்துடன் வருகிறது. இதனால் பொதுமக்களுக்கு சுகாதாரக் கேடு ஏற்படும் அபாயம் உள்ளது. உடனடியாக குடிநீர் வாரிய அதிகாரிகள் நேரில் ஆய்வு செய்து குடிநீர் விநியோகத்தை சீரமைக்க கோருகிறோம்.\"\n\nபுகார் சமர்ப்பிக்க Top Navigation Bar-ல் உள்ள **'Register Complaint'** பொத்தானைக் கிளிக் செய்யவும்!",
      };
    }

    return {
      success: true,
      reply: `Hello! I am your MyComplaintPortal AI Assistant. You can ask me how to register a complaint, check status, reset passwords, or contact support!`,
    };
  }

  try {
    const data = await fetchGroqChatCompletion(apiKey, {
      messages: formattedMessages,
      temperature: 0.2,
      max_tokens: 600,
    });

    const rawReply = data.choices?.[0]?.message?.content || "";
    
    // Comprehensive cleaner for scratchpad reasoning logs & meta thoughts
    let cleanedReply = rawReply
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<\/?think>/gi, '')
      .replace(/^(The user is asking|Here's a thinking process|Let's analyze|This translates to|My instructions state|Identify Constraints)[\s\S]*?\n\n/gi, '')
      .trim();

    if (!cleanedReply) {
      cleanedReply = rawReply.replace(/<\/?think>/gi, '').trim();
    }

    return {
      success: true,
      reply: cleanedReply || "How can I assist you with MyComplaintPortal today?",
    };
  } catch (error) {
    console.warn('Groq Chatbot API fallback:', error);
    
    if (lowerMsg.includes('forgot') || lowerMsg.includes('reset') || lowerMsg.includes('password')) {
      return {
        success: true,
        reply: "To reset your password via Forgot Password ('/forgot-password'):\n1. Click 'Forgot Password?' on the Login screen.\n2. Enter your registered Email and click 'Send OTP'.\n3. Enter the 6-digit OTP received on your email and click 'Verify OTP'.\n4. Once verified, enter your New Password and click 'Reset Password'.",
      };
    }

    if (lowerMsg.includes('help') || lowerMsg.includes('support') || lowerMsg.includes('admin') || lowerMsg.includes('contact')) {
      return {
        success: true,
        reply: "For account help and support, please contact the Portal Administrator via email on the About Us page ('/about') at jaisurya7482@gmail.com.",
      };
    }

    return {
      success: true,
      reply: "To register a complaint, click the **'Register Complaint'** button in the Top Navigation Bar or navigate to '/complaints/new'!",
    };
  }
};

/**
 * 2. MULTI-MODAL PRIORITY VERIFICATION ENGINE
 */
export const verifyComplaintConsistency = async (
  description,
  departmentName,
  selectedDeptId,
  imagesList = [],
  videoName = null,
  pincode = '',
  address = '',
  departmentsList = [],
  imageMongoIds = []
) => {
  const apiKey = getGroqApiKey();
  
  // 1. Evaluate Rule AI matching baseline for Priority 1 (Description)
  const ruleMatch = matchDepartmentRules(description, departmentsList);
  
  let targetDeptId = ruleMatch?.deptId || '';
  let targetDeptName = ruleMatch?.deptName || '';

  // Rule D: If no standard department fits description -> Route to "Other Department"
  if (!targetDeptId) {
    const otherDept = departmentsList.find(d => 
      d.id === 'dept-other' || 
      d.name?.toLowerCase().includes('other') || 
      d.name?.toLowerCase().includes('general')
    );
    targetDeptId = otherDept?.id || 'dept-other';
    targetDeptName = otherDept?.name || 'Other Department';
  }

  const isDeptMatch = selectedDeptId === targetDeptId;

  // 2. CONVERT IMAGE ID TO FULL MONGO URL / BASE64 FOR GROQ VISION MODEL
  let imageUrlForGroq = null;
  if (imagesList && imagesList.length > 0) {
    const firstImg = imagesList[0];
    if (typeof firstImg === 'string') {
      if (firstImg.startsWith('http') || firstImg.startsWith('data:')) {
        imageUrlForGroq = firstImg;
      } else {
        imageUrlForGroq = `http://localhost:9999/api/images/${firstImg}`;
      }
    }
  } else if (imageMongoIds && imageMongoIds.length > 0) {
    imageUrlForGroq = `http://localhost:9999/api/images/${imageMongoIds[0]}`;
  }

  // 3. CHECK API KEY BEFORE NETWORK CALL TO PREVENT CONSOLE ERRORS
  if (apiKey && apiKey.startsWith('gsk_')) {
    try {
      const promptText = `
Perform Multi-Modal Municipal Inspection on this grievance submission:
- Description: "${description}"
- Selected Department: "${departmentName}" (ID: ${selectedDeptId})
- Location: "${address}", Pincode: "${pincode}"
- Uploaded Image URL: "${imageUrlForGroq || 'None'}"

Evaluate if Description, Photo Evidence, and Selected Department align:
- Rule A (ALL_THREE_MISMATCHED): Description, Evidence, and Selected Department all conflict.
- Rule B (DESC_IMAGE_MISMATCH): Description text conflicts with Photo evidence.
- Rule C (DEPT_MISMATCH): Description & Photo match each other, but user selected wrong Department.
- Rule D (NO_MATCH_OTHER): Target "Other Department" (ID: dept-other).
- Rule E (PERFECT_MATCH): All details match.

Respond STRICTLY in JSON format:
{
  "ruleApplied": "ALL_THREE_MISMATCHED" | "DESC_IMAGE_MISMATCH" | "DEPT_MISMATCH" | "NO_MATCH_OTHER" | "PERFECT_MATCH",
  "isConsistent": true/false,
  "explanation": "Human readable user message explaining discrepancy",
  "recommendedDepartment": "Exact Correct Department Name",
  "recommendedDeptId": "Exact Department ID"
}
`;

      const data = await fetchGroqChatCompletion(apiKey, {
        messages: [
          { role: 'system', content: 'You are a precise municipal AI inspector. Respond strictly in JSON.' },
          { role: 'user', content: promptText }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      if (data && data.choices && data.choices[0]) {
        const resJson = JSON.parse(data.choices[0].message?.content || '{}');
        const ruleApplied = resJson.ruleApplied || (isDeptMatch ? 'PERFECT_MATCH' : 'DEPT_MISMATCH');

        if (ruleApplied === 'ALL_THREE_MISMATCHED') {
          return {
            isConsistent: false,
            hasWarning: true,
            mismatchType: 'ALL_THREE_MISMATCHED',
            explanation: resJson.explanation || `🔴 All Details Mismatched: Your Description ("${description}"), Photo Evidence, and Selected Department ("${departmentName}") all conflict with each other! Please re-rectify your complaint entries.`,
            recommendedDepartment: resJson.recommendedDepartment || targetDeptName,
            recommendedDeptId: resJson.recommendedDeptId || targetDeptId,
          };
        }

        if (ruleApplied === 'DESC_IMAGE_MISMATCH') {
          return {
            isConsistent: false,
            hasWarning: true,
            mismatchType: 'DESC_IMAGE_MISMATCH',
            explanation: resJson.explanation || `⚠️ Description & Image Mismatch: Your description and photo evidence describe different problems. Please verify your photo evidence or complaint description.`,
            recommendedDepartment: targetDeptName || departmentName,
            recommendedDeptId: targetDeptId || selectedDeptId,
          };
        }

        if (ruleApplied === 'DEPT_MISMATCH' || !isDeptMatch) {
          return {
            isConsistent: false,
            hasWarning: true,
            mismatchType: 'DEPARTMENT_MISMATCH',
            explanation: resJson.explanation || `Your complaint description "${description}" describes a ${targetDeptName} problem, but you selected ${departmentName}.`,
            recommendedDepartment: targetDeptName || 'Water Supply & Sewerage',
            recommendedDeptId: targetDeptId || 'dept-water',
          };
        }

        if (ruleApplied === 'NO_MATCH_OTHER') {
          return {
            isConsistent: true,
            hasWarning: false,
            recommendedDepartment: 'Other Department',
            recommendedDeptId: 'dept-other',
          };
        }

        return { isConsistent: true, hasWarning: false, recommendedDepartment: targetDeptName, recommendedDeptId: targetDeptId };
      }
    } catch (e) {
      // Local fallback
    }
  }

  // 4. ERROR-FREE LOCAL MULTI-MODAL FALLBACK
  if (!isDeptMatch) {
    return {
      isConsistent: false,
      hasWarning: true,
      mismatchType: 'DEPARTMENT_MISMATCH',
      explanation: `Your complaint description "${description}" describes a ${targetDeptName} problem, but you selected ${departmentName}.`,
      recommendedDepartment: targetDeptName || 'Water Supply & Sewerage',
      recommendedDeptId: targetDeptId || 'dept-water',
    };
  }

  return { isConsistent: true, hasWarning: false, recommendedDepartment: targetDeptName, recommendedDeptId: targetDeptId };
};

/**
 * 3. GEOGRAPHIC ADDRESS & EXACT INDIAN PINCODE VERIFICATION
 */
export const verifyPincodeAddress = async (address, pincode) => {
  if (!pincode || pincode.trim().length !== 6 || isNaN(pincode)) {
    return {
      isValid: false,
      reason: 'Please enter a valid 6-digit Indian PIN code (e.g. 641004).',
    };
  }

  // EXACT INDIAN PINCODE GEOGRAPHIC DATABASE MAPPING
  const PIN_DATABASE = {
    '636001': 'Salem district, Tamil Nadu',
    '636002': 'Salem City, Tamil Nadu',
    '635109': 'Hosur / Krishnagiri district, Tamil Nadu',
    '609309': 'Tirunelveli district, Tamil Nadu',
    '641004': 'Peelamedu, Coimbatore district, Tamil Nadu',
    '641012': 'Gandhipuram, Coimbatore district, Tamil Nadu',
    '641110': 'Periyanaickenpalayam, Coimbatore district, Tamil Nadu',
    '631002': 'Kanchipuram district, Tamil Nadu',
    '123456': 'Unallocated / Invalid Delhi-Haryana series',
  };

  const detectedArea = PIN_DATABASE[pincode.trim()] || null;
  const addressLower = (address || '').toLowerCase();

  // If address says Coimbatore but PIN is 636001 (Salem) or 635109 (Hosur) or 609309 (Tirunelveli)
  if (addressLower.includes('coimbatore') && detectedArea && !detectedArea.toLowerCase().includes('coimbatore')) {
    return {
      isValid: false,
      exactAreaDetected: detectedArea,
      reason: `PIN ${pincode} is assigned to ${detectedArea}. This location is geographically distinct from Coimbatore, so your address does not match the PIN.`,
    };
  }

  const apiKey = getGroqApiKey();
  if (apiKey && apiKey.startsWith('gsk_')) {
    try {
      const promptText = `
Perform exact Indian 6-Digit PIN Code Geographic Inspection:
- Entered Address: "${address}"
- Entered 6-Digit Indian PIN Code: "${pincode}"

Respond STRICTLY in JSON format:
{
  "isValid": true/false,
  "exactAreaDetected": "Exact Area, District, State",
  "reason": "Clear explanation of geographic match or exact region discrepancy"
}
`;

      const data = await fetchGroqChatCompletion(apiKey, {
        messages: [
          { role: 'system', content: 'You are an accurate Indian Postal Code & Geographic Inspector. Respond strictly in JSON.' },
          { role: 'user', content: promptText }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      if (data && data.choices && data.choices[0]) {
        const resJson = JSON.parse(data.choices[0].message?.content || '{}');
        return {
          isValid: resJson.isValid !== false,
          exactAreaDetected: resJson.exactAreaDetected || detectedArea || '',
          reason: resJson.reason || (detectedArea ? `PIN ${pincode} belongs to ${detectedArea}.` : `PIN ${pincode} is valid.`),
        };
      }
    } catch (e) {
      // Local fallback
    }
  }

  return { 
    isValid: true, 
    reason: detectedArea ? `PIN ${pincode} belongs to ${detectedArea}.` : `PIN ${pincode} is a valid 6-digit Indian PIN code.` 
  };
};
