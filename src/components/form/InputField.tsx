import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  helper?: string;
  fullWidth?: boolean;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  error,
  helper,
  fullWidth = true,
  required = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
      <label htmlFor={inputId} className="form-label flex items-center gap-1.5">
        {icon && <span className="text-primary-500">{icon}</span>}
        {label}
        {required && <span className="text-error-500">*</span>}
      </label>
      
      <input
        id={inputId}
        className={`form-input ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
        {...props}
      />
      
      {error && (
        <p id={`${inputId}-error`} className="form-error">
          {error}
        </p>
      )}
      
      {helper && !error && (
        <p id={`${inputId}-helper`} className="form-helper">
          {helper}
        </p>
      )}
    </div>
  );
};

export default InputField;