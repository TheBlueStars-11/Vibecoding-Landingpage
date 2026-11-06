import { Component } from 'react';
import { ShieldIcon, RefreshCwIcon, TrashIcon } from './Icons.jsx';
import styles from './ErrorBoundary.module.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Bắt được lỗi giao diện:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    try {
      localStorage.removeItem('epb:v1:active');
      localStorage.removeItem('epb:v1:draft');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer} role="alert">
          <div className={styles.errorCard}>
            <div className={styles.icon}><ShieldIcon size={38} /></div>
            <h1 className={styles.title}>Đã xảy ra sự cố không mong muốn</h1>
            <p className={styles.description}>
              Hệ thống đã tự động bảo vệ dữ liệu của bạn để tránh mất mát. Bạn có thể tải lại trang hoặc khôi phục về trạng thái sạch ban đầu.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.reloadBtn}
                onClick={this.handleReload}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <RefreshCwIcon size={16} />
                <span>Tải lại trang</span>
              </button>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={this.handleResetStorage}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <TrashIcon size={16} />
                <span>Tạo trang mới sạch</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

