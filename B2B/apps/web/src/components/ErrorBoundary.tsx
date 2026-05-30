import React from "react";

type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in UI:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-xl w-full text-center rounded-xl border border-red-100 bg-white p-8">
            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-600">An unexpected error occurred. Please reload the page or contact support if the problem persists.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => window.location.reload()} className="bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium px-4 py-2">Reload</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
