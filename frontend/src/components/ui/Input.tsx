import { InputHTMLAttributes } from 'react';
import { useFieldError } from '@/hooks/useFieldError';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = ({ label, error, className = '', ...props }: InputProps) => {
  const fieldError = useFieldError(props.name ? String(props.name) : undefined);
  const finalError = error ?? fieldError;
  return (
    <div>
      <label
        htmlFor={props.id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
          finalError
            ? 'border-red-500'
            : 'border-gray-300'
        } ${className}`}
      />
      {finalError && <p className="mt-1 text-sm text-red-500">{finalError}</p>}
    </div>
  );
};
