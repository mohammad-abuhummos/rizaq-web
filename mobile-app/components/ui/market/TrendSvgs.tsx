import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Upward trend SVGs (green)
export const UpTrend1 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 26 L20 22 L38 24 L56 14 L78 4"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

export const UpTrend2 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 25 L18 21 L32 24 L48 16 L62 11 L78 5"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

export const UpTrend3 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 24 L24 19 L40 22 L60 10 L78 3"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

export const UpTrend4 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 27 L14 23 L28 26 L44 18 L58 13 L70 8 L78 6"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

export const UpTrend5 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 25 L22 20 L38 23 L52 15 L66 10 L78 4"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

// Downward trend SVGs (red)
export const DownTrend1 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 4 L20 8 L38 6 L56 16 L78 26"
            stroke="#ef4444"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

export const DownTrend2 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 5 L18 9 L32 6 L48 14 L62 19 L78 25"
            stroke="#ef4444"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

export const DownTrend3 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 6 L24 11 L40 8 L60 20 L78 27"
            stroke="#ef4444"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

export const DownTrend4 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 3 L14 7 L28 4 L44 12 L58 17 L70 22 L78 24"
            stroke="#ef4444"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

export const DownTrend5 = () => (
    <Svg width="80" height="30" viewBox="0 0 80 30" fill="none">
        <Path
            d="M2 5 L22 10 L38 7 L52 15 L66 20 L78 26"
            stroke="#ef4444"
            strokeWidth="2"
            fill="none"
        />
    </Svg>
);

// Helper to get random trend SVG based on direction
export const getRandomTrendSvg = (isPositive: boolean) => {
    const randomIndex = Math.floor(Math.random() * 5);

    if (isPositive) {
        const upTrends = [UpTrend1, UpTrend2, UpTrend3, UpTrend4, UpTrend5];
        return upTrends[randomIndex];
    } else {
        const downTrends = [DownTrend1, DownTrend2, DownTrend3, DownTrend4, DownTrend5];
        return downTrends[randomIndex];
    }
};

