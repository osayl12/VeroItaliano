import { useState } from 'react';

// The real Vero Italiano logo (client/public/logo.webp, PNG fallback). Falls back to a text logo if missing.
export default function Logo({ small = false }) {
  const [hasImage, setHasImage] = useState(true);
  return (
    <span className={`logo ${small ? 'logo-sm' : ''}`}>
      {hasImage ? (
        <picture>
          <source srcSet="/logo.webp" type="image/webp" />
          <img
            src="/logo.png"
            alt="Vero Italiano"
            width="720"
            height="638"
            decoding="async"
            onError={() => setHasImage(false)}
          />
        </picture>
      ) : (
        <span className="logo-text">
          <span className="logo-flag" aria-hidden="true"><i /><i /><i /></span>
          Vero Italiano
        </span>
      )}
    </span>
  );
}
