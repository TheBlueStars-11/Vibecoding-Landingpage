import React, { useState, useEffect, useMemo } from 'react';
import styles from './HomeDashboard.module.css';
import { elsRepository } from '../../services/elsRepository.js';
import { createProject, PROJECT_STATUS } from '../../domain/elsSchema.js';
import { validateProjectName } from '../../domain/validators.js';
import { Lozenge } from '../ui/Lozenge.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { Toast } from '../ui/Toast.jsx';
import {
  SparklesIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  CalendarIcon,
  UsersIcon,
  ClockIcon,
  ExternalLinkIcon,
} from '../ui/Icons.jsx';

/**
 * Lấy lời chào theo thời điểm hiện tại (múi giờ UTC+7)
 */
function getGreetingUtc7() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const vnTime = new Date(utc + 7 * 3600000);
  const hour = vnTime.getHours();

  if (hour >= 5 && hour < 12) {
    return 'Chào buổi sáng!';
  } else if (hour >= 12 && hour < 18) {
    return 'Chào buổi chiều!';
  }
  return 'Chào buổi tối!';
}

/**
 * Định dạng ngày giờ hiển thị
 */
function formatDateTime(isoString) {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function HomeDashboard({ onNavigate }) {
  const [projects, setProjects] = useState(() => elsRepository.getProjects());
  const [regCounts, setRegCounts] = useState(() => {
    const list = elsRepository.getProjects();
    const counts = {};
    for (const p of list) {
      counts[p.id] = elsRepository.getRegistrationCount(p.id);
    }
    return counts;
  });
  const [greeting] = useState(getGreetingUtc7);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Lọc và tìm kiếm
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'draft' | 'published'
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog Tạo dự án mới
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Dialog Đổi tên dự án
  const [editingProject, setEditingProject] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState(null);

  // Dialog Xác nhận Xóa dự án
  const [deletingProject, setDeletingProject] = useState(null);

  // Tải danh sách dự án và lượt đăng ký
  const loadData = () => {
    const list = elsRepository.getProjects();
    setProjects(list);

    const counts = {};
    for (const p of list) {
      counts[p.id] = elsRepository.getRegistrationCount(p.id);
    }
    setRegCounts(counts);
  };

  useEffect(() => {
    // Lắng nghe thay đổi kho dữ liệu realtime
    const unsubscribe = elsRepository.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Tổng số lượt đăng ký toàn bộ dự án
  const totalRegistrations = useMemo(() => {
    return Object.values(regCounts).reduce((acc, c) => acc + c, 0);
  }, [regCounts]);

  // Lọc và sắp xếp theo updatedAt giảm dần
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.event?.eventName || '').toLowerCase().includes(q)
      );
    }

    // Sắp xếp updatedAt giảm dần
    result.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    return result;
  }, [projects, filterStatus, searchQuery]);

  // Xử lý tạo dự án mới
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (isCreating) return;

    const validation = validateProjectName(newProjectName);
    if (!validation.isValid) {
      setCreateError(validation.error);
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const project = createProject({ name: validation.cleanName });
      elsRepository.saveProject(project);
      setIsCreateOpen(false);
      setNewProjectName('');
      onNavigate(`p/${project.id}/info`);
    } catch (err) {
      setCreateError(err.message || 'Lỗi khi tạo dự án.');
      setIsCreating(false);
    }
  };

  // Xử lý đổi tên dự án
  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (!editingProject) return;

    const validation = validateProjectName(renameValue);
    if (!validation.isValid) {
      setRenameError(validation.error);
      return;
    }

    try {
      const updated = {
        ...editingProject,
        name: validation.cleanName,
        event: {
          ...editingProject.event,
          eventName: editingProject.event?.eventName || validation.cleanName,
        },
      };
      elsRepository.saveProject(updated);
      setEditingProject(null);
      setRenameValue('');
      setToastMessage('Đã cập nhật tên dự án thành công.');
      setToastType('success');
      loadData();
    } catch (err) {
      setRenameError(err.message || 'Không thể lưu tên mới.');
    }
  };

  // Xử lý xóa dự án
  const handleConfirmDelete = () => {
    if (!deletingProject) return;
    try {
      elsRepository.deleteProject(deletingProject.id);
      setDeletingProject(null);
      setToastMessage(`Đã xóa vĩnh viễn dự án "${deletingProject.name}".`);
      setToastType('success');
      loadData();
    } catch (err) {
      setToastMessage(`Lỗi xóa dự án: ${err.message}`);
      setToastType('error');
    }
  };

  return (
    <div className={styles.container}>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* ============================================================== */}
      {/* NỬA TRÁI (Desktop) / KHỐI TRÊN (Mobile): CHÀO HỎI & GIỚI THIỆU */}
      {/* ============================================================== */}
      <section className={styles.greetingSidebar} aria-label="Thông tin giới thiệu">
        <div className={styles.sidebarInner}>
          <div className={styles.brandBadge}>
            <SparklesIcon size={18} className={styles.brandIcon} />
            <span>Event Landing Studio</span>
          </div>

          <h1 className={styles.greetingHeading}>
            {greeting} <em className={styles.greetingItalic}>Kiến tạo sự kiện đột phá</em>
          </h1>
          <p className={styles.tagline}>
            Tạo landing page sự kiện chuyên nghiệp trong <strong>5 phút</strong> — không cần designer hay viết mã.
          </p>

          <div className={styles.stepsList}>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <strong>Nhập thông tin sự kiện</strong>
                <p>Thời gian, địa điểm, diễn giả & ảnh nguồn</p>
              </div>
            </div>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <strong>AI viết nội dung & dựng trang</strong>
                <p>Tự động tạo tiêu đề, mô tả và 3 lợi ích cốt lõi</p>
              </div>
            </div>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <strong>Xuất bản & Thu thập đơn</strong>
                <p>Theo dõi lượt đăng ký theo thời gian thực</p>
              </div>
            </div>
          </div>

          <div className={styles.statsSummary}>
            <div className={styles.statBox}>
              <span className={styles.statVal}>{projects.length}</span>
              <span className={styles.statLabel}>Dự án đã tạo</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBox}>
              <span className={styles.statVal}>{totalRegistrations}</span>
              <span className={styles.statLabel}>Tổng lượt đăng ký</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.ctaPrimary}
            onClick={() => {
              setNewProjectName('');
              setCreateError(null);
              setIsCreateOpen(true);
            }}
          >
            <PlusIcon size={18} />
            <span>Tạo dự án mới</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* NỬA PHẢI (Desktop) / PHẦN DƯỚI (Mobile): QUẢN LÝ DỰ ÁN        */}
      {/* ============================================================== */}
      <main className={styles.mainContent}>
        <div className={styles.contentHeader}>
          <div>
            <h2 className={styles.pageTitle}>Dự án của bạn</h2>
            <p className={styles.pageSubtitle}>
              Quản lý landing page, chỉnh sửa nội dung và theo dõi đơn đăng ký.
            </p>
          </div>

          <button
            type="button"
            className={styles.headerCreateBtn}
            onClick={() => {
              setNewProjectName('');
              setCreateError(null);
              setIsCreateOpen(true);
            }}
          >
            <PlusIcon size={16} />
            <span>Tạo dự án mới</span>
          </button>
        </div>

        {/* Bộ lọc và Tìm kiếm */}
        <div className={styles.controlsBar}>
          <div className={styles.filterTabs} role="tablist" aria-label="Lọc trạng thái dự án">
            <button
              type="button"
              role="tab"
              aria-selected={filterStatus === 'all'}
              className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.activeFilter : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Tất cả ({projects.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterStatus === PROJECT_STATUS.DRAFT}
              className={`${styles.filterBtn} ${filterStatus === PROJECT_STATUS.DRAFT ? styles.activeFilter : ''}`}
              onClick={() => setFilterStatus(PROJECT_STATUS.DRAFT)}
            >
              Bản nháp ({projects.filter((p) => p.status === PROJECT_STATUS.DRAFT).length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterStatus === PROJECT_STATUS.PUBLISHED}
              className={`${styles.filterBtn} ${filterStatus === PROJECT_STATUS.PUBLISHED ? styles.activeFilter : ''}`}
              onClick={() => setFilterStatus(PROJECT_STATUS.PUBLISHED)}
            >
              Đã xuất bản ({projects.filter((p) => p.status === PROJECT_STATUS.PUBLISHED).length})
            </button>
          </div>

          {(projects.length >= 5 || searchQuery) && (
            <div className={styles.searchBox}>
              <SearchIcon size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm dự án theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Tìm kiếm dự án"
              />
            </div>
          )}
        </div>

        {/* Danh sách dự án */}
        {filteredProjects.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconCircle}>
              <SparklesIcon size={32} />
            </div>
            <h3 className={styles.emptyTitle}>
              {searchQuery ? 'Không tìm thấy dự án phù hợp' : 'Bạn chưa có dự án nào'}
            </h3>
            <p className={styles.emptyDesc}>
              {searchQuery
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.'
                : 'Hãy tạo dự án đầu tiên để bắt đầu sinh landing page sự kiện với AI.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                className={styles.emptyActionBtn}
                onClick={() => {
                  setNewProjectName('');
                  setCreateError(null);
                  setIsCreateOpen(true);
                }}
              >
                <PlusIcon size={16} />
                <span>Tạo dự án mới</span>
              </button>
            )}
          </div>
        ) : (
          <div className={styles.projectGrid}>
            {filteredProjects.map((project) => {
              const regCount = regCounts[project.id] || 0;
              const dateDisplay = project.event?.eventDate
                ? `${project.event.eventDate} lúc ${project.event.eventTime || '09:00'}`
                : 'Chưa đặt ngày';

              return (
                <article
                  key={project.id}
                  className={styles.projectCard}
                  onClick={() => onNavigate(`p/${project.id}/info`)}
                >
                  <div className={styles.cardHeader}>
                    <Lozenge status={project.status} />
                    <span className={styles.regBadge}>
                      <UsersIcon size={14} />
                      <strong>{regCount}</strong> lượt đăng ký
                    </span>
                  </div>

                  <h3 className={styles.projectTitle} title={project.name}>
                    {project.name}
                  </h3>

                  <div className={styles.projectMeta}>
                    <div className={styles.metaRow}>
                      <CalendarIcon size={14} className={styles.metaIcon} />
                      <span>{dateDisplay}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <ClockIcon size={14} className={styles.metaIcon} />
                      <span>Cập nhật: {formatDateTime(project.updatedAt)}</span>
                    </div>
                  </div>

                  <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.btnOpen}
                      onClick={() => onNavigate(`p/${project.id}/info`)}
                    >
                      Mở không gian làm việc
                    </button>

                    {project.status === PROJECT_STATUS.PUBLISHED && (
                      <a
                        href={`#/e/${project.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.btnViewPublic}
                        title="Xem trang công khai"
                      >
                        <ExternalLinkIcon size={14} />
                      </a>
                    )}

                    <button
                      type="button"
                      className={styles.btnIcon}
                      title="Đổi tên dự án"
                      aria-label={`Đổi tên dự án ${project.name}`}
                      onClick={() => {
                        setEditingProject(project);
                        setRenameValue(project.name);
                        setRenameError(null);
                      }}
                    >
                      <PencilIcon size={15} />
                    </button>

                    <button
                      type="button"
                      className={`${styles.btnIcon} ${styles.btnDanger}`}
                      title="Xóa dự án"
                      aria-label={`Xóa dự án ${project.name}`}
                      onClick={() => setDeletingProject(project)}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: TẠO DỰ ÁN MỚI                                           */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="create-title">
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 id="create-title" className={styles.modalTitle}>Tạo dự án mới</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsCreateOpen(false)}
                aria-label="Đóng dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="new-project-name" className={styles.formLabel}>
                  Tên dự án sự kiện <span className={styles.required}>*</span>
                </label>
                <input
                  id="new-project-name"
                  type="text"
                  className={`${styles.textInput} ${createError ? styles.inputError : ''}`}
                  placeholder="Ví dụ: Workshop AI cho sinh viên 2026"
                  value={newProjectName}
                  onChange={(e) => {
                    setNewProjectName(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  autoFocus
                  disabled={isCreating}
                />
                {createError && (
                  <p className={styles.fieldErrorMsg} role="alert">
                    {createError}
                  </p>
                )}
                <span className={styles.helperText}>
                  Tên này sẽ dùng để tạo trang và quản lý trong danh sách của bạn.
                </span>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isCreating}
                  aria-busy={isCreating}
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo và bắt đầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ĐỔI TÊN DỰ ÁN                                           */}
      {/* ============================================================== */}
      {editingProject && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="rename-title">
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 id="rename-title" className={styles.modalTitle}>Đổi tên dự án</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setEditingProject(null)}
                aria-label="Đóng dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRenameSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="rename-input" className={styles.formLabel}>
                  Tên dự án mới <span className={styles.required}>*</span>
                </label>
                <input
                  id="rename-input"
                  type="text"
                  className={`${styles.textInput} ${renameError ? styles.inputError : ''}`}
                  value={renameValue}
                  onChange={(e) => {
                    setRenameValue(e.target.value);
                    if (renameError) setRenameError(null);
                  }}
                  autoFocus
                />
                {renameError && (
                  <p className={styles.fieldErrorMsg} role="alert">
                    {renameError}
                  </p>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setEditingProject(null)}
                >
                  Hủy
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DIALOG XÁC NHẬN: XÓA DỰ ÁN NGUY HIỂM (Theo FDD 5.6)             */}
      {/* ============================================================== */}
      {deletingProject && (
        <ConfirmDialog
          isOpen={Boolean(deletingProject)}
          title={`Xóa dự án "${deletingProject.name}"?`}
          message={
            regCounts[deletingProject.id] > 0
              ? `Thao tác này xóa vĩnh viễn dự án, ảnh nguồn và toàn bộ ${regCounts[deletingProject.id]} đơn đăng ký đã thu thập. Không thể hoàn tác dữ liệu này.`
              : 'Thao tác này sẽ xóa vĩnh viễn dự án và các hình ảnh liên quan. Bạn có chắc chắn muốn xóa không?'
          }
          confirmLabel="Xóa vĩnh viễn"
          cancelLabel="Hủy"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingProject(null)}
        />
      )}
    </div>
  );
}
