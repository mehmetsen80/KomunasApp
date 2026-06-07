import React from 'react';
import './styles.scss';

const Button = ({
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
  icon: Icon = null,
  href,
  ...rest
}) => {
  const buttonClass = `premiumBtn btn-${variant} ${className} ${loading ? 'btn-loading' : ''}`;

  if (href) {
    return (
      <a
        href={disabled || loading ? undefined : href}
        className={buttonClass}
        onClick={disabled || loading ? (e) => e.preventDefault() : onClick}
        {...rest}
      >
        {loading ? (
          <span className="btn-spinner"></span>
        ) : (
          <>
            {Icon && <span className="btn-icon">{Icon}</span>}
            {children}
          </>
        )}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="btn-spinner"></span>
      ) : (
        <>
          {Icon && <span className="btn-icon">{Icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
