import React, { ReactNode, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

/**
 * SwipeableItem - A reusable component that adds swipe gestures to any content
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - The content to be rendered inside the swipeable container
 * @param {ReactNode} props.leftAction - Component to show when swiping right (from left to right)
 * @param {ReactNode} props.rightAction - Component to show when swiping left (from right to left)
 * @param {Function} props.onLeftSwipe - Callback function when user swipes left past threshold
 * @param {Function} props.onRightSwipe - Callback function when user swipes right past threshold
 * @param {number} props.threshold - Distance in pixels to trigger action (default: 100)
 * @param {Object} props.style - Additional styles for the main container
 * @param {Object} props.contentStyle - Additional styles for the content container
 * @returns {JSX.Element}
 */
const SwipeableItem = ({
    children,
    leftAction,
    rightAction,
    onLeftSwipe,
    onRightSwipe,
    threshold = 100,
    style = {},
    contentStyle = {},
}) => {
    const itemRef = useRef(null);

    // Spring for the content movement and animation
    const [{ x }, api] = useSpring(() => ({
        x: 0,
        config: { tension: 400, friction: 30 }
    }));

    // Gesture handler for drag interactions
    const bind = useDrag(
        ({ active, movement: [mx], direction: [xDir], cancel }) => {
            // Current swipe direction (positive = right, negative = left)
            const isRightSwipe = xDir > 0;
            const isLeftSwipe = xDir < 0;

            // If swipe exceeds threshold and we're not actively dragging, trigger callback
            if (!active && Math.abs(mx) > threshold) {
                if (isLeftSwipe && onLeftSwipe) {
                    onLeftSwipe();
                    // Reset position after callback
                    api.start({ x: 0 });
                } else if (isRightSwipe && onRightSwipe) {
                    onRightSwipe();
                    // Reset position after callback
                    api.start({ x: 0 });
                }
            } else {
                // Just track the movement or reset when released
                api.start({
                    x: active ? mx : 0,
                    immediate: active
                });
            }
        },
        {
            // Configure drag behavior
            axis: 'x',
            filterTaps: true,
            // Get drag bounds from the element's width
            bounds: { left: -200, right: 200 },
            rubberband: true,
        }
    );

    return (
        <div
            className="swipeable-container relative overflow-hidden"
            style={{
                touchAction: 'pan-y',
                position: 'relative',
                ...style
            }}
            ref={itemRef}
        >
            {/* Left action (revealed when swiping right) */}
            {leftAction && (
                <div
                    className="absolute left-0 top-0 bottom-0 flex items-center justify-start"
                    style={{
                        width: threshold,
                        paddingLeft: '8px',
                    }}
                >
                    {leftAction}
                </div>
            )}

            {/* Right action (revealed when swiping left) */}
            {rightAction && (
                <div
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-end"
                    style={{
                        width: threshold,
                        paddingRight: '8px',
                    }}
                >
                    {rightAction}
                </div>
            )}

            {/* Main content */}
            <animated.div
                {...bind()}
                style={{
                    x,
                    touchAction: 'pan-y',
                    zIndex: 1,
                    position: 'relative',
                    background: 'white',
                    width: '100%',
                    ...contentStyle
                }}
                className="swipeable-content"
            >
                {children}
            </animated.div>
        </div>
    );
};

export default SwipeableItem;