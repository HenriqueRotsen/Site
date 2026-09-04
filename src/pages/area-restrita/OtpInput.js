import React, { useEffect, useRef } from 'react';

export function OtpInput({
  value = '',
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  id = 'otp',
  'aria-label': ariaLabel = 'Código de verificação',
}) {
  const inputsRef = useRef([]);
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, length)
    .split('');

  while (digits.length < length) digits.push('');

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const emit = (nextDigits) => {
    onChange(nextDigits.join('').slice(0, length));
  };

  const focusAt = (index) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  };

  const handleChange = (index, raw) => {
    const cleaned = String(raw).replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      emit(next);
      return;
    }

    const chars = cleaned.split('');
    const next = [...digits];
    let cursor = index;
    for (const char of chars) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }
    emit(next);
    focusAt(Math.min(cursor, length - 1));
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        emit(next);
        return;
      }
      if (index > 0) {
        event.preventDefault();
        const next = [...digits];
        next[index - 1] = '';
        emit(next);
        focusAt(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = String(event.clipboardData.getData('text') || '')
      .replace(/\D/g, '')
      .slice(0, length);
    if (!pasted) return;
    const next = Array.from({ length }, (_, i) => pasted[i] || '');
    emit(next);
    focusAt(Math.min(pasted.length, length) - 1);
  };

  return (
    <div className="otp-input" role="group" aria-label={ariaLabel}>
      {digits.map((digit, index) => (
        <input
          key={`${id}-${index}`}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          id={index === 0 ? id : undefined}
          className={`otp-input__cell${digit ? ' is-filled' : ''}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Dígito ${index + 1} de ${length}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
