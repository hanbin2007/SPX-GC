"""Prepares background music for CZ_OPENER and prints its beat grid.

  python3 tools/gen-opener-beats.py <music or video file>

Trims the silent head and tail, writes media/opener-bgm.ogg (Opus, 160 kbit/s)
and prints the BEATS array (ms from the first note) to paste into
gfx/opener.js. The scene cues in opener.js refer to beats by index, so with
a different piece of music check which indices fall on its section changes.
Needs ffmpeg (on PATH, or the imageio-ffmpeg package) and librosa.
"""
import os, shutil, subprocess, sys, tempfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "media", "opener-bgm.ogg")


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def main(src):
    import librosa
    ff = ffmpeg()
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "full.wav")
        subprocess.run([ff, "-v", "error", "-y", "-i", src, "-vn", "-ac", "2", "-ar", "48000", wav], check=True)
        y, sr = librosa.load(wav, sr=48000, mono=True)
        loud = np.flatnonzero(np.abs(y) > 1e-3)
        head, tail = max(0, loud[0] / sr - 0.003), loud[-1] / sr + 0.03
        length = tail - head
        subprocess.run([ff, "-v", "error", "-y", "-ss", f"{head:.3f}", "-to", f"{tail:.3f}", "-i", wav,
                        "-af", f"afade=t=in:d=0.004,afade=t=out:st={length - 0.05:.3f}:d=0.05",
                        "-c:a", "libopus", "-b:a", "160k", OUT], check=True)
        y, sr = librosa.load(OUT, sr=22050, mono=True)
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
    tempo, beats = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=256, tightness=200, trim=False)
    ms = np.round(librosa.frames_to_time(beats, sr=sr, hop_length=256) * 1000).astype(int)
    print(f"// {float(np.atleast_1d(tempo)[0]):.1f} BPM, {length:.2f} s, trimmed {head:.3f} s from the head")
    rows = [", ".join(str(v) for v in ms[i:i + 10]) for i in range(0, len(ms), 10)]
    print("const BEATS = [\n  " + ",\n  ".join(rows) + "\n];")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
