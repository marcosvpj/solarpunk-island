/**
 * ResponsiveUtils - Responsive design utilities
 * 
 * Provides mobile detection, scaling calculations, and responsive sizing
 * utilities for creating adaptive UI across different screen sizes.
 */

/**
 * Detect if the current device is mobile
 * @returns {boolean} True if mobile device
 */
export function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get responsive scale factor based on screen width
 * @returns {number} Scale factor (0.7 for small phones, 0.8 for tablets, 1.0 for desktop)
 */
export function getResponsiveScale() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) return 0.7; // Small phones
    if (screenWidth <= 768) return 0.8; // Tablets and larger phones
    return 1.0; // Desktop
}

/**
 * Calculate responsive font size
 * @param {number} baseFontSize - Base font size in pixels
 * @returns {number} Responsive font size
 */
export function getResponsiveFontSize(baseFontSize) {
    return Math.floor(baseFontSize * getResponsiveScale());
}

/**
 * Calculate responsive size for general UI elements
 * @param {number} baseSize - Base size in pixels
 * @returns {number} Responsive size
 */
export function getResponsiveSize(baseSize) {
    return Math.floor(baseSize * getResponsiveScale());
}

/**
 * Get current device and responsive information
 * @returns {Object} Device information
 */
export function getDeviceInfo() {
    return {
        isMobile: isMobileDevice(),
        responsiveScale: getResponsiveScale(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
    };
}

/**
 * Create responsive breakpoint checker
 * @returns {Object} Breakpoint utilities
 */
export function createBreakpoints() {
    const screenWidth = window.innerWidth;
    
    return {
        isSmallPhone: screenWidth <= 480,
        isPhone: screenWidth <= 768,
        isTablet: screenWidth > 768 && screenWidth <= 1024,
        isDesktop: screenWidth > 1024,
        isMobile: screenWidth <= 768
    };
}

/**
 * Calculate UI positioning based on screen size
 * @param {Object} options - Positioning options
 * @returns {Object} Calculated positions
 */
export function calculateResponsivePositions(options = {}) {
    const { 
        centerX = window.innerWidth / 2,
        centerY = window.innerHeight / 2,
        marginTop = 20,
        marginBottom = 120,
        marginSide = 20
    } = options;
    
    const responsive = getResponsiveScale();
    
    return {
        center: { x: centerX, y: centerY },
        topLeft: { x: marginSide * responsive, y: marginTop * responsive },
        topRight: { x: window.innerWidth - (marginSide * responsive), y: marginTop * responsive },
        bottomLeft: { x: marginSide * responsive, y: window.innerHeight - (marginBottom * responsive) },
        bottomRight: { x: window.innerWidth - (marginSide * responsive), y: window.innerHeight - (marginBottom * responsive) },
        bottomCenter: { x: centerX, y: window.innerHeight - (marginBottom * responsive) }
    };
}

export default {
    isMobileDevice,
    getResponsiveScale,
    getResponsiveFontSize,
    getResponsiveSize,
    getDeviceInfo,
    createBreakpoints,
    calculateResponsivePositions
};