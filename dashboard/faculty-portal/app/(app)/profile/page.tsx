"use client";

import { useState } from "react";
import { Mail, Briefcase, Calendar, MapPin, Building2, User, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  const realName = isLoaded && user ? (user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Prof. Sharma") : "Prof. Sharma";
  const realEmail = isLoaded && user ? (user.primaryEmailAddress?.emailAddress || "sharma.p@newtonschool.co") : "sharma.p@newtonschool.co";
  const realImage = isLoaded && user ? user.imageUrl : undefined;
  const initials = isLoaded && user && user.firstName ? `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase() : "PS";

  const [profile, setProfile] = useState({
    title: "Senior Faculty, Computer Science Dept.",
    experience: "12+ Years Experience",
    campus: "Bangalore Campus",
    employeeId: "EMP-4092",
    department: "CS & Engineering",
    joined: "Aug 2021",
    expertises: ["Data Structures", "Algorithms", "System Design", "Cloud Architecture"],
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: realName, email: realEmail, ...profile });
  const [showToast, setShowToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      title: formData.title,
      experience: formData.experience,
      campus: formData.campus,
      employeeId: formData.employeeId,
      department: formData.department,
      joined: formData.joined,
      expertises: profile.expertises,
    });
    setEditModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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
             {realImage ? (
               <img src={realImage} alt={realName} className="w-full h-full object-cover" />
             ) : (
               <div className="flex items-center justify-center w-full h-full bg-blue-600 text-white text-3xl font-bold">
                 {initials}
               </div>
             )}
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{realName}</h1>
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
                  {realEmail}
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                setFormData({ name: realName, email: realEmail, ...profile });
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
              {profile.expertises.map(tag => (
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
                <div className="text-2xl font-bold text-gray-900">450+</div>
                <div className="text-xs text-gray-500 mt-1">Students Mentored</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">120</div>
                <div className="text-xs text-gray-500 mt-1">Mock Interviews</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">85%</div>
                <div className="text-xs text-gray-500 mt-1">Placement Rate</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">4.9</div>
                <div className="text-xs text-gray-500 mt-1">Rating (out of 5)</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { title: `Completed Mock Interview with Aarav Patel`, time: "2 hours ago" },
                { title: "Resolved doubt on System Design", time: "5 hours ago" },
                { title: "Updated curriculum for Cloud Architecture", time: "1 day ago" },
                { title: "Hosted group session on Dynamic Programming", time: "3 days ago" },
              ].map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
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

            <form onSubmit={handleSave} className="p-5 space-y-4">
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

              <div className="flex gap-3 pt-2">
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
