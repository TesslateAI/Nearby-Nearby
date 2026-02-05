import { useState } from 'react';
import usePWAInstall from '../hooks/usePWAInstall';
import './InstallButton.css';

function InstallButton({ variant = 'default', className = '' }) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (isInstallable) {
      await promptInstall();
    } else {
      // Show instructions for browsers that don't support install prompt
      setShowIOSInstructions(true);
    }
  };

  const closeInstructions = () => {
    setShowIOSInstructions(false);
  };

  if (isInstalled) {
    return (
      <span className={`install-button install-button--installed ${className}`}>
        Installed
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`install-button install-button--${variant} ${className}`}
        aria-label="Download Nearby Nearby app"
      >
        <svg
          className="install-button__icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download Nearby Nearby
      </button>

      {showIOSInstructions && (
        <div className="install-modal" onClick={closeInstructions}>
          <div className="install-modal__content" onClick={(e) => e.stopPropagation()}>
            <button className="install-modal__close" onClick={closeInstructions}>
              &times;
            </button>
            <h3 className="install-modal__title">Add to Home Screen</h3>

            {isIOS ? (
              <div className="install-modal__instructions">
                <p>To install Nearby Nearby on your iPhone or iPad:</p>
                <ol>
                  <li>
                    Tap the <strong>Share</strong> button
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: 'middle', marginLeft: '4px'}}>
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    at the bottom of Safari
                  </li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong> in the top right corner</li>
                </ol>
                <p className="install-modal__note">
                  The app will appear on your home screen and work offline.
                </p>
              </div>
            ) : (
              <div className="install-modal__instructions">
                <p>To install Nearby Nearby:</p>
                <ol>
                  <li>Look for the install icon in your browser's address bar</li>
                  <li>Or open browser menu and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
                </ol>
                <p className="install-modal__note">
                  The app will be added to your device and work offline.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default InstallButton;
