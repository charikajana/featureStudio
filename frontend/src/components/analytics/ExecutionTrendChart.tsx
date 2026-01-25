import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button
} from '@mui/material';

interface RunSummary {
    runId: number;
    passedCount: number;
    failedCount: number;
    skippedCount: number;
    url?: string;
    timestamp: string;
}

interface ExecutionTrendChartProps {
    recentRuns: RunSummary[];
}

export const ExecutionTrendChart: React.FC<ExecutionTrendChartProps> = ({ recentRuns }) => {
    const [hoveredRunIndex, setHoveredRunIndex] = useState<number | null>(null);
    const [showVolume, setShowVolume] = useState(true);
    const [showPassRate, setShowPassRate] = useState(true);

    if (!recentRuns || recentRuns.length === 0) {
        return (
            <Paper sx={{ p: 4, borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No execution history available
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, borderRadius: '24px', height: '100%', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Execution Volume & Pass Rate</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Trend analysis across latest 10 builds</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, bgcolor: '#f1f5f9', p: 0.5, borderRadius: '12px' }}>
                    <Button
                        size="small"
                        onClick={() => setShowVolume(!showVolume)}
                        sx={{
                            borderRadius: '10px',
                            px: 2,
                            py: 0.5,
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            textTransform: 'none',
                            bgcolor: showVolume ? 'white' : 'transparent',
                            color: showVolume ? '#0f172a' : '#64748b',
                            boxShadow: showVolume ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            '&:hover': { bgcolor: showVolume ? 'white' : 'rgba(0,0,0,0.04)' }
                        }}
                    >
                        Volume
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setShowPassRate(!showPassRate)}
                        sx={{
                            borderRadius: '10px',
                            px: 2,
                            py: 0.5,
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            textTransform: 'none',
                            bgcolor: showPassRate ? 'white' : 'transparent',
                            color: showPassRate ? '#6366f1' : '#64748b',
                            boxShadow: showPassRate ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            '&:hover': { bgcolor: showPassRate ? 'white' : 'rgba(0,0,0,0.04)' }
                        }}
                    >
                        Pass Rate %
                    </Button>
                </Box>
            </Box>

            <Box sx={{ flexGrow: 1, width: '100%', position: 'relative', mt: 2, minHeight: 0 }}>
                <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <defs>
                        <linearGradient id="passedPill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="failedPill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#e11d48" />
                        </linearGradient>
                        <linearGradient id="skippedPill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#64748b" />
                        </linearGradient>
                    </defs>

                    {/* Axis Labels and Grid */}
                    {(() => {
                        const maxTests = Math.max(...recentRuns.map((r: any) => r.passedCount + r.failedCount + r.skippedCount)) || 10;
                        let ticks = [0, Math.round(maxTests * 0.25), Math.round(maxTests * 0.5), Math.round(maxTests * 0.75), maxTests];

                        return (
                            <g>
                                <text x="15" y="200" textAnchor="middle" transform="rotate(-90 15,200)" fill="#64748b" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Tests</text>
                                {ticks.map((tickValue) => {
                                    const y = 350 - (tickValue / maxTests) * 300;
                                    return (
                                        <g key={`l-tick-${tickValue}`}>
                                            <line x1="45" y1={y} x2="755" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray={tickValue === 0 ? "0" : "5,5"} />
                                            <text x="38" y={y} textAnchor="end" dominantBaseline="middle" fill="#94a3b8" style={{ fontSize: '11px', fontWeight: 900 }}>{tickValue}</text>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })()}

                    {(() => {
                        const trendPoints: { x: number, y: number }[] = [];
                        const maxTotal = Math.max(...recentRuns.map((r: any) => r.passedCount + r.failedCount + r.skippedCount)) || 1;
                        const barGap = (680 / recentRuns.length);
                        const barWidth = Math.min(55, barGap * 0.75);

                        recentRuns.forEach((run, idx) => {
                            const x = 60 + (idx * barGap);
                            const yTrend = 350 - (run.passedCount / maxTotal) * 300;
                            trendPoints.push({ x: x + barWidth / 2, y: yTrend });
                        });

                        return (
                            <>
                                {/* Volume Bars */}
                                {showVolume && recentRuns.map((run, idx) => {
                                    const x = 60 + (idx * barGap);
                                    const hPassed = (run.passedCount / maxTotal) * 300;
                                    const hFailed = (run.failedCount / maxTotal) * 300;
                                    const hSkipped = (run.skippedCount / maxTotal) * 300;

                                    return (
                                        <g
                                            key={`bar-${run.runId}`}
                                            onMouseEnter={() => setHoveredRunIndex(idx)}
                                            onMouseLeave={() => setHoveredRunIndex(null)}
                                            onClick={() => run.url ? window.open(run.url, '_blank') : console.warn('No build URL available for run', run.runId)}
                                            style={{ cursor: run.url ? 'pointer' : 'default' }}
                                        >
                                            <rect x={x - 10} y="40" width={barWidth + 20} height="330" fill="transparent" />
                                            {hoveredRunIndex === idx && (
                                                <rect x={x - 10} y="40" width={barWidth + 20} height="330" fill="rgba(99, 102, 241, 0.05)" rx="16" />
                                            )}
                                            <rect x={x} y={350 - hPassed} width={barWidth} height={hPassed} fill="url(#passedPill)" rx={hFailed + hSkipped === 0 ? 8 : 4} />
                                            {hFailed > 0 && <rect x={x} y={350 - hPassed - hFailed} width={barWidth} height={hFailed} fill="url(#failedPill)" rx={hSkipped === 0 ? 8 : 4} stroke="white" strokeWidth="1" />}
                                            {hSkipped > 0 && <rect x={x} y={350 - hPassed - hFailed - hSkipped} width={barWidth} height={hSkipped} fill="url(#skippedPill)" rx={8} stroke="white" strokeWidth="1" />}
                                            <text
                                                x={x + barWidth / 2}
                                                y={380}
                                                textAnchor="middle"
                                                fill={hoveredRunIndex === idx ? "#0f172a" : "#cbd5e1"}
                                                style={{ fontSize: '11px', fontWeight: 900, transition: 'all 0.2s' }}
                                            >
                                                #{run.runId}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Trend Line */}
                                {showPassRate && trendPoints.length > 1 && (
                                    <g>
                                        <path
                                            d={`M ${trendPoints[0].x},${trendPoints[0].y} ` + trendPoints.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')}
                                            fill="none"
                                            stroke="#6366f1"
                                            strokeWidth="5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ filter: 'drop-shadow(0px 8px 12px rgba(99,102,241,0.4))', transition: 'all 0.6s ease' }}
                                        />
                                        {trendPoints.map((p, i) => (
                                            <circle
                                                key={`point-${i}`}
                                                cx={p.x}
                                                cy={p.y}
                                                r={hoveredRunIndex === i ? 9 : 6}
                                                fill="white"
                                                stroke="#6366f1"
                                                strokeWidth="4"
                                                style={{ transition: 'all 0.25s ease' }}
                                            />
                                        ))}
                                    </g>
                                )}

                                {!showVolume && recentRuns.map((run, idx) => {
                                    const x = 60 + (idx * barGap);
                                    return (
                                        <g key={`hitbox-${run.runId}`} onMouseEnter={() => setHoveredRunIndex(idx)} onMouseLeave={() => setHoveredRunIndex(null)} onClick={() => run.url && window.open(run.url, '_blank')} style={{ cursor: run.url ? 'pointer' : 'default' }}>
                                            <rect x={x} y="40" width={barWidth} height="310" fill="transparent" />
                                            <text x={x + barWidth / 2} y={380} textAnchor="middle" fill={hoveredRunIndex === idx ? "#0f172a" : "#cbd5e1"} style={{ fontSize: '11px', fontWeight: 900 }}>#{run.runId}</text>
                                        </g>
                                    );
                                })}

                                {/* Tooltip Positioning */}
                                {hoveredRunIndex !== null && (() => {
                                    const run = recentRuns[hoveredRunIndex];
                                    const barX = 60 + (hoveredRunIndex * barGap);
                                    const total = run.passedCount + run.failedCount + run.skippedCount;
                                    const passRate = ((run.passedCount / Math.max(1, total)) * 100).toFixed(1);

                                    let tooltipX = barX - 60;
                                    if (tooltipX < 10) tooltipX = 10;
                                    if (tooltipX > 620) tooltipX = 620;

                                    return (
                                        <foreignObject x={tooltipX} y={20} width="175" height="135" style={{ pointerEvents: 'none' }}>
                                            <Paper elevation={12} sx={{ p: 1.5, bgcolor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', color: 'white', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <Typography sx={{ fontSize: '11px', fontWeight: 900, mb: 0.8, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 0.5 }}>BUILD #{run.runId}</Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>Passed</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>{run.passedCount}</Typography></Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>Failed</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>{run.failedCount}</Typography></Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Skipped</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>{run.skippedCount || 0}</Typography></Box>
                                                    <Box sx={{ mt: 1, pt: 0.5, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography sx={{ fontSize: '10px', fontWeight: 700 }}>Pass Rate</Typography>
                                                        <Typography sx={{ fontSize: '10px', fontWeight: 900, color: '#6366f1' }}>{passRate}%</Typography>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </foreignObject>
                                    );
                                })()}
                            </>
                        );
                    })()}
                </svg>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 5, mt: 5, pb: 1 }}>
                {[
                    { grad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', l: 'Passed' },
                    { grad: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', l: 'Failed' },
                    { grad: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', l: 'Skipped' }
                ].map(leg => (
                    <Box key={leg.l} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: leg.grad, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.5px' }}>{leg.l}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};
