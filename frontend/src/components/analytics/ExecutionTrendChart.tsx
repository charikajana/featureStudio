import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    alpha
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
                            color: showPassRate ? '#3b82f6' : '#64748b',
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
                        <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Axis Labels and Grid */}
                    {(() => {
                        const maxTests = Math.max(...recentRuns.map((r: any) => r.passedCount + r.failedCount + r.skippedCount)) || 10;
                        let ticks = [0, Math.round(maxTests * 0.25), Math.round(maxTests * 0.5), Math.round(maxTests * 0.75), maxTests];

                        return (
                            <g>
                                <text x="15" y="200" textAnchor="middle" transform="rotate(-90 15,200)" fill="#64748b" style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Total Tests</text>
                                {ticks.map((tickValue) => {
                                    const y = 350 - (tickValue / maxTests) * 300;
                                    return (
                                        <g key={`l-tick-${tickValue}`}>
                                            <line x1="45" y1={y} x2="755" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray={tickValue === 0 ? "0" : "8,8"} />
                                            <text x="38" y={y} textAnchor="end" dominantBaseline="middle" fill="#94a3b8" style={{ fontSize: '10px', fontWeight: 700 }}>{tickValue}</text>
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
                        const barWidth = Math.min(48, barGap * 0.7);

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
                                        <g key={`bar-visual-${run.runId}`} style={{ pointerEvents: 'none' }}>
                                            {hoveredRunIndex === idx && (
                                                <rect x={x - 8} y="40" width={barWidth + 16} height="320" fill="rgba(59, 130, 246, 0.05)" rx="12" />
                                            )}

                                            {/* Bar Shadows for Depth */}
                                            <rect x={x} y={350 - hPassed} width={barWidth} height={hPassed} fill="rgba(0,0,0,0.05)" transform="translate(2, 2)" rx={4} />

                                            <rect x={x} y={350 - hPassed} width={barWidth} height={hPassed} fill="url(#passedPill)" rx={(hFailed + hSkipped) === 0 ? 10 : 4} style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                            {hFailed > 0 && <rect x={x} y={350 - hPassed - hFailed} width={barWidth} height={hFailed} fill="url(#failedPill)" rx={(hSkipped) === 0 ? 4 : 2} stroke="white" strokeWidth="0.5" style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />}
                                            {hSkipped > 0 && <rect x={x} y={350 - hPassed - hFailed - hSkipped} width={barWidth} height={hSkipped} fill="url(#skippedPill)" rx={10} stroke="white" strokeWidth="0.5" style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />}

                                            <text
                                                x={x + barWidth / 2}
                                                y={380}
                                                textAnchor="middle"
                                                fill={hoveredRunIndex === idx ? "#0f172a" : "#94a3b8"}
                                                style={{ fontSize: '10px', fontWeight: 900, transition: 'all 0.2s', letterSpacing: '0.5px' }}
                                            >
                                                #{run.runId}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Area Fill under Trend Line */}
                                {showPassRate && trendPoints.length > 1 && (
                                    <path
                                        d={`M ${trendPoints[0].x},350 ` + trendPoints.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${trendPoints[trendPoints.length - 1].x},350 Z`}
                                        fill="url(#areaGradient)"
                                        style={{ transition: 'all 0.6s ease', pointerEvents: 'none' }}
                                    />
                                )}

                                {/* Trend Line with Glow */}
                                {showPassRate && trendPoints.length > 1 && (
                                    <g style={{ pointerEvents: 'none' }}>
                                        <path
                                            d={`M ${trendPoints[0].x},${trendPoints[0].y} ` + trendPoints.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')}
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            filter="url(#neonBlur)"
                                            style={{ transition: 'all 0.6s ease', opacity: 0.8 }}
                                        />
                                        {trendPoints.map((p, i) => (
                                            <circle
                                                key={`point-${i}`}
                                                cx={p.x}
                                                cy={p.y}
                                                r={hoveredRunIndex === i ? 8 : 5}
                                                fill="white"
                                                stroke="#3b82f6"
                                                strokeWidth="3"
                                                style={{ transition: 'all 0.25s ease', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
                                            />
                                        ))}
                                    </g>
                                )}

                                {/* Dedicated Hitboxes for Global Interactivity */}
                                {recentRuns.map((run, idx) => {
                                    const x = 60 + (idx * barGap);
                                    const hitboxWidth = idx === 0 || idx === recentRuns.length - 1 ? barGap * 0.8 : barGap;
                                    const hitboxX = idx === 0 ? 40 : x - (barGap / 2);

                                    return (
                                        <rect
                                            key={`hitbox-${run.runId}`}
                                            x={hitboxX}
                                            y="40"
                                            width={hitboxWidth}
                                            height="330"
                                            fill="transparent"
                                            onMouseEnter={() => setHoveredRunIndex(idx)}
                                            onMouseLeave={() => setHoveredRunIndex(null)}
                                            onClick={() => run.url ? window.open(run.url, '_blank') : console.warn('Building URL missing for Run', run.runId)}
                                            style={{ cursor: run.url ? 'pointer' : 'default' }}
                                        />
                                    );
                                })}

                                {hoveredRunIndex !== null && (() => {
                                    const run = recentRuns[hoveredRunIndex];
                                    const barX = 60 + (hoveredRunIndex * barGap);
                                    const total = run.passedCount + run.failedCount + run.skippedCount;
                                    const passRate = ((run.passedCount / Math.max(1, total)) * 100).toFixed(1);

                                    // Calculate top position of the bar to place tooltip immediately above it
                                    const barTop = 350 - (total / maxTotal) * 300;
                                    const tooltipHeight = 150;
                                    let tooltipY = barTop - tooltipHeight - 15;
                                    if (tooltipY < 10) tooltipY = 10; // Bounds check

                                    let tooltipX = barX + (barWidth / 2) - 100;
                                    if (tooltipX < 10) tooltipX = 10;
                                    if (tooltipX > 610) tooltipX = 610;

                                    return (
                                        <foreignObject x={tooltipX} y={tooltipY} width="200" height={tooltipHeight + 20} style={{ pointerEvents: 'none', transition: 'all 0.3s ease-out' }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    bgcolor: 'rgba(15, 23, 42, 0.95)',
                                                    backdropFilter: 'blur(16px)',
                                                    color: 'white',
                                                    borderRadius: '16px',
                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                                                    position: 'relative'
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                                                    <Typography sx={{ fontSize: '10px', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px' }}>Build Metrics</Typography>
                                                    <Typography sx={{ fontSize: '11px', fontWeight: 950, bgcolor: 'rgba(59, 130, 246, 0.2)', px: 0.8, py: 0.2, borderRadius: '4px', color: '#60a5fa' }}>#{run.runId}</Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                                    {[
                                                        { label: 'Passed', val: run.passedCount, color: '#10b981' },
                                                        { label: 'Failed', val: run.failedCount, color: '#ef4444' },
                                                        { label: 'Skipped', val: run.skippedCount || 0, color: '#94a3b8' }
                                                    ].map((row) => (
                                                        <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: row.color, boxShadow: `0 0 4px ${row.color}` }} />
                                                                <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{row.label}</Typography>
                                                            </Box>
                                                            <Typography sx={{ fontSize: '11px', fontWeight: 900 }}>{row.val}</Typography>
                                                        </Box>
                                                    ))}

                                                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                        <Typography sx={{ fontSize: '10px', fontWeight: 950, color: 'rgba(255,255,255,0.5)' }}>PASS RATE</Typography>
                                                        <Typography sx={{ fontWeight: 950, color: 'white', fontSize: '1.2rem', lineHeight: 1 }}>{passRate}<span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '8px' }}>%</span></Typography>
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

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 5, pb: 1 }}>
                {[
                    { grad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', l: 'Passed', color: '#10b981' },
                    { grad: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', l: 'Failed', color: '#f43f5e' },
                    { grad: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', l: 'Skipped', color: '#94a3b8' }
                ].map(leg => (
                    <Box key={leg.l} sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2,
                        px: 2,
                        py: 0.8,
                        borderRadius: '30px',
                        bgcolor: alpha(leg.color, 0.05),
                        border: `1px solid ${alpha(leg.color, 0.1)}`,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            bgcolor: alpha(leg.color, 0.1),
                            transform: 'translateY(-2px)'
                        }
                    }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: leg.grad, boxShadow: `0 0 10px ${alpha(leg.color, 0.4)}` }} />
                        <Typography variant="caption" sx={{ fontWeight: 900, color: leg.color, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.8px' }}>{leg.l}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};
