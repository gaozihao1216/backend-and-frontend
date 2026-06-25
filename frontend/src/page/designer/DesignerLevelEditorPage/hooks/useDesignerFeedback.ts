import { useState } from "react";

export const useDesignerFeedback = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return {
    message,
    setMessage,
    error,
    setError,
  };
};
