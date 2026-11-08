import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  generateRegistrationCode,
  generateSlug,
  createDefaultFormFields,
  createProject,
  createRegistrationRecord,
  EVENT_FIELDS,
  AI_FIELDS,
  normalizeEventInput,
  FIELD_ROLES,
  ASSET_ROLES,
} from '../src/domain/elsSchema.js';

import { createDefaultSampleAssets } from '../src/domain/sampleAssets.js';
import { buildSystemSampleProjects, SAMPLE_PROJECT_IDS } from '../src/domain/sampleProjects.js';
import { runResponsiveScan } from '../src/domain/moduleAuditor.js';
import { elsRepository, formatXmlCell } from '../src/services/elsRepository.js';

import {
  validateProjectName,
  validateProjectInfo,
  validateFormFields,
  validateRegistrationSubmission,
} from '../src/domain/validators.js';

describe('6. ELS Domain: Schema & Generators', () => {
  it('generateRegistrationCode: sinh mã dạng DK-XXXXXX từ bảng chữ số chuẩn', () => {
    const code = generateRegistrationCode();
    assert.match(code, /^DK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  });

  it('generateSlug: sinh slug tiếng Việt không dấu kèm hậu tố', () => {
    const slug = generateSlug('Hội thảo Ứng dụng AI 2026');
    assert.ok(slug.startsWith('hoi-thao-ung-dung-ai-2026-'));
  });

  it('createDefaultFormFields: tạo đúng 3 trường mặc định tuân thủ bảo mật và không thu thập MSV thừa (Họ và tên, Email, Số điện thoại tùy chọn)', () => {
    const fields = createDefaultFormFields();
    assert.equal(fields.length, 3);
    assert.equal(fields[0].key, 'fld_name');
    assert.equal(fields[0].role, FIELD_ROLES.DISPLAY_NAME);
    assert.equal(fields[0].required, true);
    assert.equal(fields[1].key, 'fld_email');
    assert.equal(fields[1].role, FIELD_ROLES.IDENTITY);
    assert.equal(fields[1].required, true);
    assert.equal(fields[2].key, 'fld_phone');
    assert.equal(fields[2].required, false);
    // Đảm bảo không có trường MSV thừa
    assert.equal(fields.some(f => f.key === 'fld_msv'), false);
  });

  it('createProject: khởi tạo dự án với thông tin và trạng thái draft', () => {
    const p = createProject({ name: 'Dự án AI Mới', event: { description: 'Ghi chú thêm về sự kiện' } });
    assert.equal(p.name, 'Dự án AI Mới');
    assert.equal(p.status, 'draft');
    assert.ok(p.id.startsWith('prj_'));
    assert.equal(p.event.description, 'Ghi chú thêm về sự kiện');
  });

  it('createRegistrationRecord: tạo bản ghi đăng ký chuẩn hóa', () => {
    const reg = createRegistrationRecord({
      projectId: 'prj_123',
      values: { fld_name: 'Nguyễn Văn A' },
      displayName: 'Nguyễn Văn A',
      identityKey: 'a@example.com',
    });
    assert.equal(reg.displayName, 'Nguyễn Văn A');
    assert.equal(reg.identityKey, 'a@example.com');
    assert.match(reg.code, /^DK-/);
  });

  it('EVENT_FIELDS & normalizeEventInput: Single Source of Truth cho toàn bộ trường sự kiện (SYS-05)', () => {
    assert.equal(EVENT_FIELDS.NAME, 'eventName');
    assert.equal(EVENT_FIELDS.DATE, 'eventDate');
    assert.equal(EVENT_FIELDS.TIME, 'eventTime');
    assert.equal(EVENT_FIELDS.VENUE, 'venue');
    assert.equal(EVENT_FIELDS.SPEAKERS, 'speakers');
    assert.equal(EVENT_FIELDS.EARLY_BIRD, 'earlyBirdOffer');

    const rawLegacy = {
      name: '  Hội Thảo Công Nghệ Cao  ',
      date: '2026-12-15',
      time: '14:30',
      location: '  Hà Nội  ',
      speakers: 'Nguyễn Văn A, Trần Thị B',
      earlyBird: 'Giảm 25%',
    };
    const normalized = normalizeEventInput(rawLegacy);
    assert.equal(normalized.eventName, 'Hội Thảo Công Nghệ Cao');
    assert.equal(normalized.eventDate, '2026-12-15');
    assert.equal(normalized.eventTime, '14:30');
    assert.equal(normalized.venue, 'Hà Nội');
    assert.equal(normalized.earlyBirdOffer, 'Giảm 25%');
    assert.equal(normalized.speakers.length, 2);
    assert.equal(normalized.speakers[0].name, 'Nguyễn Văn A');
  });
});

describe('7. ELS Domain: Validators (FDD Quy tắc nghiệp vụ)', () => {
  it('validateProjectName: từ chối tên rỗng hoặc dưới 3 ký tự', () => {
    assert.equal(validateProjectName('  ').isValid, false);
    assert.equal(validateProjectName('AI').isValid, false);
    assert.equal(validateProjectName('Workshop Vibe Coding 2026').isValid, true);
  });

  it('validateProjectInfo: kiểm tra đủ 7 trường thông tin sự kiện', () => {
    const validData = {
      eventName: 'Workshop AI',
      eventDate: '2026-11-20',
      eventTime: '09:00',
      venue: 'Hội trường Grand Hall',
      speakers: [{ id: '1', name: 'TS. Nguyễn Văn A', title: 'Chuyên gia AI' }],
      earlyBirdOffer: 'Tặng Ebook 500k',
      agenda: [{ id: '1', time: '09:00', title: 'Check-in' }],
    };
    const res = validateProjectInfo(validData, []);
    assert.equal(res.isValid, true);

    // Thiếu diễn giả
    const noSpeaker = { ...validData, speakers: [] };
    assert.equal(validateProjectInfo(noSpeaker, []).isValid, false);

    // Ngày quá khứ
    const pastEvent = { ...validData, eventDate: '2020-01-01' };
    assert.equal(validateProjectInfo(pastEvent, []).isValid, false);
  });

  it('validateProjectInfo: kiểm tra mô tả ảnh nguồn (caption mandatory)', () => {
    const validData = {
      eventName: 'Workshop AI',
      eventDate: '2026-11-20',
      eventTime: '09:00',
      venue: 'Hội trường Grand Hall',
      speakers: [{ id: '1', name: 'TS. Nguyễn Văn A', title: 'Chuyên gia AI' }],
      earlyBirdOffer: 'Tặng Ebook 500k',
      agenda: [{ id: '1', time: '09:00', title: 'Check-in' }],
    };
    const badAssets = [{ id: 'img_1', dataUrl: 'data:...', caption: '  ' }];
    const res = validateProjectInfo(validData, badAssets);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.assets);
  });

  it('validateFormFields: kiểm tra đúng 1 displayName và ít nhất 1 identity', () => {
    const fields = createDefaultFormFields();
    const res = validateFormFields(fields);
    assert.equal(res.isValid, true);

    // Không có displayName
    const noDisplayName = fields.map((f) => ({ ...f, role: null }));
    assert.equal(validateFormFields(noDisplayName).isValid, false);

    // Không có identity
    const noIdentity = fields.map((f) => (f.role === FIELD_ROLES.IDENTITY ? { ...f, role: null } : f));
    assert.equal(validateFormFields(noIdentity).isValid, false);

    // Cảnh báo trường nhạy cảm
    const sensitive = [...fields, { key: 'fld_cccd', label: 'Số CCCD', type: 'text', required: true, role: null, deleted: false }];
    const warnRes = validateFormFields(sensitive);
    assert.ok(warnRes.warnings.length > 0);
  });

  it('validateRegistrationSubmission: kiểm tra định dạng và chống trùng lặp', () => {
    const fields = createDefaultFormFields();
    const existing = [
      { id: '1', identityKey: 'test@example.com', displayName: 'Người cũ' },
    ];

    // Trùng email định danh
    const duplicate = validateRegistrationSubmission(
      { fld_name: 'Người mới', fld_msv: '20201234', fld_email: 'TEST@example.com' },
      fields,
      existing
    );
    assert.equal(duplicate.isValid, false);
    assert.ok(duplicate.error.includes('đã đăng ký'));

    // Hợp lệ
    const validSub = validateRegistrationSubmission(
      { fld_name: 'Người mới', fld_msv: '20201234', fld_email: 'unique@example.com' },
      fields,
      existing
    );
    assert.equal(validSub.isValid, true);
    assert.equal(validSub.identityKey, 'unique@example.com');
  });

  it('createDefaultSampleAssets: sinh đầy đủ 6 ảnh mẫu AI kèm mô tả chi tiết và vai trò', () => {
    const speakerIds = ['spk_1', 'spk_2', 'spk_3'];
    const assets = createDefaultSampleAssets('proj_test_123', speakerIds);

    assert.equal(assets.length, 6, 'Phải sinh đúng 6 ảnh mẫu');
    
    // Kiểm tra từng ảnh đều có caption không rỗng
    for (const a of assets) {
      assert.ok(a.caption && a.caption.trim().length > 5, 'Mọi ảnh phải có mô tả caption rõ ràng');
      assert.equal(a.projectId, 'proj_test_123');
      assert.ok(a.dataUrl.length > 0);
    }

    // 3 ảnh diễn giả
    const speakerAssets = assets.filter((a) => a.role === ASSET_ROLES.SPEAKER);
    assert.equal(speakerAssets.length, 3);
    assert.equal(speakerAssets[0].speakerRef, 'spk_1');
    assert.equal(speakerAssets[1].speakerRef, 'spk_2');
    assert.equal(speakerAssets[2].speakerRef, 'spk_3');

    // 1 ảnh venue
    const venueAsset = assets.find((a) => a.role === ASSET_ROLES.VENUE);
    assert.ok(venueAsset);

    // 1 ảnh quà tặng/giải thưởng
    const giftAsset = assets.find((a) => a.role === ASSET_ROLES.GIFT);
    assert.ok(giftAsset);

    // 1 ảnh poster/other
    const posterAsset = assets.find((a) => a.role === ASSET_ROLES.OTHER);
    assert.ok(posterAsset);
  });

  it('formatXmlCell: chống Formula Injection và mã hóa an toàn ký tự XML đặc biệt', () => {
    // Formula Injection
    assert.equal(formatXmlCell('=cmd|/C calc'), '&apos;=cmd|/C calc');
    assert.equal(formatXmlCell('+1+2'), '&apos;+1+2');
    assert.equal(formatXmlCell('-5*5'), '&apos;-5*5');
    assert.equal(formatXmlCell('@SUM(A1:A10)'), '&apos;@SUM(A1:A10)');

    // Ký tự XML đặc biệt
    assert.equal(formatXmlCell('Tom & Jerry <Tech> "Vibe" \'2026\''), 'Tom &amp; Jerry &lt;Tech&gt; &quot;Vibe&quot; &apos;2026&apos;');
  });

  it('exportToExcel: sinh dữ liệu bảng tính SpreadsheetML XML đầy đủ cột và style', () => {
    const store = new Map();
    globalThis.window = {
      localStorage: {
        getItem: (k) => store.get(k) || null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
      },
    };

    const testProjId = 'test_proj_excel_' + Date.now();
    const fields = createDefaultFormFields();

    // Thêm đơn đăng ký thử nghiệm
    const rec = elsRepository.addRegistration(testProjId, {
      values: {
        fld_name: 'Nguyễn Văn Excel',
        fld_email: 'excel@vibecoding.vn',
      },
      source: 'preview',
      displayName: 'Nguyễn Văn Excel',
      identityKey: 'excel@vibecoding.vn',
    });

    const xml = elsRepository.exportToExcel(testProjId, fields);
    assert.ok(typeof xml === 'string');
    assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('urn:schemas-microsoft-com:office:spreadsheet'));
    assert.ok(xml.includes('HeaderStyle'));
    assert.ok(xml.includes('Mã đăng ký'));
    assert.ok(xml.includes(rec.code));
    assert.ok(xml.includes('Nguyễn Văn Excel'));
    assert.ok(xml.includes('excel@vibecoding.vn'));
  });

  it('elsRepository: bắt lỗi QuotaExceededError khi localStorage đầy và báo thông điệp tiếng Việt rõ ràng [SYS-06]', () => {
    globalThis.window = {
      localStorage: {
        getItem: () => '[]',
        setItem: () => {
          const err = new Error('Storage full');
          err.name = 'QuotaExceededError';
          throw err;
        },
        removeItem: () => {},
      },
    };

    assert.throws(
      () => elsRepository.createProject({ name: 'Dự án tràn bộ nhớ' }),
      (err) => err.message.includes('Bộ nhớ trình duyệt (localStorage) đã đầy')
    );
  });

  it('Code Hygiene & Layering Guard: đảm bảo không có component gọi trực tiếp localStorage hoặc dùng dangerouslySetInnerHTML [SYS-05, SYS-12]', () => {
    assert.equal(AI_FIELDS.HEADLINE, 'headline');
    assert.equal(AI_FIELDS.DESCRIPTION, 'description');
    assert.equal(AI_FIELDS.BENEFITS, 'benefits');

    const walkFiles = (dir, list = []) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkFiles(full, list);
        else if (/\.(js|jsx)$/.test(entry.name)) list.push(full);
      }
      return list;
    };

    const componentFiles = walkFiles(path.resolve('src/components'));
    for (const file of componentFiles) {
      const code = fs.readFileSync(file, 'utf8');
      assert.equal(
        /\blocalStorage\.(getItem|setItem|removeItem|clear)\b/.test(code),
        false,
        `Component không được gọi trực tiếp localStorage: ${path.relative(process.cwd(), file)}`
      );
      assert.equal(
        code.includes('dangerouslySetInnerHTML'),
        false,
        `Không được sử dụng dangerouslySetInnerHTML trong: ${path.relative(process.cwd(), file)}`
      );
    }

    const apiFiles = walkFiles(path.resolve('api'));
    for (const file of apiFiles) {
      const code = fs.readFileSync(file, 'utf8');
      assert.equal(
        /catch\s*\(\s*\)\s*\{\s*\}|catch\s*\{\s*\}/.test(code),
        false,
        `API serverless không được chứa khối catch rỗng nuốt lỗi: ${path.relative(process.cwd(), file)}`
      );
    }
  });

  it('System Sample Projects Audit: kiểm định toàn diện 3 Dự án mẫu hệ thống (Đủ 6 ảnh, 0 ảnh, 2 ảnh chọn lọc) đạt 0 lỗi, 0 cảnh báo, 0 gợi ý', () => {
    const samples = buildSystemSampleProjects();
    assert.equal(samples.length, 3);
    assert.deepEqual(
      samples.map((s) => s.project.id),
      SAMPLE_PROJECT_IDS
    );

    // Kịch bản 1: Đầy đủ 6 ảnh (Poster, 3 Diễn giả, Hội trường, Quà tặng)
    const [s1, s2, s3] = samples;
    assert.equal(s1.project.isSample, true);
    assert.equal(s1.assets.length, 6);
    assert.equal(s1.project.event.speakers.length, 3);
    assert.equal(s1.project.event.agenda.length, 6);
    assert.equal(s1.registrations.length, 5);
    assert.ok(s1.registrations.some((r) => r.checkedIn === true));
    assert.ok(s1.registrations.some((r) => r.checkedIn === false));

    // Kịch bản 2: Không có ảnh (0 ảnh) - Thuần Typography & Bản đồ SVG
    assert.equal(s2.project.isSample, true);
    assert.equal(s2.assets.length, 0);
    assert.equal(s2.project.event.speakers.length, 3);
    assert.equal(s2.project.formFields.length, 4);
    assert.equal(s2.registrations.length, 3);
    const s2SpeakersMod = s2.project.moduleLayout.find((m) => m.type === 'speakers');
    const s2VenueMod = s2.project.moduleLayout.find((m) => m.type === 'venue');
    assert.equal(s2SpeakersMod.variant, 'trio-typographic');
    assert.equal(s2VenueMod.variant, 'map-left');

    // Kịch bản 3: Ảnh chọn lọc (2 ảnh: 1 diễn giả + 1 quà tặng, không có ảnh địa điểm) & Form tùy biến
    assert.equal(s3.project.isSample, true);
    assert.equal(s3.assets.length, 2);
    assert.equal(s3.project.event.speakers.length, 1);
    assert.equal(s3.project.formFields.length, 4);
    assert.equal(s3.registrations.length, 4);
    const s3SpeakersMod = s3.project.moduleLayout.find((m) => m.type === 'speakers');
    assert.equal(s3SpeakersMod.variant, 'solo-spotlight');

    // Đánh giá tự động từng dự án qua bộ Validator (WS1 + WS2) và Responsive Module Auditor (5 kích thước màn hình)
    for (const { project, assets } of samples) {
      const infoValidation = validateProjectInfo(project.event, assets);
      assert.equal(
        infoValidation.isValid,
        true,
        `Dự án mẫu "${project.name}" gặp lỗi thông tin WS1: ${JSON.stringify(infoValidation.errors)}`
      );

      const formValidation = validateFormFields(project.formFields);
      assert.equal(
        formValidation.isValid,
        true,
        `Dự án mẫu "${project.name}" gặp lỗi Form WS2: ${JSON.stringify(formValidation.errors)}`
      );
      assert.equal(formValidation.warnings.length, 0);

      const scan = runResponsiveScan(project.moduleLayout, project.event, assets);
      assert.equal(
        scan.summary.totalErrors,
        0,
        `Dự án mẫu "${project.name}" có lỗi bố cục: ${JSON.stringify(scan.resultsByBreakpoint)}`
      );
      assert.equal(
        scan.summary.totalWarnings,
        0,
        `Dự án mẫu "${project.name}" có cảnh báo bố cục: ${JSON.stringify(scan.resultsByBreakpoint)}`
      );
      assert.equal(
        scan.summary.totalSuggestions,
        0,
        `Dự án mẫu "${project.name}" còn gợi ý tối ưu chưa xử lý: ${JSON.stringify(scan.resultsByBreakpoint)}`
      );
    }

    // Kiểm tra cơ chế lưu sẵn và khôi phục trong elsRepository
    const store = new Map();
    globalThis.window = {
      localStorage: {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
      },
    };

    const seeded = elsRepository.ensureSampleProjects();
    assert.equal(seeded.length, 3);
    assert.equal(elsRepository.getAssets('prj_sample_ai_summit').length, 6);
    assert.equal(elsRepository.getAssets('prj_sample_biz_strategy').length, 0);
    assert.equal(elsRepository.getAssets('prj_sample_student_fest').length, 2);
    assert.equal(elsRepository.getRegistrationCount('prj_sample_ai_summit'), 5);
    assert.equal(elsRepository.getRegistrationCount('prj_sample_biz_strategy'), 3);
    assert.equal(elsRepository.getRegistrationCount('prj_sample_student_fest'), 4);

    // Nếu người dùng xóa thử 1 dự án mẫu rồi bấm khôi phục, hệ thống khôi phục đủ 3 dự án mẫu
    elsRepository.deleteProject('prj_sample_ai_summit');
    assert.equal(elsRepository.getProjects().length, 2);
    elsRepository.ensureSampleProjects({ forceReset: true });
    assert.equal(elsRepository.getProjects().length, 3);
    assert.equal(elsRepository.getAssets('prj_sample_ai_summit').length, 6);
  });
});
