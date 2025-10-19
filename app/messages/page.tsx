"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/app/lib/http";

type User = { id: string; name: string; email?: string; role?: string; department?: string };
type Message = { id: string; from: string; to: string; text: string; createdAt: string; readBy?: string[]; attachments?: Array<{ url: string; name: string; type: string; size?: number }>; groupId?: string };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("token") ||
    null
  );
}

export default function MessagesPage() {
  // Current user (best-effort): from token payload -> sub/email; fallback to a mock ID
  const [me, setMe] = useState<string>("U-002");
  const [users, setUsers] = useState<User[]>([]);
  const [usersQ, setUsersQ] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  const [toId, setToId] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; members: Array<{ userId: string; role: 'owner' | 'admin' | 'member' }> }>>([]);
  const [friends, setFriends] = useState<Array<{ id: string; a: string; b: string }>>([]);
  const [blocks, setBlocks] = useState<Array<{ id: string; blocker: string; blocked: string }>>([]);
  const [composeMode, setComposeMode] = useState<'private'|'group'>('private');
  // Realtime state
  const esRef = useRef<EventSource | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({}); // key by toId or groupId
  const typingTimerRef = useRef<number | null>(null);
  // Mentions state (group only)
  const [mentionQuery, setMentionQuery] = useState<string>("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  // Mute groups
  const [mutedGroups, setMutedGroups] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Group management UI state
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<'member'|'admin'>('member');

  // Try to derive user id from token (best-effort)
  useEffect(() => {
    (async () => {
      try {
        const t = getToken();
        if (!t) return;
        const parts = t.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          const sub: string | null = payload?.email || payload?.preferred_username || payload?.sub || null;
          if (sub && typeof sub === "string") {
            // Search users by email/username/id
            const res = await apiFetch(`/api/users?q=${encodeURIComponent(sub)}&page=1&pageSize=1`);
            const j = await res.json();
            const match: any = Array.isArray(j.items) && j.items.length > 0 ? j.items[0] : null;
            if (match?.id) setMe(String(match.id));
          }
        }
      } catch {}
    })();
  }, []);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await apiFetch(`/api/users?page=1&pageSize=100&sort=name:asc${usersQ ? `&q=${encodeURIComponent(usersQ)}` : ""}`);
      const j = await res.json();
      setUsers(j.items || []);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load muted groups
  useEffect(()=>{
    try { const raw = localStorage.getItem('mutedGroups'); if (raw) setMutedGroups(JSON.parse(raw)); } catch {}
  }, []);
  function toggleMute(gid: string) {
    setMutedGroups(prev=>{
      const has = prev.includes(gid);
      const next = has ? prev.filter(x=> x!==gid) : [...prev, gid];
      try { localStorage.setItem('mutedGroups', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // Open SSE stream for realtime events
  useEffect(()=>{
    const es = new EventSource('/api/messages/events');
    esRef.current = es;
    es.addEventListener('message', (ev: MessageEvent)=>{
      try {
        const msg = JSON.parse((ev as any).data);
        // If message belongs to current thread, refresh
        if ((msg.groupId && msg.groupId === groupId) || (!msg.groupId && ((msg.from===me && msg.to===toId) || (msg.to===me && msg.from===toId)))) {
          loadMessages();
        } else {
          // If muted group, ignore
          if (msg.groupId && mutedGroups.includes(msg.groupId)) {
            // ignore
          }
        }
      } catch {}
    });
    es.addEventListener('read', (ev: MessageEvent)=>{
      try {
        const data = JSON.parse((ev as any).data);
        if (data.groupId ? data.groupId===groupId : ((data.from===me && data.to===toId) || (data.to===me && data.from===toId))) {
          loadMessages();
        }
      } catch {}
    });
    es.addEventListener('typing', (ev: MessageEvent)=>{
      try {
        const t = JSON.parse((ev as any).data);
        // Only show typing for the other user(s)
        const key = t.groupId ? t.groupId : (t.from===me ? t.to : t.from);
        if (!key) return;
        if (t.from === me) return; // don't show my own typing
        setTypingUsers(prev=> ({ ...prev, [key]: Date.now() }));
        // Cleanup typing after 4s
        window.setTimeout(()=>{
          setTypingUsers(prev=> {
            const copy = { ...prev } as any; if (Date.now() - (copy[key]||0) > 3500) { delete copy[key]; } return copy;
          });
        }, 4000);
      } catch {}
    });
    return ()=> { try { es.close(); } catch {}; esRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, toId, groupId, mutedGroups]);

  // Emit typing with debounce
  function emitTyping() {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    apiFetch('/api/messages/typing', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ from: me, to: composeMode==='private'? toId : undefined, groupId: composeMode==='group'? groupId : undefined, isTyping: true }) }).catch(()=>{});
    typingTimerRef.current = window.setTimeout(()=>{
      apiFetch('/api/messages/typing', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ from: me, to: composeMode==='private'? toId : undefined, groupId: composeMode==='group'? groupId : undefined, isTyping: false }) }).catch(()=>{});
    }, 1500) as any;
  }

  // Helpers for validations
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
  const isBlocked = (otherId: string) => blocks.some(b => (b.blocker === me && b.blocked === otherId) || (b.blocker === otherId && b.blocked === me));
  const currentGroup = useMemo(()=> groups.find(g=> g.id===groupId), [groups, groupId]);
  const isGroupMember = (uid: string) => !!currentGroup?.members?.some(m=> m.userId === uid);

  const loadGroups = async () => {
    const res = await apiFetch('/api/groups');
    const j = await res.json();
    setGroups(j.items || []);
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    const payload = {
      name: groupName.trim(),
      owner: me,
      members: groupMemberIds.filter(id=> id && id!==me).map(id=> ({ userId: id, role: 'member' as const }))
    };
    const res = await apiFetch('/api/groups', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    const j = await res.json();
    if (j?.ok) {
      await loadGroups();
      setGroupId(j.item.id);
      setToId('');
      setCreatingGroup(false);
      setGroupName("");
      setGroupMemberIds([]);
    }
  };

  const addMember = async () => {
    if (!groupId || !newMemberId) return;
    await apiFetch('/api/groups', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id: groupId, action: 'add_member', by: me, userId: newMemberId, role: newMemberRole }) });
    await loadGroups();
    setNewMemberId("");
    setNewMemberRole('member');
  };

  const removeMember = async (userId: string) => {
    if (!groupId) return;
    await apiFetch('/api/groups', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id: groupId, action: 'remove_member', by: me, userId }) });
    await loadGroups();
  };

  const setMemberRole = async (userId: string, role: 'member'|'admin') => {
    if (!groupId) return;
    await apiFetch('/api/groups', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id: groupId, action: 'set_role', by: me, userId, role }) });
    await loadGroups();
  };

  const loadFriendsBlocks = async () => {
    const [fr, bl] = await Promise.all([
      apiFetch(`/api/friends?user=${encodeURIComponent(me)}`).then(r=>r.json()).catch(()=>({items:[]})),
      apiFetch(`/api/blocks?user=${encodeURIComponent(me)}`).then(r=>r.json()).catch(()=>({items:[]})),
    ]);
    setFriends(fr.items || []);
    setBlocks(bl.items || []);
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      // If a recipient is selected, show the conversation between me and toId
      let url = `/api/messages?page=${page}&pageSize=${pageSize}`;
      if (groupId) {
        url += `&groupId=${encodeURIComponent(groupId)}`;
      } else if (toId) {
        url += `&from=${encodeURIComponent(me)}&to=${encodeURIComponent(toId)}`;
      } else {
        // Otherwise, show all messages where I am sender or recipient
        // We don't have a combined filter endpoint, so fetch two lists and merge client-side
        const [aRes, bRes] = await Promise.all([
          apiFetch(`/api/messages?page=${page}&pageSize=${pageSize}&from=${encodeURIComponent(me)}`),
          apiFetch(`/api/messages?page=${page}&pageSize=${pageSize}&to=${encodeURIComponent(me)}`),
        ]);
        const a = await aRes.json();
        const b = await bRes.json();
        const merged: Message[] = [...(a.items || []), ...(b.items || [])];
        const dedup = Array.from(new Map(merged.map((m) => [m.id, m])).values());
        // newest first by id
        dedup.sort((x, y) => String(y.id).localeCompare(String(x.id)));
        setItems(dedup);
        // total approximate: pick the larger of the two totals
        setTotal(Math.max(a.total || 0, b.total || 0));
        return;
      }
      const res = await apiFetch(url);
      const j = await res.json();
      const arr: Message[] = j.items || [];
      setItems(arr);
      setTotal(j.total || 0);
      // mark as read when viewing a thread
      if (toId || groupId) {
        await apiFetch('/api/messages/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toId ? { me, from: me, to: toId } : { me, groupId })
        }).catch(()=>{});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [usersQ]);

  useEffect(() => {
    loadMessages();
  }, [me, toId, groupId, page, pageSize]);

  useEffect(() => {
    loadGroups();
    loadFriendsBlocks();
  }, [me]);

  const onSend = async () => {
    // Basic requireds
    if ((composeMode==='private' ? !toId : !groupId) || (!text.trim() && files.length === 0)) return;
    // Optional: blocked checks for private
    if (composeMode==='private' && toId && isBlocked(toId)) {
      alert('You cannot message this user (blocked).');
      return;
    }
    // Group membership check
    if (composeMode==='group' && groupId && !isGroupMember(me)) {
      alert('You must be a member of the group to send messages.');
      return;
    }
    // Files validation
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) { alert(`File ${f.name} exceeds 10MB.`); return; }
      if (!ALLOWED_TYPES.some(t => f.type.startsWith(t) || f.type === t)) { alert(`File type not allowed: ${f.name}`); return; }
    }
    setSending(true);
    try {
      if (files.length > 0) {
        const form = new FormData();
        form.append('from', me);
        if (toId) form.append('to', toId);
        if (groupId) form.append('groupId', groupId);
        form.append('text', text.trim());
        files.forEach(f => form.append('files', f));
        await apiFetch('/api/messages', { method: 'POST', body: form });
      } else {
        await apiFetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: me, to: toId || undefined, groupId: groupId || undefined, text: text.trim() }),
        });
      }
      setText("");
      setFiles([]);
      setPage(1);
      await loadMessages();
    } finally {
      setSending(false);
    }
  };

  const recipientName = useMemo(() => users.find((u) => u.id === toId)?.name || "", [users, toId]);

  // Derived: recent contacts with unread counts
  const recent = useMemo(() => {
    const map = new Map<string, { otherId: string; unread: number }>();
    items.forEach(m => {
      const other = m.from === me ? m.to : m.from;
      if (!other) return;
      const cur = map.get(other) || { otherId: other, unread: 0 };
      const unread = (m.to === me && !(m.readBy || []).includes(me)) ? 1 : 0;
      cur.unread += unread;
      map.set(other, cur);
    });
    return Array.from(map.values());
  }, [items, me]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Messages</h1>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, display: 'grid', gap: 12 }}>
          {/* Compose mode quick actions + Settings */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div></div>
            <div style={{ display:'flex', gap:8, alignItems:'center', position:'relative' }}>
              <button onClick={()=>{ setComposeMode('private'); setGroupId(''); }} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: composeMode==='private'?'#eff6ff':'#fff' }}>Private Message</button>
              <button onClick={()=>{ setComposeMode('group'); setToId(''); }} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: composeMode==='group'?'#eff6ff':'#fff' }}>Group Message</button>
              <button onClick={()=> setSettingsOpen(v=>!v)} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background:'#fff' }}>Settings ⚙</button>
              {settingsOpen && (
                <div style={{ position:'absolute', right:0, top:'100%', marginTop:6, border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', minWidth:200, zIndex:20, boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
                  <button disabled={!toId} onClick={async()=>{ if (!toId) return; await apiFetch('/api/friends', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ a: me, b: toId }) }); setSettingsOpen(false); }} style={{ width:'100%', textAlign:'left', padding:'8px 10px', border:'none', background:'transparent', cursor: toId? 'pointer':'not-allowed' }}>Add friend</button>
                  <button disabled={!toId} onClick={async()=>{ if (!toId) return; await apiFetch('/api/blocks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ blocker: me, blocked: toId }) }); setSettingsOpen(false); }} style={{ width:'100%', textAlign:'left', padding:'8px 10px', border:'none', background:'transparent', cursor: toId? 'pointer':'not-allowed' }}>Block</button>
                  <button disabled={!toId} onClick={async()=>{ if (!toId) return; await apiFetch(`/api/blocks?blocker=${encodeURIComponent(me)}&blocked=${encodeURIComponent(toId)}`, { method:'DELETE' }); setSettingsOpen(false); }} style={{ width:'100%', textAlign:'left', padding:'8px 10px', border:'none', background:'transparent', cursor: toId? 'pointer':'not-allowed' }}>Unblock</button>
                  <div style={{ borderTop:'1px solid #e5e7eb', margin:'4px 0' }} />
                  <button onClick={()=>{ setCreatingGroup(true); setSettingsOpen(false); }} style={{ width:'100%', textAlign:'left', padding:'8px 10px', border:'none', background:'transparent' }}>Create group</button>
                </div>
              )}
            </div>
          </div>
          {/* Group management for selected group (owner/admin) */}
          {groupId && (()=>{
            const g = groups.find(x=> x.id===groupId);
            const myRole = g?.members.find(m=> m.userId===me)?.role;
            const canManage = myRole==='owner' || myRole==='admin';
            const memberIds = new Set((g?.members||[]).map(m=> m.userId));
            return canManage ? (
              <section style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:12, background:'#fff' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontWeight:700 }}>Manage group</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{g?.name}</div>
                </div>
                <div style={{ display:'grid', gap:8 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <select value={newMemberId} onChange={(e)=> setNewMemberId(e.target.value)} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                      <option value=''>Add member...</option>
                      {users.filter(u=> !memberIds.has(u.id)).map(u=> (<option key={u.id} value={u.id}>{u.name}</option>))}
                    </select>
                    <select value={newMemberRole} onChange={(e)=> setNewMemberRole(e.target.value as any)} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                      <option value='member'>member</option>
                      <option value='admin'>admin</option>
                    </select>
                    <button onClick={addMember} disabled={!newMemberId} style={{ padding:'6px 10px', background:'#10b981', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Add</button>
                  </div>
                  <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:8 }}>
                    <div style={{ fontWeight:600, marginBottom:6 }}>Members</div>
                    <div style={{ display:'grid', gap:6 }}>
                      {(g?.members||[]).map(m=> (
                        <div key={m.userId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px' }}>
                          <div>
                            <div style={{ fontWeight:600 }}>{users.find(u=>u.id===m.userId)?.name || m.userId}</div>
                            <div style={{ fontSize:11, color:'#6b7280' }}>Role: {m.role}</div>
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            {m.role!=='owner' && (
                              <select value={m.role} onChange={(e)=> setMemberRole(m.userId, e.target.value as any)} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                                <option value='member'>member</option>
                                <option value='admin'>admin</option>
                              </select>
                            )}
                            {m.role!=='owner' && (
                              <button onClick={()=> removeMember(m.userId)} style={{ padding:'6px 8px', background:'#b91c1c', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Remove</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : null;
          })()}
          <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>To</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={toId} onChange={(e)=> setToId(e.target.value)} disabled={composeMode!=='private'} style={{ flex: 1, padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: composeMode!=='private'?'#f3f4f6':'#fff' }}>
                    <option value=''>Select recipient</option>
                    {users.filter(u=>u.id!==me).map(u=> (<option key={u.id} value={u.id}>{u.name} {u.email?`(${u.email})`:''}</option>))}
                  </select>
                  <input value={usersQ} onChange={(e)=> setUsersQ(e.target.value)} placeholder='Search users' style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
                </div>
              </div>
              {/* Mute toggle removed as requested */}
              {/* Inline friend/block/unblock removed; available via Settings menu */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>Message</label>
                <textarea value={text} onChange={(e)=>{ setText(e.target.value); emitTyping();
                  // Mentions detection for groups
                  if (composeMode==='group') {
                    const m = /(^|\s)@(\w*)$/.exec(e.target.value.slice(0, e.target.selectionStart));
                    if (m) { setMentionQuery(m[2]||''); setMentionOpen(true); setMentionIndex(0); } else { setMentionOpen(false); setMentionQuery(''); }
                  } else { setMentionOpen(false); setMentionQuery(''); }
                }} rows={3} placeholder={toId?`Message to ${recipientName}`:(groupId?`Message to ${groups.find(g=>g.id===groupId)?.name||'Group'}`:'Select a recipient first')} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                <div style={{ marginTop: 6 }}>
                  <input id='msg-files' type='file' multiple style={{ display: 'none' }} onChange={(e)=>{ const fs = e.target.files ? Array.from(e.target.files) : []; setFiles(fs); e.currentTarget.value=''; }} />
                  <button onClick={()=> document.getElementById('msg-files')?.click()} style={{ padding: '6px 10px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, marginRight: 8 }}>Attach files</button>
                  {files.length>0 && (<span style={{ fontSize: 12, color: '#475569' }}>{files.length} file(s) selected</span>)}
                </div>
                {/* Mentions suggestions */}
                {mentionOpen && composeMode==='group' && (
                  (()=>{
                    const g = groups.find(x=> x.id===groupId);
                    const members = (g?.members||[]).map(m=> users.find(u=> u.id===m.userId)).filter(Boolean) as User[];
                    const filtered = members.filter(u=> (u.name||'').toLowerCase().includes(mentionQuery.toLowerCase()));
                    if (filtered.length===0) return null;
                    return (
                      <div style={{ marginTop:6, border:'1px solid #e5e7eb', borderRadius:6, background:'#fff', maxHeight:150, overflowY:'auto' }}>
                        {filtered.slice(0,8).map((u, idx)=> (
                          <div key={u.id} onMouseDown={(e)=>{ e.preventDefault();
                            // replace last @token with @Name
                            const v = text;
                            const upTo = (document.activeElement as HTMLTextAreaElement | null)?.selectionStart ?? v.length;
                            const left = v.slice(0, upTo);
                            const right = v.slice(upTo);
                            const newLeft = left.replace(/(\s|^)@(\w*)$/, `$1@${u.name}`);
                            setText(newLeft + right);
                            setMentionOpen(false); setMentionQuery('');
                          }} style={{ padding:'6px 8px', background: idx===mentionIndex? '#eff6ff':'#fff', cursor:'pointer' }}>
                            @{u.name}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onSend} disabled={(!toId && !groupId) || (toId===me) || (!text.trim() && files.length===0) || sending} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700 }}> {sending? 'Sending...':'Send'} </button>
              </div>
            </div>
          </section>
          <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>
                Inbox {toId ? `(Conversation with ${recipientName})` : (groupId ? `(Group: ${groups.find(g=> g.id===groupId)?.name||groupId})` : '(All)')}
                {(toId && typingUsers[toId]) && <span style={{ marginLeft:8, fontSize:12, color:'#6b7280' }}>typing…</span>}
                {(groupId && typingUsers[groupId]) && <span style={{ marginLeft:8, fontSize:12, color:'#6b7280' }}>someone is typing…</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#475569' }}>Rows per page</label>
                <select value={pageSize} onChange={(e)=>{ setPageSize(parseInt(e.target.value,10)||10); setPage(1); }} style={{ padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button onClick={()=> setPage(p=> Math.max(1, p-1))} disabled={page<=1} style={{ padding: '6px 10px', background: page<=1? '#e5e7eb':'#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 6 }}>Prev</button>
                <button onClick={()=> setPage(p=> p*pageSize<total ? p+1 : p)} disabled={page*pageSize>=total} style={{ padding: '6px 10px', background: page*pageSize>=total? '#e5e7eb':'#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 6 }}>Next</button>
              </div>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : items.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: 13 }}>No messages.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {items.map((m)=> (
                  <div key={m.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, background: me===m.from ? '#eff6ff' : ((m.to===me && !(m.readBy||[]).includes(me)) ? '#fff7ed' : '#fafafa') }}>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                      <strong>{m.from===me ? 'Me' : m.from}</strong> → <strong>{m.to===me ? 'Me' : m.to}</strong>
                      <span style={{ marginLeft: 8, color: '#6b7280' }}>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    {Array.isArray(m.attachments) && m.attachments.length>0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {m.attachments.map((a, idx)=> (
                          <a key={idx} href={a.url} target='_blank' rel='noreferrer' style={{ padding: 6, border: '1px solid #e5e7eb', borderRadius: 6, textDecoration: 'none', color: '#2563eb', fontSize: 12 }}>{a.name}</a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
              {total > 0 ? (<>
                Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
              </>) : (<>No records</>)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
