import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, CheckCircle, Upload, X } from 'lucide-react';
import { getApiUrl } from '../config';
import './Feedback.css';

const MAX_FILES = 10;
const MAX_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function Feedback() {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const addFiles = (newFiles) => {
    const valid = [];
    for (const f of newFiles) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not a supported image type.`);
        return;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`"${f.name}" exceeds ${MAX_SIZE_MB} MB.`);
        return;
      }
      valid.push(f);
    }
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      if (combined.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed.`);
        return prev;
      }
      setError(null);
      return combined;
    });
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (feedback.trim().length < 10) return;

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('feedback', feedback.trim());
      if (email.trim()) formData.append('email', email.trim());
      files.forEach((f) => formData.append('files', f));

      const response = await fetch(getApiUrl('api/feedback'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.detail || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not connect to the server. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-page">
        <div className="feedback-page__container">
          <div className="feedback-page__success">
            <CheckCircle size={48} />
            <h2>We got your feedback!</h2>
            <p>Thank you for helping us improve. Every bit of feedback makes Nearby Nearby better for everyone.</p>
            <Link to="/" className="feedback-page__back-link">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <div className="feedback-page__container">
        <div className="feedback-page__header">
          <MessageSquare size={32} />
          <h1>We&rsquo;re Listening</h1>
          <p>Found a bug? Have a suggestion? We want to hear it all. You can attach screenshots too.</p>
        </div>

        <form className="feedback-page__form" onSubmit={handleSubmit}>
          <div className="feedback-page__field">
            <label htmlFor="fb-email">Your email (optional)</label>
            <input
              id="fb-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={255}
            />
          </div>

          <div className="feedback-page__field">
            <label htmlFor="fb-feedback">Your feedback *</label>
            <textarea
              id="fb-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think, what's broken, or what you'd love to see..."
              rows={6}
              minLength={10}
              maxLength={5000}
              required
            />
          </div>

          <div className="feedback-page__field">
            <label>Screenshots (optional, up to {MAX_FILES} images)</label>
            <div
              className="feedback-page__dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
            >
              <Upload size={24} />
              <span>Drop images here or click to browse</span>
              <span className="feedback-page__dropzone-hint">JPG, PNG, GIF, WebP &middot; Max {MAX_SIZE_MB} MB each</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={(e) => { addFiles(Array.from(e.target.files)); e.target.value = ''; }}
              className="feedback-page__file-input"
            />
          </div>

          {files.length > 0 && (
            <div className="feedback-page__previews">
              {files.map((f, i) => (
                <div key={i} className="feedback-page__preview">
                  <img src={URL.createObjectURL(f)} alt={f.name} />
                  <button
                    type="button"
                    className="feedback-page__preview-remove"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${f.name}`}
                  >
                    <X size={14} />
                  </button>
                  <span className="feedback-page__preview-name">{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {error && <p className="feedback-page__error">{error}</p>}

          <button
            type="submit"
            className="feedback-page__submit"
            disabled={submitting || feedback.trim().length < 10}
          >
            {submitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Feedback;
