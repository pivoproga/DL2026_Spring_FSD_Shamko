import { useEffect, useState } from 'react';
import type { MemeData } from '../types';
import { voteMeme } from '../api';

interface Props {
  meme: MemeData;
  onRefresh: () => void;
  onShare: () => void;
  isAuthorized: boolean;
  token: string | null;
  labels: {
    title: string;
    share: string;
    next: string;
    imageAlt: string;
    loadFailed: string;
    openDirect: string;
    loginRequiredVote: string;
    voteFailed: string;
  };
}

export default function MemeCard({ meme, onRefresh, onShare, isAuthorized, token, labels }: Props) {
  const [likes, setLikes] = useState(meme.likes);
  const [dislikes, setDislikes] = useState(meme.dislikes);
  const [voting, setVoting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [voteError, setVoteError] = useState('');

  useEffect(() => {
    setImageError(false);
    setLikes(meme.likes);
    setDislikes(meme.dislikes);
    setVoteError('');
  }, [meme.id, meme.url]);

  const handleVote = async (vote: 'like' | 'dislike') => {
    if (!isAuthorized) {
      setVoteError(labels.loginRequiredVote);
      return;
    }
    setVoting(true);
    setVoteError('');
    try {
      const result = await voteMeme(meme.id, vote, token);
      setLikes(result.likes);
      setDislikes(result.dislikes);
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : labels.voteFailed);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="meme-card">
      <div className="meme-card-header">
        <span>{labels.title}</span>
        <div className="meme-header-actions">
          <button onClick={onShare} className="btn-text">{labels.share}</button>
          <button onClick={onRefresh} className="btn-text">{labels.next}</button>
        </div>
      </div>
      {!imageError ? (
        <img
          src={meme.url}
          alt={labels.imageAlt}
          className="meme-image"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="meme-fallback">
          <p>{labels.loadFailed}</p>
          <a href={meme.url} target="_blank" rel="noreferrer">{labels.openDirect}</a>
        </div>
      )}
      <div className="meme-actions">
        <button onClick={() => void handleVote('like')} disabled={voting || !isAuthorized} className="btn-vote btn-like">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
          </svg>
          {likes}
        </button>
        <button onClick={() => void handleVote('dislike')} disabled={voting || !isAuthorized} className="btn-vote btn-dislike">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/>
            <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
          </svg>
          {dislikes}
        </button>
      </div>
      {voteError && <p className="msg-error meme-vote-error">{voteError}</p>}
    </div>
  );
}
