"""Prepares background music for CZ_OPENER and prints its beat map.

  python3 tools/gen-opener-beats.py <music or video file>
  python3 tools/gen-opener-beats.py --grid      (beat map of the committed file only)

Trims the silent head and tail, writes media/opener-bgm.ogg (Opus, 160 kbit/s)
and prints BEATS, the time of every beat in ms from the first note, to paste
into gfx/opener.js. The beats follow the music's tempo even if it drifts: a
tight beat tracker gives the spacing, then the whole map is shifted so the
kick drum lands on the beats (generic trackers often lock onto the
off-beats). It also prints each beat's kick strength, bass level and a
section-change score, to find the phrases, drop-outs and big hits the scene
cues in opener.js refer to by beat number; with a different piece of music
re-check those numbers.
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
    t = librosa.frames_to_time(np.arange(spec.shape[1]), sr=sr, hop_length=hop) * 1000

    def flux(lo, hi):
        db = librosa.amplitude_to_db(spec[(freqs >= lo) & (freqs < hi)], ref=np.max)
        d = np.r_[0, np.maximum(0, np.diff(db, axis=1)).mean(0)]
        return d / d.max() if d.max() > 0 else d

    def peak(arr, c, w=30):
        m = (t >= c - w) & (t < c + w)
        return float(arr[m].max()) if m.any() else 0.0

    kick = flux(20, 150)
    bass = spec[(freqs >= 30) & (freqs < 250)].sum(0)
    bass /= bass.max()
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    tempo_fn = getattr(librosa.feature, "tempo", None) or librosa.beat.tempo   # librosa < 0.10
    tempo = float(np.atleast_1d(tempo_fn(onset_envelope=env, sr=sr, hop_length=hop))[0])
    while tempo < 90:           # the estimate can be half or double tempo
        tempo *= 2
    while tempo > 180:
        tempo /= 2
    _, frames = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=hop, start_bpm=tempo, tightness=6400, trim=False)
    beats = librosa.frames_to_time(frames, sr=sr, hop_length=hop) * 1000
    if len(beats) < 8:
        sys.exit("Could not find a steady beat; write BEATS by hand.")
    step = np.r_[np.diff(beats), np.diff(beats)[-1]]
    # Shift the map (by a fraction of each beat) so the kicks land on it.
    if kick.max() > 0:
        shift = max(np.arange(-0.5, 0.5, 0.01), key=lambda f: sum(peak(kick, c) for c in beats + f * step))
    else:
        shift = 0.0
        print("// no kick drum found: beats are the tracker's, check they are not on the off-beats")
    beats = beats + shift * step
    while beats[0] - step[0] >= 0:
        beats = np.r_[beats[0] - step[0], beats]
        step = np.r_[step[0], step]
    keep = (beats >= 0) & (beats <= len(y) / sr * 1000)   # only beats inside the audio
    beats, step = beats[keep], step[keep]
    # Section-change score: novelty of timbre and harmony around each beat.
    hop2 = 512
    feats = np.vstack([librosa.util.normalize(librosa.feature.mfcc(y=y, sr=sr, hop_length=hop2, n_mfcc=13), axis=1),
                       librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop2)])
    rec = librosa.segment.recurrence_matrix(feats, mode="affinity", sym=True, width=3)
    k = 16
    # Checkerboard: +1 within each side, -1 across, so a boundary scores high.
    kernel = np.outer(np.r_[-np.ones(k), np.ones(k)], np.r_[-np.ones(k), np.ones(k)])
    padded = np.pad(rec, k)
    nov = np.array([(padded[i:i + 2 * k, i:i + 2 * k] * kernel).sum() for i in range(rec.shape[0])])
    nov = np.maximum(nov, 0) / max(nov.max(), 1e-9)
    tn = librosa.frames_to_time(np.arange(len(nov)), sr=sr, hop_length=hop2) * 1000

    ms = np.round(beats).astype(int)
    print(f"// about {60000 / np.median(np.diff(beats)):.1f} BPM, {len(ms)} beats, kick shift {shift:+.2f} beat")
    rows = [", ".join(str(v) for v in ms[i:i + 10]) for i in range(0, len(ms), 10)]
    print("const BEATS = [\n  " + ",\n  ".join(rows) + "\n];")
    score = []
    for c in beats:
        near = (tn >= c - 240) & (tn < c + 240)
        score.append(float(nov[near].max()) if near.any() else 0.0)
    print("// beat    ms  kick  bass  section")
    for n, c in enumerate(beats):
        span = (t >= c) & (t < c + step[min(n, len(step) - 1)])
        kv, bv, nv = peak(kick, c), float(bass[span].mean()) if span.any() else 0.0, score[n]
        # A section change is a local peak of the score (within two beats).
        top = nv > 0.6 and nv == max(score[max(0, n - 2):n + 3])
        notes = ("   (bass drops out)" if bv < 0.06 else "") + ("   << section change" if top else "")
        print(f"// {n:3d} {c:6.0f}  {kv:.2f}  {bv:.2f}  {nv:.2f}  " + "K" * int(kv * 10) + notes)


def main(args):
    if args != ["--grid"]:
        trim(args[0])
    grid()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
