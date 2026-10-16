'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';

interface TypingTextProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  className?: string;
  cursorClassName?: string;
}

export function TypingText({
  words,
  typingSpeed = 90,
  deletingSpeed = 45,
  pauseTime = 2200,
  className = '',
  cursorClassName = '',
}: TypingTextProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(words[0]?.length || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor
  useEffect(() => {
    if (!isMounted) return;
    const timeout2 = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(timeout2);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted || words.length === 0) return;

    if (subIndex === words[index].length + 1 && !isDeleting) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && isDeleting) {
      const timeout = setTimeout(() => {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % words.length);
      }, 250);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [isMounted, subIndex, index, isDeleting, words, typingSpeed, deletingSpeed, pauseTime]);

  const currentWord = words[index] || '';
  const displayText = isMounted ? currentWord.substring(0, subIndex) : (words[0] || '');

  return (
    <span className={`inline-flex items-center whitespace-nowrap ${className}`} suppressHydrationWarning>
      <span className="inline-block whitespace-nowrap" suppressHydrationWarning>
        {displayText}
      </span>
      <span
        aria-hidden="true"
        className={`ml-1.5 sm:ml-2 inline-block w-[3px] sm:w-[4px] h-[0.85em] rounded-full transition-opacity duration-150 ${
          blink ? 'opacity-100' : 'opacity-0'
        } ${cursorClassName || 'bg-primary-fixed'}`}
      />
    </span>
  );
}
