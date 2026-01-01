import React, { useEffect, useState } from "react";
import { db, ref, onValue, push, remove, update } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";
import { 
  Megaphone, Search, Send, Trash2, Edit2, Calendar, 
  Users, User, CheckCircle, X, AlertCircle 
} from "lucide-react";

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [editingId, setEditingId] = useState(null); // Track if editing
  
  // Form State
  const [newPost, setNewPost] = useState({ title: '', body: '' });

  useEffect(() => {
    const unsubAnn = onValue(ref(db, "announcements"), snap => 
      setAnnouncements(snap.val() ? Object.entries(snap.val()).map(([id, val]) => ({ id, ...val })) : [])
    );
    
    const unsubStu = onValue(ref(db, "students"), snap =>
      setStudents(snap.val() ? Object.values(snap.val()) : [])
    );

    return () => { unsubAnn(); unsubStu(); };
  }, []);

  // --- ACTIONS ---

  async function handlePost(e) {
    e.preventDefault();
    setIsPosting(true);
    
    const target = user.role === 'admin' ? 'All' : user.class;
    const currentDate = new Date().toLocaleDateString();
    const currentTimestamp = Date.now();

    try {
      if (editingId) {
        // --- UPDATE EXISTING POST ---
        await update(ref(db, `announcements/${editingId}`), {
          title: newPost.title,
          body: newPost.body,
          date: currentDate, // <--- UPDATED: Updates the visible date
          timestamp: currentTimestamp, // <--- UPDATED: Updates sort order
          isEdited: true, 
          lastEditedAt: currentDate
        });
        setEditingId(null);
      } else {
        // --- CREATE NEW POST ---
        const postData = {
          title: newPost.title,
          body: newPost.body,
          date: currentDate,
          timestamp: currentTimestamp,
          author: user.name,
          authorRole: user.role,
          target: target 
        };
        await push(ref(db, "announcements"), postData);
      }
      
      // Reset Form
      setNewPost({ title: '', body: '' });
    } catch (error) {
      console.error("Error posting:", error);
      alert("Failed to post announcement.");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleDelete(id) {
    if(window.confirm("Are you sure you want to delete this announcement?")) {
      await remove(ref(db, `announcements/${id}`));
      if (editingId === id) {
        setEditingId(null);
        setNewPost({ title: '', body: '' });
      }
    }
  }

  function startEdit(post) {
    setNewPost({ title: post.title, body: post.body });
    setEditingId(post.id);
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setNewPost({ title: '', body: '' });
  }

  // --- FILTERING LOGIC ---
  
  let visiblePosts = announcements;

  // 1. Role-Based Visibility
  if (user.role === 'admin') {
    visiblePosts = announcements; // Admin sees all
  } 
  else if (user.role === 'teacher') {
    // See Global + Own Class
    visiblePosts = announcements.filter(a => a.target === 'All' || a.target === user.class);
  } 
  else if (user.role === 'parent') {
    // See Global + Kids' Classes
    const myKidsClasses = students.filter(s => s.parentId === user.uid).map(s => s.class);
    visiblePosts = announcements.filter(a => a.target === 'All' || myKidsClasses.includes(a.target));
  } 
  else if (user.role === 'counselor') {
    // See Global Only (School Wide)
    visiblePosts = announcements.filter(a => a.target === 'All');
  }

  // 2. Search Filter
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    visiblePosts = visiblePosts.filter(a => 
      a.title.toLowerCase().includes(term) || 
      a.body.toLowerCase().includes(term)
    );
  }

  // 3. Sort by Timestamp (Newest/Edited First)
  // We use (b.timestamp || 0) to handle older posts that might lack a timestamp
  visiblePosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const canPost = user.role === 'admin' || user.role === 'teacher';

  return (
    <div className="p-6 w-full mx-auto space-y-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Megaphone size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Announcements</h1>
            <p className="text-slate-500 text-sm">Stay updated with the latest news.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search posts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: CREATE/EDIT FORM (Teachers/Admins Only) */}
        {canPost && (
          <div className="lg:col-span-1 h-fit sticky top-6">
            <div className={`p-6 rounded-2xl shadow-sm border transition-all ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
              
              <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${editingId ? 'text-amber-700' : 'text-slate-700'}`}>
                {editingId ? <Edit2 size={20}/> : <Send size={20} className="text-blue-600"/>}
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>

              <form onSubmit={handlePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                  <input 
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    placeholder="e.g., Sports Day 2025" required 
                    value={newPost.title} onChange={e=>setNewPost({...newPost, title:e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content</label>
                  <textarea 
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none" 
                    placeholder="Write your message here..." rows="6" required
                    value={newPost.body} onChange={e=>setNewPost({...newPost, body:e.target.value})}
                  ></textarea>
                </div>

                {/* Target Audience Badge */}
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 p-2 rounded-lg">
                  <Users size={14} />
                  <span>Posting to: </span>
                  <span className="font-bold text-slate-700">{user.role === 'admin' ? "Everyone (School Wide)" : `Class ${user.class}`}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingId && (
                    <button type="button" onClick={cancelEdit} className="flex-1 bg-white border border-slate-300 text-slate-600 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-50 transition">
                      Cancel
                    </button>
                  )}
                  <button disabled={isPosting} className={`flex-1 text-white py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition flex justify-center items-center gap-2 ${editingId ? 'bg-amber-600' : 'bg-blue-600'}`}>
                    {isPosting ? 'Processing...' : (editingId ? 'Update Post' : 'Publish Now')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RIGHT: POST FEED */}
        <div className={canPost ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
          
          {visiblePosts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Megaphone size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No Announcements Found</h3>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm ? "Try adjusting your search terms." : "Check back later for updates."}
              </p>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 text-sm font-bold hover:underline">
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            visiblePosts.map(post => (
              <div key={post.id} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition group ${editingId === post.id ? 'ring-2 ring-amber-400' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {/* Role Icon */}
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${post.authorRole==='admin'?'bg-purple-100 text-purple-600':'bg-blue-100 text-blue-600'}`}>
                      {post.authorRole==='admin' ? <AlertCircle size={20}/> : <User size={20}/>}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{post.author}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${post.target==='All' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {post.target === 'All' ? 'School Wide' : `Class ${post.target}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Calendar size={12} />
                        <span>{post.date}</span>
                        {post.isEdited && <span className="italic ml-1">(Edited)</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Edit/Delete) */}
                  {(user.role === 'admin' || user.name === post.author) && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(post)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edit Post"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Post"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pl-[52px]">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{post.title}</h3>
                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{post.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}