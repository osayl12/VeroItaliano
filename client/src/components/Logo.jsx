import { useState } from 'react';

// Put the real logo at client/public/logo.png - until then a text logo is shown.
export default function Logo({ small = false }) {
  const [hasImage, setHasImage] = useState(true);
  return (
    <span className={`logo ${small ? 'logo-sm' : ''}`}>
      {hasImage ? (
        <img src="/logo.png" alt="Vero Italiano" onError={() => setHasImage(false)} />
      ) : (
        <span className="logo-text">
          <span className="logo-flag" aria-hidden="true"><i /><i /><i /></span>
          Vero Italiano
        </span>
      )}
    </span>
  );
}
