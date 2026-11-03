/*
 * FuLam school formation adapter.
 * Derived from imtonyjaa/ggemu-fishing-joy:
 * src/FishFormation.js (blob 521ea1f72e68f6132a382e020caefefe7c59d4c4)
 * src/Main.js buildMembersFromFormationConfig / buildSchoolSpawnQueue.
 * Copyright (c) 2026 大帅老猿 — MIT License (included in the enclosing HTML).
 *
 * Retains upstream formation grids, cell ordering, spacing and offscreen
 * spawn-offset algorithm. Adaptations: dependency-free Canvas coordinates,
 * responsive spacing, exact count, financial fish handled by the caller.
 * The circle formation and shared sinusoidal phase are new additions.
 * No GGEMU SDK, network, account, live capture or currency integration.
 */
(function () {
'use strict';
class FishFormation {
    static SCHOOL_FORMATIONS = {
        opening: [
            {
                key: 'opening-fish1',
                spacingScale: 1.2,
                verticalSpacingScale: 0.9,
                cooldownMin: 220,
                cooldownRange: 80,
                directionOffsetFactor: 0.14,
                angleJitterRange: 0.03,
                speedMultiplier: 1.02,
                animationSpeedMultiplier: 1.04,
                grid: [
                    [0, 0, 1, 0, 0],
                    [0, 1, 1, 1, 0],
                    [1, 1, 1, 1, 1],
                    [0, 1, 1, 1, 0],
                    [0, 0, 1, 0, 0]
                ]
            },
            {
                key: 'opening-fish2',
                spacingScale: 1,
                verticalSpacingScale: 0.52,
                cooldownMin: 220,
                cooldownRange: 80,
                directionOffsetFactor: 0.14,
                angleJitterRange: 0.03,
                speedMultiplier: 1,
                animationSpeedMultiplier: 1.02,
                grid: [
                    [0, 0, 2, 0, 0],
                    [0, 0, 0, 2, 0],
                    [0, 0, 0, 0, 2],
                    [0, 0, 0, 2, 0],
                    [0, 0, 2, 0, 0]
                ]
            }
        ],
        standard: [
            {
                key: 'standard-fish2',
                spacingScale: 1,
                verticalSpacingScale: 0.92,
                cooldownMin: 260,
                cooldownRange: 120,
                directionOffsetFactor: 0.16,
                angleJitterRange: 0.05,
                speedMultiplier: 1,
                animationSpeedMultiplier: 1,
                grid: [
                    [0, 0, 0, 0, 0],
                    [0, 0, 2, 0, 0],
                    [0, 2, 2, 2, 0],
                    [0, 0, 2, 0, 0],
                    [0, 0, 0, 0, 0]
                ]
            },
            {
                key: 'standard-fish3',
                spacingScale: 1.2,
                verticalSpacingScale: 0.64,
                cooldownMin: 260,
                cooldownRange: 120,
                directionOffsetFactor: 0.16,
                angleJitterRange: 0.05,
                speedMultiplier: 1,
                animationSpeedMultiplier: 1,
                grid: [
                    [0, 0, 0, 0, 0],
                    [0, 3, 3, 3, 0],
                    [0, 3, 3, 3, 0],
                    [0, 3, 3, 3, 0],
                    [0, 0, 0, 0, 0]
                ]
            }
        ],
        fast: [
            {
                key: 'fast-fish1',
                spacingScale: 1.2,
                verticalSpacingScale: 0.82,
                cooldownMin: 300,
                cooldownRange: 140,
                directionOffsetFactor: 0.24,
                angleJitterRange: 0.03,
                speedMultiplier: 1.35,
                animationSpeedMultiplier: 1.25,
                grid: [
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [1, 1, 1, 1, 3],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                ]
            },
            {
                key: 'fast-fish2',
                spacingScale: 1,
                verticalSpacingScale: 0.84,
                cooldownMin: 300,
                cooldownRange: 140,
                directionOffsetFactor: 0.22,
                angleJitterRange: 0.03,
                speedMultiplier: 1.28,
                animationSpeedMultiplier: 1.2,
                targetSpeed: 1.2,
                grid: [
                    [0, 0, 2, 0, 0],
                    [0, 2, 2, 2, 0],
                    [0, 2, 2, 2, 0],
                    [0, 2, 2, 2, 0],
                    [0, 0, 2, 0, 0]
                ]
            }
        ],
        escort: [
            {
                key: 'escort-fish5',
                spacingScale: 0.78,
                verticalSpacingScale: 0.46,
                cooldownMin: 340,
                cooldownRange: 150,
                directionOffsetFactor: 0.12,
                angleJitterRange: 0.025,
                animationSpeedMultiplier: 1,
                targetSpeed: 1.2,
                grid: [
                    [0, 0, 0, 0, 0],
                    [0, 0, 1, 0, 0],
                    [1, 1, 8, 1, 1],
                    [0, 0, 1, 0, 0],
                    [0, 0, 0, 0, 0]
                ]
            }
        ]
    };
}




function gridMembers(config, width, height) {
    const grid = Array.isArray(config.grid) ? config.grid : [];
    if (!grid.length) return [];
    const rowCount = grid.length;
    const colCount = Math.max(...grid.map(row => Array.isArray(row) ? row.length : 0), 0);
    const centerRow = Math.floor(rowCount / 2);
    const maxColIndex = Math.max(0, colCount - 1);
    const cells = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const row = Array.isArray(grid[rowIndex]) ? grid[rowIndex] : [];
        for (let colIndex = 0; colIndex < colCount; colIndex++) {
            const typeIndex = Number(row[colIndex] || 0);
            if (!typeIndex) continue;
            cells.push({ rowIndex, colIndex, typeIndex });
        }
    }
    // Same grid-to-offset pipeline as upstream, scaled to portrait canvases.
    const maxFishSize = Math.max(34, Math.min(58, width * 0.08));
    const spacingScale = typeof config.spacingScale === 'number' ? config.spacingScale : 0.8;
    const verticalSpacingScale = typeof config.verticalSpacingScale === 'number' ? config.verticalSpacingScale : 0.9;
    const spacingX = Math.max(32, maxFishSize * spacingScale);
    const spacingY = Math.min(Math.max(26, maxFishSize * verticalSpacingScale), Math.max(18, (height - 170) / Math.max(1, rowCount)));
    cells.sort((leftCell, rightCell) => {
        if (leftCell.colIndex !== rightCell.colIndex) return rightCell.colIndex - leftCell.colIndex;
        return Math.abs(leftCell.rowIndex - centerRow) - Math.abs(rightCell.rowIndex - centerRow);
    });
    return cells.map(cell => ({
        offsetX: (maxColIndex - cell.colIndex) * spacingX,
        offsetY: (cell.rowIndex - centerRow) * spacingY,
        sourceType: cell.typeIndex,
        speedMultiplier: config.speedMultiplier || 1
    }));
}
function create(kind, count, width, height, direction = 1, random = Math.random) {
    width = Math.max(200, Number(width) || 800);
    height = Math.max(220, Number(height) || 600);
    count = Math.max(1, Math.min(36, Math.floor(Number(count) || 5)));
    direction = direction < 0 ? -1 : 1;
    const formations = FishFormation.SCHOOL_FORMATIONS;
    let members;
    if (kind === 'circle') {
        const radius = Math.min(95, width * 0.16, Math.max(35, (height - 180) * 0.25));
        members = Array.from({ length: count }, (_, index) => {
            const a = index / count * Math.PI * 2;
            return { offsetX: radius * (1 - Math.cos(a)), offsetY: Math.sin(a) * radius, speedMultiplier: 1 };
        }).sort((a, b) => a.offsetX - b.offsetX);
    } else {
        const config = kind === 'v' ? formations.opening[1]
            : kind === 'wave' ? formations.opening[0]
            : kind === 'escort' ? formations.escort[0]
            : kind === 'block' ? formations.standard[1]
            : formations.fast[0];
        const original = gridMembers(config, width, height);
        const span = Math.max(...original.map(m => m.offsetX)) + Math.max(40, width * 0.055);
        members = Array.from({ length: count }, (_, index) => {
            const source = original[index % original.length];
            return { ...source, offsetX: source.offsetX + Math.floor(index / original.length) * span };
        });
    }
    const topLimit = 62;
    const bottomLimit = height - 125;
    const minYOffset = Math.min(...members.map(entry => entry.offsetY - 22));
    const maxYOffset = Math.max(...members.map(entry => entry.offsetY + 22));
    const baseY = height * (0.24 + random() * 0.38);
    const clampedBaseY = Math.max(topLimit - minYOffset, Math.min(bottomLimit - maxYOffset, baseY));
    const sharedPhase = random() * Math.PI * 2;
    return members.map((entry, index) => {
        const spawnOffset = 70 + Math.abs(entry.offsetX);
        return {
            x: direction > 0 ? -spawnOffset : width + spawnOffset,
            y: clampedBaseY + entry.offsetY,
            offsetY: entry.offsetY,
            phase: sharedPhase + (kind === 'wave' ? index * 0.26 : 0),
            speedMultiplier: entry.speedMultiplier || 1
        };
    });
}
window.FuLamFormations = Object.freeze({ create });
})();
