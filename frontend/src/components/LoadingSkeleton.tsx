type LoadingSkeletonProps = {
  className?: string;
};

const LoadingSkeleton = ({ className = "" }: LoadingSkeletonProps) => {
  return <div className={`animate-pulse rounded-xl bg-slate-700/70 ${className}`.trim()} />;
};

export default LoadingSkeleton;
