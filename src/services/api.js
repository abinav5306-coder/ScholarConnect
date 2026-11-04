/**
 * ScholarConnect API Service
 * Communicates with the Node.js/Express MongoDB Atlas Backend
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

/**
 * Helper to make HTTP requests with JSON and Auth header
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('scholarconnect_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If network error (backend not running or connection refused)
    if (!err.status) {
      console.warn(`[API Network Notice] Unable to reach backend endpoint "${endpoint}".`, err.message);
    }
    throw err;
  }
}

/**
 * Helper to make multipart FormData requests (file uploads)
 */
async function requestFormData(endpoint, formData) {
  const token = localStorage.getItem('scholarconnect_token');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      console.warn(`[API Network Notice] Unable to upload to "${endpoint}".`, err.message);
    }
    throw err;
  }
}

/**
 * Helper to download binary files (Excel, PDF, Resumes) with authentication
 */
async function downloadBlob(endpoint, options = {}, defaultFilename = 'download') {
  const token = localStorage.getItem('scholarconnect_token');
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Download failed with status ${response.status}`);
  }

  // Extract filename from Content-Disposition header if present
  let filename = defaultFilename;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = decodeURIComponent(match[1]);
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  return { success: true, filename };
}

/**
 * Helper to preview PDF in new tab
 */
async function previewBlob(endpoint, options = {}) {
  const token = localStorage.getItem('scholarconnect_token');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Preview failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const fileUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
  window.open(fileUrl, '_blank');
}

// 1. Authentication Endpoints
export const authAPI = {
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  verifyOtp: ({ email, otp, purpose }) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }),
    }),
  resendOtp: ({ email, purpose }) =>
    request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    }),
  getCurrentUser: () => request('/auth/me'),
};

// 2. Opportunities Endpoints
export const opportunityAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All Categories') query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.skill) query.append('skill', params.skill);
    if (params.year) query.append('year', params.year);
    if (params.institution) query.append('institution', params.institution);
    if (params.teacherId) query.append('teacherId', params.teacherId);
    
    const queryString = query.toString();
    return request(`/opportunities${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => request(`/opportunities/${id}`),
  create: (oppData) =>
    request('/opportunities', {
      method: 'POST',
      body: JSON.stringify(oppData),
    }),
  update: (id, oppData) =>
    request(`/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(oppData),
    }),
  delete: (id) =>
    request(`/opportunities/${id}`, {
      method: 'DELETE',
    }),
};

// 3. Applications Endpoints
export const applicationAPI = {
  submit: (appData) => {
    if (appData instanceof FormData) {
      return requestFormData('/applications', appData);
    }
    return request('/applications', {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  },
  getByStudent: (studentId) => request(`/applications/student/${studentId}`),
  getByTeacher: (teacherId) => request(`/applications/teacher/${teacherId}`),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/applications${query ? `?${query}` : ''}`);
  },
  updateStatus: (id, status, notes = '') =>
    request(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),
  bulkUpdateStatus: (applicationIds, status, notes = '') =>
    request('/applications/bulk/status', {
      method: 'PUT',
      body: JSON.stringify({ applicationIds, status, notes }),
    }),
};

// 4. Student Profile Endpoints
export const studentAPI = {
  getProfile: (id) => request(`/students/${id}`),
  updateProfile: (id, profileData) =>
    request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};

// 5. Teacher Profile Endpoints
export const teacherAPI = {
  getProfile: (id) => request(`/teachers/${id}`),
  updateProfile: (id, profileData) =>
    request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};

// 6. Messages Endpoints
export const messageAPI = {
  getConversations: () => request('/messages/conversations'),
  getHistory: (opportunityId, partnerId) => request(`/messages/history/${opportunityId}/${partnerId}`),
  send: (msgData) =>
    request('/messages', {
      method: 'POST',
      body: JSON.stringify(msgData),
    }),
  markAsRead: (opportunityId, partnerId) =>
    request(`/messages/read/${opportunityId}/${partnerId}`, {
      method: 'PUT',
    }),
  getUnreadCount: () => request('/messages/unread/count'),
  getByUser: (userId) => request(`/messages/${userId}`),
};

// 7. Notifications Endpoints
export const notificationAPI = {
  getByUser: (userId) => request(`/notifications/${userId}`),
  markAsRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllAsRead: (userId) =>
    request(`/notifications/user/${userId}/read-all`, {
      method: 'PUT',
    }),
  getPreferences: () => request('/notifications/preferences'),
  updatePreferences: (preferences) =>
    request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
};

// 8. Academic & Faculty Identity Verification Endpoints
export const verificationAPI = {
  getStatus: () => request('/verifications/status'),
  submitStudent: (formData) => requestFormData('/verifications/student/submit', formData),
  submitTeacher: (formData) => requestFormData('/verifications/teacher/submit', formData),
  getRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/verifications/requests${query ? `?${query}` : ''}`);
  },
  approve: (userId) =>
    request(`/verifications/${userId}/approve`, {
      method: 'PUT',
    }),
  reject: (userId, rejectionReason) =>
    request(`/verifications/${userId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectionReason }),
    }),
  getDocumentUrl: (filename) => `${API_BASE}/verifications/document/${filename}`,
};

// 9. Phase 9: Resume Management Endpoints
export const resumeAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('resumeFile', file);
    return requestFormData('/students/resume', formData);
  },
  getInfo: () => request('/students/resume'),
  downloadMyResume: () => downloadBlob('/students/resume/download', { method: 'GET' }, 'My_Resume.pdf'),
  previewMyResume: () => previewBlob('/students/resume/download', { method: 'GET' }),
  delete: () => request('/students/resume', { method: 'DELETE' }),
  downloadApplicantResume: (applicationId, studentName = 'Applicant') =>
    downloadBlob(`/applications/${applicationId}/resume`, { method: 'GET' }, `${studentName.replace(/\s+/g, '_')}_Resume.pdf`),
  previewApplicantResume: (applicationId) =>
    previewBlob(`/applications/${applicationId}/resume`, { method: 'GET' }),
};

// 10. Phase 9: Teacher Export Endpoints (Excel & PDF)
export const exportAPI = {
  exportExcel: (filters = {}) =>
    downloadBlob(
      '/teachers/export/excel',
      {
        method: 'POST',
        body: JSON.stringify(filters),
      },
      'ScholarConnect_Applicants.xlsx'
    ),
  exportPdf: (filters = {}) =>
    downloadBlob(
      '/teachers/export/pdf',
      {
        method: 'POST',
        body: JSON.stringify(filters),
      },
      'ScholarConnect_Applicants.pdf'
    ),
};

// 11. Health Check
export const healthAPI = {
  checkHealth: () => request('/health'),
};
