"use client";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        direction: "rtl",
        fontFamily: "Vazirmatn, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          textAlign: "center",
          maxWidth: "400px",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(249, 115, 22, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WifiOff size={40} color="#F97316" />
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "#F9FAFB",
            margin: 0,
          }}
        >
          شما آفلاین هستید
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "#9CA3AF",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          لطفاً اتصال اینترنت خود را بررسی کنید و دوباره امتحان کنید.
        </p>

        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: "#F97316",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "14px 32px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            fontFamily: "Vazirmatn, sans-serif",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EA6C0A";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F97316";
          }}
        >
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}
