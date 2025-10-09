import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, ...props }) => (
  <div className="flex flex-col mb-3">
    <label className="text-sm font-medium mb-1">{label}</label>
    <input
      {...props}
      className={`border p-2 rounded-md focus:outline-none ${
        error ? "border-red-500" : "border-gray-300"
      }`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export default Input;
