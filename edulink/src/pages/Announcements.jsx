import React, { useEffect, useState } from "react";
import { db, ref, onValue, push, remove } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]); // Needed to know parent's children classes
  
  // Form State
  const [newPost, setNewPost] = useState({ title: '', body: '' });
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const unsubAnn = onValue(ref(db, "announcements"), snap => 
      setAnnouncements(snap.val() ? Object.entries(snap.val()).map(([id, val]) => ({ id, ...val })) : [])
    );
    // Fetch students to determine classes for Parents
    const unsubStu = onValue(ref(db, "students"), snap =>
      setStudents(snap.val() ? Object.values(snap.val()) : [])
    );
    return () => { unsubAnn(); unsubStu(); };
  }, []);

  // --- POSTING ---
  async function handlePost(e) {
    e.preventDefault();
    setIsPosting(true);
    
    const postData = {
      title: newPost.title,
      body: newPost.body,
      date: new Date().toLocaleDateString(),
      author: user.name,
      authorRole: user.role,
      // Target: Admin -> 'All', Teacher -> '4 Bestari' (from profile)
      target: user.role === 'admin' ? 'All' : user.class 
    };

    await push(ref(db, "announcements"), postData);
    setNewPost({ title: '', body: '' });
    setIsPosting(false);
  }

  async function handleDelete(id) {
    if(window.confirm("Delete this post?")) await remove(ref(db, `announcements/${id}`));
  }

  // --- FILTERING ---
  let visiblePosts = [];
  
  if (user.role === 'admin') {
    visiblePosts = announcements; // See all
  } else if (user.role === 'teacher') {
    // See Global + Own Class
    visiblePosts = announcements.filter(a => a.target === 'All' || a.target === user.class);
  } else if (user.role === 'parent') {
    // Find classes of my children
    const myKidsClasses = students.filter(s => s.parentId === user.uid).map(s => s.class);
    // See Global + Any of my kids' classes
    visiblePosts = announcements.filter(a => a.target === 'All' || myKidsClasses.includes(a.target));
  }

  return (
    <div className="p-6 w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Announcements Board</h1>
        {/* Create Button only for Admin/Teacher */}
        {(user.role === 'admin' || user.role === 'teacher') && (
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-bold">
            Posting as: {user.role === 'admin' ? "Admin (Global)" : `Teacher (${user.class})`}
          </span>
        )}
      </div>

      {/* CREATE POST FORM */}
      {(user.role === 'admin' || user.role === 'teacher') && (
        <form onSubmit={handlePost} className="bg-white p-6 rounded-xl shadow mb-8 border border-blue-100">
          <h3 className="font-bold text-gray-700 mb-4">Create New Announcement</h3>
          <input 
            className="w-full border p-2 rounded mb-3 focus:outline-blue-500" 
            placeholder="Title" required 
            value={newPost.title} onChange={e=>setNewPost({...newPost, title:e.target.value})}
          />
          <textarea 
            className="w-full border p-2 rounded mb-3 focus:outline-blue-500" 
            placeholder="Message content..." rows="3" required
            value={newPost.body} onChange={e=>setNewPost({...newPost, body:e.target.value})}
          ></textarea>
          <div className="flex justify-end">
            <button disabled={isPosting} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
              {isPosting ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </form>
      )}

      {/* POST LIST */}
      <div className="space-y-4">
        {visiblePosts.length === 0 ? <p className="text-gray-500 text-center">No announcements yet.</p> : 
          visiblePosts.map(post => (
            <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${post.target==='All' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                      {post.target === 'All' ? 'SCHOOL WIDE' : `CLASS ${post.target}`}
                    </span>
                    <span className="text-xs text-gray-400">{post.date}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{post.title}</h3>
                </div>
                {/* Delete button for Admins or the Author */}
                {(user.role === 'admin' || user.name === post.author) && (
                  <button onClick={()=>handleDelete(post.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                )}
              </div>
              <p className="text-gray-600 mt-3 whitespace-pre-wrap">{post.body}</p>
              <p className="text-xs text-gray-400 mt-4 font-medium">— Posted by {post.author}</p>
            </div>
          ))
        }
      </div>
    </div>
  );
}