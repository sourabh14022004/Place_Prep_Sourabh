"use client";

import { useState, useEffect } from "react";
import { Mail, Briefcase, Calendar, MapPin, Building2, User, X } from "lucide-react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json());

export default function ProfilePage() {
  const { data: profileResponse, mutate } = useSWR('/api/faculty/profile', fetcher);
  const profileData = profileResponse?.data;

  const defaultProfile = {
    name: profileData?.fullName || "",
    title: profileData?.title || "",
    experience: profileData?.experience || "",
    campus: profileData?.campus || "",
    email: profileData?.email || "",
    employeeId: profileData?.employeeId || "",
    department: profileData?.department || "",
    joined: profileData?.joinedDate || "",
    expertises: profileData?.expertises?.length ? profileData.expertises : [],
    stats: profileData?.stats || { studentsMentored: 0, mockInterviews: 0, placementRate: 0, rating: 0 },
    recentActivity: profileData?.recentActivity || []
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ ...defaultProfile, expertisesStr: defaultProfile.expertises.join(', ') });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (profileData) {
      const p = { ...defaultProfile };
      setFormData({
        ...p,
        expertisesStr: p.expertises.join(', ')
      });
    }
  }, [profileData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/faculty/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.name,
          title: formData.title,
          department: formData.department,
          email: formData.email,
          experience: formData.experience,
          campus: formData.campus,
          employeeId: formData.employeeId,
          joinedDate: formData.joined,
          expertises: formData.expertisesStr.split(',').map((s: string) => s.trim()).filter(Boolean),
        }),
      });
      await mutate();
      setEditModalOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const profile = defaultProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 relative animate-in fade-in duration-300">
      {showToast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-5 duration-200">
          Profile updated successfully!
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div className="px-6 pb-6 relative">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center -mt-12 mb-4 shadow-sm overflow-hidden">
             <div className="flex items-center justify-center w-full h-full bg-blue-600 text-white text-3xl font-bold">
               {profile.name.split(" ").map((n: string) => n[0]).join("")}
             </div>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500 font-medium">{profile.title}</p>
              
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  {profile.experience}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {profile.campus}
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {profile.email}
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                setFormData({ ...profile, expertisesStr: profile.expertises.join(', ') });
                setEditModalOpen(true);
              }}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {profile.expertises.map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Contact Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" /> Employee ID: {profile.employeeId}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Building2 className="w-4 h-4 text-gray-400" /> Department: {profile.department}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" /> Joined: {profile.joined}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Mentorship Impact</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{profile.stats.studentsMentored}+</div>
                <div className="text-xs text-gray-500 mt-1">Students Mentored</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{profile.stats.mockInterviews}</div>
                <div className="text-xs text-gray-500 mt-1">Mock Interviews</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{profile.stats.placementRate}%</div>
                <div className="text-xs text-gray-500 mt-1">Placement Rate</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{profile.stats.rating}</div>
                <div className="text-xs text-gray-500 mt-1">Rating (out of 5)</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Recent Activity</h3>
            <div className="space-y-4">
              {profile.recentActivity.length === 0 && <p className="text-sm text-gray-500">No recent activity.</p>}
              {profile.recentActivity.map((activity: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {activity.time ? (
                        <>
                          {(() => {
                             try {
                               return formatDistanceToNow(new Date(activity.time), { addSuffix: true });
                             } catch(e) {
                               return activity.time;
                             }
                          })()}
                        </>
                      ) : 'Unknown time'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-205">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-base">Edit Profile Info</h3>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col">
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title / Designation</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
                  <input 
                    type="text" 
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contact Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Experience</label>
                  <input 
                    type="text" 
                    value={formData.experience}
                    placeholder="e.g. 12+ Years Experience"
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Campus</label>
                  <input 
                    type="text" 
                    value={formData.campus}
                    placeholder="e.g. Bangalore Campus"
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Employee ID</label>
                  <input 
                    type="text" 
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Joined Date</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Aug 2021"
                    value={formData.joined}
                    onChange={(e) => setFormData({ ...formData, joined: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Expertise (Comma Separated)</label>
                  <input 
                    type="text" 
                    value={formData.expertisesStr}
                    placeholder="e.g. Data Structures, React, Node.js"
                    onChange={(e) => setFormData({ ...formData, expertisesStr: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-gray-200 bg-gray-50">
                <button 
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
