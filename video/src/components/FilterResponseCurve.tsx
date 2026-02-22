import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO } from "../lib/fonts";
import { SPRING_SMOOTH } from "../lib/timing";

type FilterType = "lowpass" | "highpass" | "bandpass";

type FilterResponseCurveProps = {
  cutoff: number; // 0-1 normalized position on log frequency axis
  resonance: number; // 0-1
  type?: FilterType;
  slope?: 12 | 24;
  delay?: number;
  width?: number;
  height?: number;
  color?: string;
  showLabels?: boolean;
  showGrid?: boolean;
};

// Compute magnitude response for a 2nd-order filter at normalized frequency
function filterMagnitude(
  fNorm: number,
  cutoffNorm: number,
  resonance: number,
  type: FilterType,
): number {
  const ratio = fNorm / cutoffNorm;
  // Q from resonance: low res = 0.5 (Butterworth), high res = 20 (sharp peak)
  const Q = 0.5 + resonance * 19.5;

  const r2 = ratio * ratio;
  const denom = Math.sqrt((1 - r2) ** 2 + (ratio / Q) ** 2);

  if (type === "lowpass") {
    return 1 / denom;
  } else if (type === "highpass") {
    return r2 / denom;
  } else {
    // bandpass
    return (ratio / Q) / denom;
  }
}

export const FilterResponseCurve: React.FC<FilterResponseCurveProps> = ({
  cutoff,
  resonance,
  type = "lowpass",
  slope = 12,
  delay = 0,
  width = 640,
  height = 280,
  color = COLORS.CYAN,
  showLabels = true,
  showGrid = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Padding for labels
  const padL = showLabels ? 50 : 10;
  const padR = 10;
  const padT = 20;
  const padB = showLabels ? 35 : 10;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Map cutoff (0-1) to log frequency
  const logMin = Math.log10(20);
  const logMax = Math.log10(20000);
  const cutoffLog = logMin + cutoff * (logMax - logMin);
  const cutoffFreq = 10 ** cutoffLog;
  const cutoffNorm = cutoffFreq / 20000; // normalize to Nyquist-ish

  // Sample points along log frequency axis
  const numPoints = 200;
  const points: string[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const freqLog = logMin + t * (logMax - logMin);
    const freq = 10 ** freqLog;
    const fNorm = freq / 20000;

    let mag = filterMagnitude(fNorm, cutoffNorm, resonance, type);
    if (slope === 24) {
      mag = mag * filterMagnitude(fNorm, cutoffNorm, resonance, type);
    }

    // Convert to dB, clamp range
    const dB = Math.max(-48, Math.min(24, 20 * Math.log10(Math.max(mag, 1e-6))));

    // Map to SVG coordinates
    const x = padL + t * plotW;
    // dB range: -48 to +24 (72dB range)
    const yNorm = (24 - dB) / 72;
    const y = padT + yNorm * plotH;

    points.push(`${x},${y}`);
  }

  // Clip path to reveal progressively
  const clipWidth = padL + reveal * (plotW + padR);

  // Grid lines at frequency decades
  const gridFreqs = [100, 1000, 10000];
  const gridLabels = ["100", "1k", "10k"];
  // dB grid lines
  const gridDBs = [-24, 0];

  // Cutoff marker x position
  const cutoffX = padL + cutoff * plotW;

  return (
    <div style={{ opacity, position: "relative" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <clipPath id={`reveal-${delay}`}>
            <rect x={0} y={0} width={clipWidth} height={height} />
          </clipPath>
          <linearGradient id={`fill-${delay}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Grid */}
        {showGrid &&
          gridFreqs.map((freq, i) => {
            const t = (Math.log10(freq) - logMin) / (logMax - logMin);
            const x = padL + t * plotW;
            return (
              <g key={`gf-${i}`}>
                <line
                  x1={x}
                  y1={padT}
                  x2={x}
                  y2={padT + plotH}
                  stroke={COLORS.TEXT_DIM}
                  strokeOpacity={0.15}
                  strokeDasharray="4,4"
                />
                {showLabels && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fill={COLORS.TEXT_DIM}
                    fontSize={11}
                    fontFamily={FONT_MONO}
                  >
                    {gridLabels[i]}
                  </text>
                )}
              </g>
            );
          })}

        {showGrid &&
          gridDBs.map((dB, i) => {
            const yNorm = (24 - dB) / 72;
            const y = padT + yNorm * plotH;
            return (
              <g key={`gd-${i}`}>
                <line
                  x1={padL}
                  y1={y}
                  x2={padL + plotW}
                  y2={y}
                  stroke={COLORS.TEXT_DIM}
                  strokeOpacity={dB === 0 ? 0.3 : 0.12}
                  strokeDasharray={dB === 0 ? undefined : "4,4"}
                />
                {showLabels && (
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill={COLORS.TEXT_DIM}
                    fontSize={11}
                    fontFamily={FONT_MONO}
                  >
                    {dB > 0 ? `+${dB}` : dB}dB
                  </text>
                )}
              </g>
            );
          })}

        {/* Filled area under curve */}
        <g clipPath={`url(#reveal-${delay})`}>
          <polygon
            points={`${points.join(" ")} ${padL + plotW},${padT + plotH} ${padL},${padT + plotH}`}
            fill={`url(#fill-${delay})`}
          />

          {/* Response curve */}
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        </g>

        {/* Cutoff marker */}
        {reveal > 0.5 && (
          <g opacity={interpolate(reveal, [0.5, 1], [0, 0.8])}>
            <line
              x1={cutoffX}
              y1={padT}
              x2={cutoffX}
              y2={padT + plotH}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="6,4"
              strokeOpacity={0.5}
            />
            {showLabels && (
              <text
                x={cutoffX}
                y={padT - 6}
                textAnchor="middle"
                fill={color}
                fontSize={11}
                fontFamily={FONT_MONO}
              >
                {Math.round(cutoffFreq)} Hz
              </text>
            )}
          </g>
        )}

        {/* Plot border */}
        <rect
          x={padL}
          y={padT}
          width={plotW}
          height={plotH}
          fill="none"
          stroke={COLORS.TEXT_DIM}
          strokeOpacity={0.2}
          strokeWidth={1}
        />
      </svg>
    </div>
  );
};
