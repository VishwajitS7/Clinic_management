import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ message = 'Loading...', size = 'md', className = '' }) => {
  return (
    <div className={`d-flex flex-column align-items-center justify-content-center p-4 ${className}`}>
      <Spinner
        animation="border"
        variant="primary"
        role="status"
        size={size === 'sm' ? 'sm' : undefined}
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      {message && <p className="mt-3 text-muted mb-0 small">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
