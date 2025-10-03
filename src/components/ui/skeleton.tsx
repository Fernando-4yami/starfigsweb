import type React from "react"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const baseClasses = "animate-pulse rounded-md bg-gray-200"
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  return <div className={combinedClasses} {...props} />
}

export { Skeleton }
