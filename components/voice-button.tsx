"use client";

import { useState,  useEffect } from "react";

export function VoiceButton({
  isListening,
  audioLevel,
}: {
  isListening: boolean;
  audioLevel: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [animParams, setAnimParams] = useState({
    hue: 260,
    saturation: 80,
    lightness: 60,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isListening) {
      setAnimParams((prev) => ({
        ...prev,
        saturation: 80 + audioLevel * 30,
      }));
    } else {
      setAnimParams({
        hue: 260,
        saturation: 80,
        lightness: 60,
      });
    }
  }, [isListening, audioLevel]);

  if (!mounted) {
    return (
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-neutral-100 animate-pulse" />
    );
  }

  return (
    <div className="relative w-24 h-24 md:w-32 md:h-32 animate-float">
      {/* Main blob container with circular clip */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden transition-all duration-300"
        style={{
          transform: isListening
            ? `scale(${1 + audioLevel * 0.5}) translateY(${
                -8 - audioLevel * 8
              }px)`
            : "scale(1) translateY(0)",
          filter: `blur(${isListening ? 3 + audioLevel * 3 : 0}px)`,
        }}
      >
        {/* Blob background */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            background: `radial-gradient(circle at ${50 + audioLevel * 15}% ${
              50 - audioLevel * 15
            }%, 
              hsl(${animParams.hue}, ${animParams.saturation}%, ${
              animParams.lightness + 15
            }%) 0%, 
              hsl(${animParams.hue - 40}, ${animParams.saturation}%, ${
              animParams.lightness
            }%) 50%, 
              hsl(${animParams.hue - 80}, ${animParams.saturation - 15}%, ${
              animParams.lightness - 15
            }%) 100%)`,
            transform: isListening
              ? `scale(${1 + audioLevel * 0.4}) rotate(${audioLevel * 45}deg)`
              : "scale(1) rotate(0deg)",
            boxShadow: `
              0 12px 48px rgba(59, 130, 246, 0.3),
              inset 0 4px 12px rgba(255, 255, 255, 0.4),
              inset 0 -4px 12px rgba(0, 0, 0, 0.1)
            `,
          }}
        />

        {/* Morphing blobs */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full transition-all duration-300"
              style={{
                width: `${30 + i * 10}%`,
                height: `${30 + i * 10}%`,
                left: `${
                  30 +
                  Math.sin(Date.now() * 0.002 + i) * 30 +
                  (isListening ? audioLevel * 25 : 0)
                }%`,
                top: `${
                  30 +
                  Math.cos(Date.now() * 0.002 + i * 2) * 30 +
                  (isListening ? audioLevel * 25 : 0)
                }%`,
                background: `radial-gradient(circle, 
                  rgba(255, 255, 255, ${
                    0.6 - i * 0.05 + (isListening ? audioLevel * 0.6 : 0)
                  }) 0%, 
                  transparent 70%)`,
                filter: `blur(${4 + (isListening ? audioLevel * 6 : 0)}px)`,
                transform: `scale(${
                  1 + (isListening ? audioLevel * 0.8 : 0)
                }) rotate(${Date.now() * 0.02 * (i + 1)}deg)`,
                animation: `blobMorph ${2 + i * 0.5}s infinite ease-in-out`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Active state overlay */}
        {isListening && (
          <div
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: `radial-gradient(circle at ${50 - audioLevel * 20}% ${
                50 + audioLevel * 20
              }%, 
                rgba(255, 255, 255, ${0.5 + audioLevel * 0.6}) 0%, 
                transparent 60%)`,
              transform: `scale(${1 + audioLevel * 0.5}) rotate(${
                audioLevel * -45
              }deg)`,
              filter: `blur(${3 + audioLevel * 6}px)`,
            }}
          />
        )}

        {/* Bottom indicator dot */}
        <div
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full transition-all duration-300"
          style={{
            opacity: isListening ? 1 : 0.6,
            transform: `translateX(-50%) scale(${
              isListening ? 1 + audioLevel * 0.8 : 1
            })`,
            boxShadow: `0 0 ${6 + audioLevel * 12}px rgba(255, 255, 255, ${
              0.7 + audioLevel * 0.6
            })`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(2deg);
          }
          50% {
            transform: translateY(-12px) rotate(0deg);
          }
          75% {
            transform: translateY(-8px) rotate(-2deg);
          }
        }

        @keyframes blobMorph {
          0%,
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 70% 30% 40% 60% / 70% 40% 60% 30%;
          }
          25% {
            transform: translate(8px, -8px) scale(1.2) rotate(8deg);
            border-radius: 40% 70% 60% 30% / 60% 70% 30% 40%;
          }
          50% {
            transform: translate(0, -15px) scale(1.1) rotate(0deg);
            border-radius: 60% 40% 30% 70% / 40% 60% 70% 30%;
          }
          75% {
            transform: translate(-8px, -8px) scale(1.2) rotate(-8deg);
            border-radius: 50% 50% 40% 60% / 60% 40% 50% 50%;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
