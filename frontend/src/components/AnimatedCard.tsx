import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface AnimatedCardProps {
    delay?: number;
    variant?: 'default' | 'glass' | 'clay';
    hoverEffect?: boolean;
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export const AnimatedCard = ({
    delay = 0,
    variant = 'default',
    hoverEffect = true,
    children,
    className,
    style
}: AnimatedCardProps) => {
    const getVariantStyles = (): React.CSSProperties => {
        switch (variant) {
            case 'glass':
                return {
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                };
            case 'clay':
                return {
                    background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
                    boxShadow: '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
                };
            default:
                return {};
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.4, 0, 0.2, 1]
            }}
            whileHover={hoverEffect ? {
                y: -6,
                scale: 1.02,
                transition: {
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                }
            } : undefined}
            className={className}
            style={{
                ...getVariantStyles(),
                ...style
            }}
        >
            {children}
        </motion.div>
    );
};
