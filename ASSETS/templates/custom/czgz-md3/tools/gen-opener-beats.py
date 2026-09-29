"""Prepares background music for CZ_OPENER and prints its beat grid.

  python3 tools/gen-opener-beats.py <music or video file>
  python3 tools/gen-opener-beats.py --grid      (grid of the committed file only)

Trims the silent head and tail, writes media/opener-bgm.ogg (Opus, 160 kbit/s)
and prints BEAT0 and BEAT (ms) to paste into gfx/opener.js: beat n is at
BEAT0 + n * BEAT from the first note. The grid is fitted to the kick drum
onsets rather than taken from a generic beat tracker, which can lock onto
the off-beats. It also prints each beat's kick strength and bass level, to
find the phrases, drop-outs and big hits the scene cues in opener.js refer
to by beat number; with a different piece of music re-check those numbers.
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


def trim(src):
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
    print(f"// {length:.2f} s, trimmed {head:.3f} s from the head")


def grid():
    import librosa
    y, sr = librosa.load(OUT, sr=22050, mono=True)
    hop = 128
    spec = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    t = librosa.frames_to_time(np.arange(spec.shape[1]), sr=sr, hop_length=hop)

    def flux(lo, hi):
        db = librosa.amplitude_to_db(spec[(freqs >= lo) & (freqs < hi)], ref=np.max)
        d = np.r_[0, np.maximum(0, np.diff(db, axis=1)).mean(0)]
        return d / d.max()

    kick = flux(20, 150)
    bass = spec[(freqs >= 30) & (freqs < 250)].sum(0)
    bass /= bass.max()
    peaks = librosa.util.peak_pick(kick, pre_max=20, post_max=20, pre_avg=40, post_avg=40, delta=0.12, wait=25)
    strong = [librosa.frames_to_time(p, sr=sr, hop_length=hop) * 1000 for p in peaks if kick[p] >= 0.4]
    if len(strong) < 4:
        sys.exit("Too few clear kick drum hits to fit a grid; set BEAT0 and BEAT by hand.")
    tempo = float(np.atleast_1d(librosa.beat.beat_track(y=y, sr=sr)[0])[0])
    # The tracker can report half or double tempo; fold it into 90-180 BPM.
    while tempo < 90:
        tempo *= 2
    while tempo > 180:
        tempo /= 2
    k = np.array(strong)
    best = None
    for period in np.arange(60000 / (tempo * 1.03), 60000 / (tempo * 0.97), 0.1):
        for phase in np.arange(0, period, 1.0):
            r = (k - phase) / period
            cost = np.sum(np.minimum(np.abs(r - np.round(r)) * period, 60))
            if best is None or cost < best[0]:
                best = (cost, period, phase)
    _, period, phase = best
    print(f"// {60000 / period:.2f} BPM, grid fitted to {len(k)} kicks")
    print(f"const BEAT0 = {phase:.0f};\nconst BEAT = {period:.1f};")
    print("// beat   ms  kick  bass")
    n = 0
    while phase + n * period < t[-1] * 1000:
        c = (phase + n * period) / 1000
        near = (t >= c - 0.05) & (t < c + 0.05)
        span = (t >= c) & (t < c + period / 1000)
        kv, bv = kick[near].max(), bass[span].mean()
        print(f"// {n:3d} {c * 1000:6.0f}  {kv:.2f}  {bv:.2f}  " + "K" * int(kv * 10) + ("   (bass drops out)" if bv < 0.06 else ""))
        n += 1


def main(args):
    if args != ["--grid"]:
        trim(args[0])
    grid()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
