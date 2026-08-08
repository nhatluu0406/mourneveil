import { Component, type ErrorInfo, type ReactNode } from 'react'

interface RenderErrorBoundaryProps {
  children: ReactNode
}

interface RenderErrorBoundaryState {
  failed: boolean
}

export class RenderErrorBoundary extends Component<
  RenderErrorBoundaryProps,
  RenderErrorBoundaryState
> {
  public state: RenderErrorBoundaryState = { failed: false }

  public static getDerivedStateFromError(): RenderErrorBoundaryState {
    return { failed: true }
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('3D renderer initialization failed.', error, info)
  }

  public render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="render-fallback" role="alert">
          <h2>3D renderer unavailable</h2>
          <p>
            Mourneveil could not initialize WebGL. Check browser graphics support
            and reload the page.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
