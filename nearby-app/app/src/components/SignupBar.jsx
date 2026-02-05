import { useState } from 'react';
import { getApiUrl } from '../config';
import './SignupBar.css';

function SignupBar() {
  const [status, setStatus] = useState(''); // 'success', 'error', or ''
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = data.get('email');

    if (!email) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setStatus('');
    setMessage('');

    try {
      const response = await fetch(getApiUrl('api/waitlist'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(result.message || 'Thanks for signing up! We\'ll keep you updated.');
        e.target.reset();
      } else {
        setStatus('error');
        setMessage(result.detail || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Unable to sign up. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="nn-signup" aria-labelledby="nn-signup-title">
      <div className="nn-signup__inner">
        <h3 id="nn-signup-title" className="nn-signup__title">
          Subscribe to <span>Stay in the Loop!</span>
        </h3>

        <form className="su-form" onSubmit={onSubmit} noValidate>
          <div className="su-control">
            <input
              className="su-input"
              type="email"
              name="email"
              placeholder="Enter your email here!"
              aria-label="Email address"
              required
              disabled={isSubmitting}
            />
            <button className="su-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
          {status && (
            <div className={`su-message su-message--${status}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

export default SignupBar;
