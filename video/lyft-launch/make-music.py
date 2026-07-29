import math
import random
import struct
import wave
from pathlib import Path


OUTPUT = Path(__file__).with_name("music-demo.wav")
SAMPLE_RATE = 48_000
DURATION = 30.0


def envelope(time: float) -> float:
    fade_in = min(1.0, time / 1.8)
    fade_out = min(1.0, max(0.0, DURATION - time) / 1.6)
    return fade_in * fade_out


def soft_pulse(time: float, center: float, width: float = 0.55) -> float:
    distance = (time - center) / width
    return math.exp(-(distance * distance) * 3.0)


random.seed(7)
phases = [random.random() * math.tau for _ in range(4)]
frequencies = [55.0, 82.5, 110.0, 165.0]
transition_times = [6.6, 13.8, 21.0, 29.0]

with wave.open(str(OUTPUT), "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)

    frames = bytearray()
    for index in range(int(SAMPLE_RATE * DURATION)):
        time = index / SAMPLE_RATE
        pad = 0.0
        for frequency, phase in zip(frequencies, phases):
            modulation = 1.0 + 0.004 * math.sin(math.tau * 0.07 * time + phase)
            pad += math.sin(math.tau * frequency * modulation * time + phase)
        pad *= 0.035

        shimmer = 0.012 * math.sin(math.tau * 330.0 * time + 0.4 * math.sin(time * 0.9))
        pulse = sum(soft_pulse(time, center) for center in transition_times)
        whoosh = pulse * (random.random() * 2.0 - 1.0) * 0.055
        signal = (pad + shimmer + whoosh) * envelope(time)

        left = max(-1.0, min(1.0, signal + 0.004 * math.sin(math.tau * 0.11 * time)))
        right = max(-1.0, min(1.0, signal - 0.004 * math.sin(math.tau * 0.11 * time)))
        frames.extend(struct.pack("<hh", int(left * 32767), int(right * 32767)))

    wav.writeframes(frames)

print(OUTPUT)
