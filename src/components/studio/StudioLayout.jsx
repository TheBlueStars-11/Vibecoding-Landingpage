import React, { useState, useEffect } from 'react';
import styles from './StudioLayout.module.css';
import { elsRepository } from '../../services/elsRepository.js';
import { PROJECT_STATUS } from '../../domain/elsSchema.js';
import { Lozenge } from '../ui/Lozenge.jsx';
import { Toast } from '../ui/Toast.jsx';
import {
  ArrowLeftIcon,
  InfoIcon,
  FormIcon,
  SparklesIcon,
  UsersIcon,
  ExternalLinkIcon,
  CodeIcon,
  CpuIcon,
  PlusIcon,
  QrCodeIcon,
} from '../ui/Icons.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { WorkspaceInfo } from './WorkspaceInfo.jsx';
import { WorkspaceForm } from './WorkspaceForm.jsx';
import { WorkspaceLanding } from './WorkspaceLanding.jsx';
import { WorkspaceRegistrations } from './WorkspaceRegistrations.jsx';
import { DevModeWorkspace } from './devmode/DevModeWorkspace.jsx';
import { WorkspaceAiControl } from './WorkspaceAiControl.jsx';
import { QrCheckInModal } from './QrCheckInModal.jsx';

export function StudioLayout({ projectId, activeWorkspace = 'info', onNavigate }) {
  const [project, setProject] = useState(() => elsRepository.getProjectById(projectId));
  const [regCount, setRegCount] = useState(() => elsRepository.getRegistrationCount(projectId));
  const [saveStatus, setSaveStatus] = useState({ state: 'saved', time: 'vừa xong' });
  const [toast, setToast] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  const handleConfirmReset = () => {
    setIsResetModalOpen(false);
    const newPrj = elsRepository.createProject({
      name: 'Sự kiện mới 2026',
    });
    elsRepository.setLastOpenProjectId(newPrj.id);
    onNavigate?.(`p/${newPrj.id}/info`);
  };

  // Tải lại dự án và lắng nghe realtime
  useEffect(() => {
    const unsub = elsRepository.subscribe((event) => {
      if (event.projectId === projectId || (event.key && event.key.includes(projectId))) {
        setProject(elsRepository.getProjectById(projectId));
        setRegCount(elsRepository.getRegistrationCount(projectId));
      }
    });

    return () => unsub();
  }, [projectId]);

  // Nếu không tìm thấy dự án
  if (!project) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundCard}>
          <h2>Không tìm thấy dự án</h2>
          <p>Dự án này không tồn tại hoặc đã bị xóa khỏi bộ nhớ trình duyệt.</p>
          <button
            type="button"
            className={styles.btnBackHome}
            onClick={() => onNavigate('')}
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const handleSaveStatusChange = (state, time) => {
    setSaveStatus({ state, time: time || saveStatus.time });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleUpdateProject = (updated) => {
    setProject(updated);
  };

  const isMock = project.ai?.source === 'mock' || !project.ai?.source;

  return (
    <div className={styles.studioContainer}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ============================================================ */}
      {/* 1. APP BAR CỐ ĐỊNH PHÍA TRÊN                                 */}
      {/* ============================================================ */}
      <header className={styles.appBar}>
        <div className={styles.appBarLeft}>
          <button
            type="button"
            className={styles.btnBack}
            onClick={() => onNavigate('')}
            title="Quay lại danh sách dự án"
            aria-label="Quay lại danh sách dự án"
          >
            <ArrowLeftIcon size={18} />
            <span className={styles.btnBackLabel}>Dự án</span>
          </button>

          <div className={styles.projectInfoMeta}>
            <h1 className={styles.appBarTitle} title={project.name}>
              {project.name}
            </h1>
            <Lozenge status={project.status} />
          </div>
        </div>

        <div className={styles.appBarRight}>
          {/* Nút Quét QR Check-in vé sự kiện (Thay thế dòng Đã lưu) */}
          <button
            type="button"
            className={styles.btnQrScanAppBar}
            onClick={() => setIsQrScannerOpen(true)}
            title="Mở máy quét QR check-in vé người tham dự"
          >
            <QrCodeIcon size={15} />
            <span className={styles.btnQrScanLabel}>Quét QR Check-in</span>
          </button>

          {/* Nút Tạo trang mới (Tính năng #5 - Đề 08) */}
          <button
            type="button"
            className={styles.btnNewPage}
            onClick={() => setIsResetModalOpen(true)}
            title="Khởi tạo landing page sự kiện mới (Đặt lại trạng thái)"
          >
            <PlusIcon size={14} />
            <span className={styles.btnNewPageLabel}>Tạo trang mới</span>
          </button>

          {/* Nút Xem trang công khai nếu đã Published */}
          {project.status === PROJECT_STATUS.PUBLISHED && (
            <a
              href={`#/e/${project.slug}`}
              target="_blank"
              rel="noreferrer"
              className={styles.btnViewPublic}
              title="Mở landing page công khai"
            >
              <ExternalLinkIcon size={15} />
              <span className={styles.btnPublicLabel}>Xem trang</span>
            </a>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. THÂN ỨNG DỤNG: SIDEBAR (DESKTOP) + NỘI DUNG WORKSPACE      */}
      {/* ============================================================ */}
      <div className={styles.studioBody}>
        {/* Navigation Rail / Sidebar (Desktop) */}
        <aside className={styles.sidebarNav} aria-label="Điều hướng không gian làm việc">
          <div className={styles.navGroup}>
            <button
              type="button"
              className={`${styles.navItem} ${activeWorkspace === 'info' ? styles.activeNavItem : ''}`}
              onClick={() => onNavigate(`p/${project.id}/info`)}
              aria-current={activeWorkspace === 'info' ? 'page' : undefined}
            >
              <InfoIcon size={18} className={styles.navIcon} />
              <span className={styles.navLabel}>1. Thông tin dự án</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeWorkspace === 'form' ? styles.activeNavItem : ''}`}
              onClick={() => onNavigate(`p/${project.id}/form`)}
              aria-current={activeWorkspace === 'form' ? 'page' : undefined}
            >
              <FormIcon size={18} className={styles.navIcon} />
              <span className={styles.navLabel}>2. Form đăng ký</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeWorkspace === 'landing' ? styles.activeNavItem : ''}`}
              onClick={() => onNavigate(`p/${project.id}/landing`)}
              aria-current={activeWorkspace === 'landing' ? 'page' : undefined}
            >
              <SparklesIcon size={18} className={styles.navIcon} />
              <span className={styles.navLabel}>3. AI Landing & Preview</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeWorkspace === 'registrations' ? styles.activeNavItem : ''}`}
              onClick={() => onNavigate(`p/${project.id}/registrations`)}
              aria-current={activeWorkspace === 'registrations' ? 'page' : undefined}
            >
              <UsersIcon size={18} className={styles.navIcon} />
              <span className={styles.navLabel}>4. Đơn đăng ký</span>
              {regCount > 0 && <span className={styles.navBadge}>{regCount}</span>}
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${styles.navItemDev} ${activeWorkspace === 'devmode' ? styles.activeNavItemDev : ''}`}
              onClick={() => onNavigate(`p/${project.id}/devmode`)}
              aria-current={activeWorkspace === 'devmode' ? 'page' : undefined}
            >
              <CodeIcon size={18} className={styles.navIcon} />
              <span className={styles.navLabel}>5. Module Dev Mode</span>
              <span className={styles.devBadge}>DEV</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${styles.navItemAi} ${activeWorkspace === 'ai' || activeWorkspace === 'ai-control' ? styles.activeNavItemAi : ''}`}
              onClick={() => onNavigate(`p/${project.id}/ai`)}
              aria-current={activeWorkspace === 'ai' || activeWorkspace === 'ai-control' ? 'page' : undefined}
            >
              <CpuIcon size={18} className={styles.navIcon} />
              <span className={styles.navLabel}>6. Kiểm soát AI & API</span>
              <span className={styles.aiBadge}>API</span>
            </button>
          </div>

          {/* Chân sidebar: Nhãn bắt buộc theo quy chế FDD mục 6.3.7 */}
          <div className={styles.sidebarFooter}>
            <div className={styles.mockDisclaimer}>
              <span className={styles.mockDot} />
              {isMock ? (
                <span>Bản demo vòng loại - Dữ liệu mô phỏng AI</span>
              ) : (
                <span>Kết nối AI (Gemini 2.5)</span>
              )}
            </div>
          </div>
        </aside>

        {/* Vùng nội dung Workspace */}
        <main className={`${styles.mainViewport} ${activeWorkspace === 'devmode' ? styles.mainViewportDev : ''} ${(activeWorkspace === 'ai' || activeWorkspace === 'ai-control') ? styles.mainViewportAi : ''}`} id="main-content">
          <div key={activeWorkspace} className={styles.workspaceTransition}>
            {activeWorkspace === 'info' && (
              <WorkspaceInfo
                project={project}
                onUpdateProject={handleUpdateProject}
                onSaveStatusChange={handleSaveStatusChange}
                onShowToast={showToast}
              />
            )}

            {activeWorkspace === 'form' && (
              <WorkspaceForm
                project={project}
                onUpdateProject={handleUpdateProject}
                onSaveStatusChange={handleSaveStatusChange}
                onShowToast={showToast}
              />
            )}

            {activeWorkspace === 'landing' && (
              <WorkspaceLanding
                project={project}
                onUpdateProject={handleUpdateProject}
                onSaveStatusChange={handleSaveStatusChange}
                onShowToast={showToast}
                onNavigate={onNavigate}
              />
            )}

            {activeWorkspace === 'registrations' && (
              <WorkspaceRegistrations
                project={project}
                onShowToast={showToast}
                onOpenQrScanner={() => setIsQrScannerOpen(true)}
              />
            )}

            {activeWorkspace === 'devmode' && (
              <DevModeWorkspace
                project={project}
                onUpdateProject={handleUpdateProject}
                onShowToast={showToast}
                onExitDevMode={() => onNavigate(`p/${project.id}/landing`)}
              />
            )}

            {(activeWorkspace === 'ai' || activeWorkspace === 'ai-control') && (
              <WorkspaceAiControl
                project={project}
                onShowToast={showToast}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </main>
      </div>

      {/* ============================================================ */}
      {/* 3. TAB BAR CỐ ĐỊNH PHÍA DƯỚI (MOBILE < 768px)                */}
      {/* ============================================================ */}
      <nav className={styles.mobileTabBar} aria-label="Thanh điều hướng di động">
        <button
          type="button"
          className={`${styles.tabBarItem} ${activeWorkspace === 'info' ? styles.activeTabItem : ''}`}
          onClick={() => onNavigate(`p/${project.id}/info`)}
          aria-current={activeWorkspace === 'info' ? 'page' : undefined}
        >
          <InfoIcon size={20} />
          <span>Thông tin</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBarItem} ${activeWorkspace === 'form' ? styles.activeTabItem : ''}`}
          onClick={() => onNavigate(`p/${project.id}/form`)}
          aria-current={activeWorkspace === 'form' ? 'page' : undefined}
        >
          <FormIcon size={20} />
          <span>Form</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBarItem} ${activeWorkspace === 'landing' ? styles.activeTabItem : ''}`}
          onClick={() => onNavigate(`p/${project.id}/landing`)}
          aria-current={activeWorkspace === 'landing' ? 'page' : undefined}
        >
          <SparklesIcon size={20} />
          <span>Landing</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBarItem} ${activeWorkspace === 'registrations' ? styles.activeTabItem : ''}`}
          onClick={() => onNavigate(`p/${project.id}/registrations`)}
          aria-current={activeWorkspace === 'registrations' ? 'page' : undefined}
        >
          <div className={styles.tabIconBadgeWrapper}>
            <UsersIcon size={20} />
            {regCount > 0 && <span className={styles.mobileBadge}>{regCount}</span>}
          </div>
          <span>Đơn ({regCount})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBarItem} ${activeWorkspace === 'devmode' ? styles.activeTabItem : ''}`}
          onClick={() => onNavigate(`p/${project.id}/devmode`)}
          aria-current={activeWorkspace === 'devmode' ? 'page' : undefined}
        >
          <CodeIcon size={20} />
          <span>Dev Mode</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBarItem} ${activeWorkspace === 'ai' || activeWorkspace === 'ai-control' ? styles.activeTabItem : ''}`}
          onClick={() => onNavigate(`p/${project.id}/ai`)}
          aria-current={activeWorkspace === 'ai' || activeWorkspace === 'ai-control' ? 'page' : undefined}
        >
          <CpuIcon size={20} />
          <span>Kiểm soát AI</span>
        </button>
      </nav>

      {/* Dialog Xác nhận Tạo trang mới (Tính năng #5 - Đề 08) */}
      <ConfirmDialog
        isOpen={isResetModalOpen}
        title="Tạo Landing Page mới?"
        message="Hành động này sẽ khởi tạo một sự kiện mới và đưa bạn về màn hình nhập thông tin (Golden Path). Dự án hiện tại vẫn được bảo toàn trong danh sách dự án. Bạn có muốn tiếp tục?"
        confirmLabel="Tạo trang mới"
        cancelLabel="Hủy"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />

      {/* Modal Quét QR Check-in vé sự kiện */}
      <QrCheckInModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        project={project}
        onShowToast={showToast}
      />
    </div>
  );
}
