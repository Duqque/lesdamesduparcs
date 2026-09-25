"""Génère un extrait sonore placeholder (stomp / clap + motif "Al-lez Pa-ris").
À remplacer par l'enregistrement réel du chant dans public/audio/.
Usage: python3 scripts/generate-placeholder-audio.py
"""
import math
import random
import struct
import wave

SR, BPM, DUR = 22050, 112, 14
BEAT = 60 / BPM
N = SR * DUR
buf = [0.0] * N
random.seed(4)


def add(t0, fn, length):
    s = int(t0 * SR)
    for i in range(min(int(length * SR), N - s)):
        buf[s + i] += fn(i / SR)


def kick(t):
    return math.sin(2 * math.pi * (90 * math.exp(-t * 18) + 45) * t) * math.exp(-t * 9) * 0.9


def clap(t):
    return (random.random() * 2 - 1) * math.exp(-t * 30) * 0.55


def voice(f):
    return lambda t: (math.sin(2 * math.pi * f * t) + 0.4 * math.sin(4 * math.pi * f * t)) * math.exp(-t * 7) * 0.25 * min(1, t * 80)


bar = BEAT * 4
for b in range(int(DUR / bar)):
    t = b * bar
    add(t, kick, 0.35)
    add(t + BEAT * 2, kick, 0.35)
    add(t + BEAT, clap, 0.2)
    add(t + BEAT * 3, clap, 0.2)
    for off, f in ((0, 392), (0.5, 392), (1, 440), (1.5, 440), (2, 523)):
        add(t + BEAT * off, voice(f), 0.4)

peak = max(abs(x) for x in buf)
with wave.open("public/audio/allez-paris-preview.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x / peak)) * 30000)) for x in buf))

bars = 64
seg = N // bars
print([round(max(abs(x) for x in buf[i * seg:(i + 1) * seg]) / peak, 2) for i in range(bars)])
