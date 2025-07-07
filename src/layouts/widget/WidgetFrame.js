import React from "react";
import ChatWidget from "layouts/bot/style/components/ChatWidget";

function WidgetFrame() {
  const searchParams = new URLSearchParams(window.location.search);
  const botId = parseInt(searchParams.get("bot"), 10) || 1; // fallback bot
  const userId = 45; // de momento quemado para pruebas

  return (
    <div style={{ height: "100vh", margin: 0 }}>
      <ChatWidget
        botId={botId}
        userId={userId}
        theme="light"
        primaryColor="#3B82F6"
        secondaryColor="#E0F2FE"
        fontFamily="Arial"
        headerBackgroundColor="#F3F4F6"
        position="bottom-right"
        avatarUrl="/logo192.png"
      />
    </div>
  );
}

export default WidgetFrame;
