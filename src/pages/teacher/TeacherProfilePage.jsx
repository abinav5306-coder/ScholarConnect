import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  Edit3, 
  Save, 
  CheckCircle2, 
  X, 
  Clock, 
  Mail, 
  ShieldCheck
} from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { useScholar } from '../../context/ScholarContext';
import TeacherVerificationCard from '../../components/verification/TeacherVerificationCard';

const DESIGNATIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Lecturer',
  'Research Scholar',
  'Research Scientist',
  'Other',
];

export default function TeacherProfilePage() {
  const { teacherProfile, updateTeacher } = useScholar();
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    institution: '',
    department: '',
    designation: '',
    profileUrl: '',
    bio: '',
    officeHours: '',
    researchInterests: [],
  });

  const [newInterest, setNewInterest] = useState('');

  const handleStartEdit = () => {
    setFormData({
      fullName: teacherProfile.fullName || '',
      institution: teacherProfile.institution || '',
      department: teacherProfile.department || '',
      designation: teacherProfile.designation || '',
      profileUrl: teacherProfile.profileUrl || '',
      bio: teacherProfile.bio || '',
      officeHours: teacherProfile.officeHours || '',
      researchInterests: [...(teacherProfile.researchInterests || [])],
    });
    setSuccessMessage('');
    setIsEditing(true);
  };

  const handleAddInterest = (e) => {
    e?.preventDefault();
    const trimmed = newInterest.trim();
    if (trimmed && !formData.researchInterests.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        researchInterests: [...prev.researchInterests, trimmed],
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (item) => {
    setFormData((prev) => ({
      ...prev,
      researchInterests: prev.researchInterests.filter((i) => i !== item),
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateTeacher(formData);
    setIsEditing(false);
    setSuccessMessage('Faculty profile updated successfully! Changes saved locally.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <TeacherLayout>
      <div className="space-y-6 text-left">
        
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-600 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-md ring-4 ring-teal-50">
                {teacherProfile.fullName?.charAt(0) || 'T'}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {teacherProfile.fullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    Verified Faculty
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-teal-800 font-medium">
                  {teacherProfile.designation} • {teacherProfile.department}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {teacherProfile.institution}
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs self-start sm:self-auto transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Faculty Profile</span>
              </button>
            )}
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{teacherProfile.email}</span>
            </div>
            {teacherProfile.profileUrl && (
              <a
                href={teacherProfile.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-teal-700 hover:underline font-semibold"
              >
                <Globe className="w-4 h-4" />
                <span>Departmental Webpage</span>
              </a>
            )}
            {teacherProfile.officeHours && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{teacherProfile.officeHours}</span>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6 animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Edit Faculty Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Designation</label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium bg-white"
                >
                  {DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution</label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Profile Link</label>
                <input
                  type="url"
                  value={formData.profileUrl}
                  onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })}
                  placeholder="https://institution.edu/faculty/profile"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Office Hours / Lab Location</label>
                <input
                  type="text"
                  value={formData.officeHours}
                  onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                  placeholder="e.g. Mon & Wed: 2:00 PM - 4:00 PM (Room 304)"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty & Lab Bio</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 leading-relaxed"
                />
              </div>
            </div>

            {/* Research Domains / Interests */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Research Domains & Interests ({formData.researchInterests.length})
              </label>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[46px] items-center">
                {formData.researchInterests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="p-0.5 hover:bg-teal-200/60 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest();
                    }
                  }}
                  placeholder="Type research domain and press Enter"
                  className="flex-1 text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600"
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                >
                  Add Domain
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          /* View Profile */
          <div className="space-y-6">
            {/* Faculty Identity Verification Card */}
            <TeacherVerificationCard />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Laboratory & Mentorship Overview
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {teacherProfile.bio || 'Faculty mentor leading student research and academic publications.'}
                </p>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Research Domains & Active Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {teacherProfile.researchInterests?.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                  Faculty Credentials
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Designation</span>
                    <span className="font-bold text-slate-900">{teacherProfile.designation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Department</span>
                    <span className="font-semibold text-slate-800">{teacherProfile.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">University</span>
                    <span className="font-semibold text-slate-800">{teacherProfile.institution}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Office Hours</span>
                    <span className="font-semibold text-slate-800">{teacherProfile.officeHours || 'By appointment'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </TeacherLayout>
  );
}
