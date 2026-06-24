// FEATURE: Threaded comments (Phase 7) — discussion on an article, one level of
// replies. You can edit/delete your own; admins can delete any. Distinct from the
// activity timeline (which is the immutable transition history).
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from './Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { initials, formatDateTime } from '../lib/utils.js';
import { IconChat } from '../lib/icons.jsx';
import { Button, Card, CardTitle, LinkButton } from './ui/index.js';

function RoleChip({ role }) {
  if (role === 'TEAM_LEADER') return <span className="role-chip role-chip--tl">TL</span>;
  if (role === 'ADMIN') return <span className="role-chip role-chip--admin">Admin</span>;
  return null;
}

export default function Comments({ articleId }) {
  const { user } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [editId, setEditId] = useState(null);
  const [editBody, setEditBody] = useState('');

  const load = () => api.listComments(articleId).then(setComments).catch(() => setComments([]));
  useEffect(() => { load(); }, [articleId]);

  async function post(text, parentId, after) {
    const t = String(text || '').trim();
    if (!t) return;
    setBusy(true);
    try {
      await api.createComment({ articleId, body: t, parentId: parentId ?? null });
      after?.();
      await load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }

  async function saveEdit(id) {
    const t = editBody.trim();
    if (!t) return;
    setBusy(true);
    try {
      await api.updateComment(id, t);
      setEditId(null); setEditBody('');
      await load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }

  async function remove(c) {
    setBusy(true);
    try {
      await api.deleteComment(c.id);
      await load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }

  const canModify = (c) => c.authorId === user.id || user.role === 'ADMIN';
  const tops = (comments || []).filter((c) => !c.parentId);
  const repliesOf = (id) => (comments || []).filter((c) => c.parentId === id);

  function CommentRow({ c, isReply }) {
    return (
      <div className={`comment ${isReply ? 'comment--reply' : ''}`}>
        <span className="comment-avatar">{initials(c.authorName)}</span>
        <div className="comment-main">
          <p className="comment-head">
            <strong>{c.authorName}</strong><RoleChip role={c.authorRole} />
            <time className="comment-time">{formatDateTime(c.createdAt)}{c.editedAt && ' · edited'}</time>
          </p>
          {editId === c.id ? (
            <div className="comment-edit">
              <textarea rows="2" value={editBody} onChange={(e) => setEditBody(e.target.value)} />
              <div className="comment-edit-actions">
                <Button size="sm" disabled={busy} onClick={() => saveEdit(c.id)}>Save</Button>
                <LinkButton onClick={() => { setEditId(null); setEditBody(''); }}>Cancel</LinkButton>
              </div>
            </div>
          ) : (
            <p className="comment-body">{c.body}</p>
          )}
          {editId !== c.id && (
            <div className="comment-actions">
              {!isReply && <button type="button" className="comment-link" onClick={() => { setReplyTo(c.id); setReplyBody(''); }}>Reply</button>}
              {canModify(c) && <button type="button" className="comment-link" onClick={() => { setEditId(c.id); setEditBody(c.body); }}>Edit</button>}
              {canModify(c) && <button type="button" className="comment-link comment-link--danger" onClick={() => remove(c)}>Delete</button>}
            </div>
          )}
          {replyTo === c.id && (
            <div className="comment-reply-box">
              <textarea rows="2" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply…" autoFocus />
              <div className="comment-edit-actions">
                <Button size="sm" disabled={busy || !replyBody.trim()} onClick={() => post(replyBody, c.id, () => { setReplyTo(null); setReplyBody(''); })}>Reply</Button>
                <LinkButton onClick={() => { setReplyTo(null); setReplyBody(''); }}>Cancel</LinkButton>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardTitle as="h2" className="comment-card-title"><IconChat /> Discussion {comments?.length ? <span className="comment-count">{comments.length}</span> : null}</CardTitle>

      <div className="comment-compose">
        <textarea
          rows="2"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment for the team…"
        />
        <Button size="sm" disabled={busy || !body.trim()} onClick={() => post(body, null, () => setBody(''))}>
          Comment
        </Button>
      </div>

      {comments == null ? (
        <p className="text-muted">Loading…</p>
      ) : tops.length === 0 ? (
        <p className="text-muted comment-empty">No comments yet — start the conversation.</p>
      ) : (
        <div className="comment-list">
          {tops.map((c) => (
            <div key={c.id} className="comment-thread">
              <CommentRow c={c} isReply={false} />
              {repliesOf(c.id).map((r) => <CommentRow key={r.id} c={r} isReply />)}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
