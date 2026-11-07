import React from 'react';

/**
 * @file src/components/ui/AppErrorBoundary.jsx
 * Component bắt lỗi toàn cục cho ứng dụng React (Error Boundary).
 * Đảm bảo giao diện không bao giờ bị trắng màn hình (blank screen) khi có lỗi render hoặc state bất thường.
 */
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[AppErrorBoundary] Đã bắt được ngoại lệ:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      // Dọn dẹp cờ tạm thời mà không làm mất dữ liệu đăng ký
      window.sessionStorage?.clear();
      window.location.href = window.location.pathname;
    } catch {
      window.location.reload();
    }
  };

  handleCopyError = () => {
    const errorDetails = `Lỗi: ${this.state.error?.message || 'Không rõ'}\nStack: ${this.state.error?.stack || ''}\nComponent: ${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard?.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
          color: '#f4f4f5',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          padding: '24px',
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: 'rgba(24, 24, 27, 0.95)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(244, 63, 94, 0.1)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '28px',
            }}>
              ⚠️
            </div>

            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 10px 0',
            }}>
              Đã phát sinh sự cố giao diện
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#a1a1aa',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}>
              Hệ thống đã kích hoạt chế độ tự bảo vệ để ngăn chặn mất mát dữ liệu. Dữ liệu sự kiện của bạn trong bộ nhớ cục bộ vẫn được bảo toàn an toàn.
            </p>

            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              textAlign: 'left',
              fontSize: '13px',
              color: '#fb7185',
              fontFamily: 'monospace',
              maxHeight: '120px',
              overflowY: 'auto',
              wordBreak: 'break-all',
            }}>
              {this.state.error?.message || 'Lỗi không xác định'}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #e11d48, #be123c)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                🔄 Tải lại trang
              </button>

              <button
                onClick={this.handleResetState}
                style={{
                  background: '#27272a',
                  color: '#f4f4f5',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                🛡️ Về trang chủ an toàn
              </button>

              <button
                onClick={this.handleCopyError}
                style={{
                  background: 'transparent',
                  color: '#a1a1aa',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {this.state.copied ? '✓ Đã sao chép' : '📋 Sao chép lỗi'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
