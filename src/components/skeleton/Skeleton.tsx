import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    lines?: number;
    animation?: 'pulse' | 'wave' | 'none';
    className?: string;
    style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    lines = 1,
    animation = 'pulse',
    className = '',
    style
}) => {
    const skeletonElement = (
        <div
            className={`${styles.skeleton} ${styles[variant]} ${styles[animation]} ${className}`}
            style={{
                width: width || '100%',
                height: height || (variant === 'text' ? '1em' : '40px'),
                ...style
            }}
        >
            {variant === 'text' && lines > 1 && (
                <div className={styles.textLines}>
                    {Array.from({ length: lines }, (_, index) => (
                        <div
                            key={index}
                            className={styles.textLine}
                            style={{
                                width: index === lines - 1 ? '60%' : '100%'
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    return skeletonElement;
};

export default Skeleton;