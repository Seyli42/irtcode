import React from 'react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  icon?: React.ReactNode;
  error?: string;
  helper?: string;
  fullWidth?: boolean;
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  icon,
  error,
  helper,
  fullWidth = true,
  required = false,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
      <label htmlFor={selectId} className="form-label flex items-center gap-1.5">
        {icon && <span className="text-primary-500">{icon}</span>}
        {label}
        {required && <span className="text-error-500">*</span>}
      </label>
      
      <select
        id={selectId}
        className={`form-select ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : helper ? `${selectId}-helper` : undefined}
        {...props}
      >
        <option value="" disabled>Choisissez...</option>
        {options.map(option => (
          <option 
            key={option.value} 
            value={option.value} 
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p id={`${selectId}-error`} className="form-error">
          {error}
        </p>
      )}
      
      {helper && !error && (
        <p id={`${selectId}-helper`} className="form-helper">
          {helper}
        </p>
      )}
    </div>
  );
};

export default SelectField;