"use client";

import { useState } from "react";

export default function PasswordInput({
  name,
  placeholder,
  required,
  minLength,
  autoComplete,
  style,
  defaultValue,
}: {
  name: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  style?: React.CSSProperties;
  defaultValue?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        style={{ ...style, paddingRight: "42px" }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        tabIndex={-1}
        style={{
          position: "absolute",
          right: "4px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          padding: "8px",
          fontSize: "16px",
          color: "#666",
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
