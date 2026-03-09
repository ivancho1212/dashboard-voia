// Hook para manejar el estado y lógica de mensajes
import { useState, useRef, useEffect } from "react";

export default function useChatMessages({ initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSender, setTypingSender] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll automático al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return { messages, setMessages, isTyping, setIsTyping, typingSender, setTypingSender, messagesEndRef };
}
