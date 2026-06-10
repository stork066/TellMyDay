import { useCallback, useEffect, useState } from "react";

export type SpeechState = "idle" | "speaking" | "paused";

export function useSpeech(text: string) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [state, setState] = useState<SpeechState>("idle");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [charIndex, setCharIndex] = useState<number | null>(null);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setState("idle");
    setCharIndex(null);
  }, [supported]);

  // Cancel speech when the story text changes or the view unmounts.
  useEffect(() => stop, [text, stop]);

  function play() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onboundary = (e) => {
      if (e.name === "word") setCharIndex(e.charIndex);
    };
    utterance.onend = () => {
      setState("idle");
      setCharIndex(null);
    };
    utterance.onerror = () => {
      setState("idle");
      setCharIndex(null);
    };
    window.speechSynthesis.speak(utterance);
    setState("speaking");
  }

  function pauseOrResume() {
    if (!supported) return;
    if (state === "speaking") {
      window.speechSynthesis.pause();
      setState("paused");
    } else if (state === "paused") {
      window.speechSynthesis.resume();
      setState("speaking");
    }
  }

  return {
    supported,
    state,
    rate,
    setRate,
    pitch,
    setPitch,
    charIndex,
    play,
    pauseOrResume,
    stop,
  };
}
