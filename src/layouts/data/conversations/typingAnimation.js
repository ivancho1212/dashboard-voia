// typingAnimation.js

export function injectTypingAnimation() {
  if (document.getElementById("typing-animation-style")) return;

  const style = document.createElement("style");
  style.id = "typing-animation-style";
  style.innerHTML = `
    @keyframes typingBlink {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes equalizer {
      0%, 100% { height: 8px; }
      50% { height: 16px; }
    }

    .fade-enter {
      opacity: 0;
      transform: translateY(4px);
    }

    .fade-enter-active {
      opacity: 1;
      transform: translateY(0);
      transition: all 300ms ease-in-out;
    }

    .fade-exit {
      opacity: 1;
    }

    .fade-exit-active {
      opacity: 0;
      transition: opacity 200ms ease-out;
    }
  `;
  document.head.appendChild(style);
}
