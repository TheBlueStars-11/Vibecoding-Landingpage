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
import { adaptModuleTreeToEventData, createPresetModuleTree } from '../src/domain/moduleSchema.js';
import { runResponsiveScan } from '../src/domain/moduleAuditor.js';
import { elsRepository, formatXmlCell } from '../src/services/elsRepository.js';
import { generateMockContent } from '../src/services/mockAi.js';

import {
  validateProjectName,
  validateProjectInfo,
  validateFormFields,
  validateRegistrationSubmission,
  validateTimelineOrder,
  validateAgendaChronology,
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

  it('validateTimelineOrder: kiểm tra thứ tự thời gian tăng dần và phát hiện mốc vi phạm', () => {
    // 1. Thứ tự tăng dần hợp lệ
    const validAgenda = [
      { id: '1', time: '09:00', title: 'Đón tiếp' },
      { id: '2', time: '09:30', title: 'Khai mạc' },
      { id: '3', time: '10:00 - 11:30', title: 'Phiên chính' },
      { id: '4', time: '11:30', title: 'Bế mạc' },
    ];
    const validRes = validateTimelineOrder(validAgenda);
    assert.equal(validRes.isValid, true);
    assert.deepEqual(validRes.invalidIndices, []);
    assert.equal(validRes.error, null);

    // 2. Kéo 09:30 lên trước 09:00 -> mục sau (09:00 tại index 1) vi phạm thứ tự logic
    const invertedAgenda = [
      { id: '2', time: '09:30', title: 'Khai mạc' },
      { id: '1', time: '09:00', title: 'Đón tiếp' },
    ];
    const invRes = validateTimelineOrder(invertedAgenda);
    assert.equal(invRes.isValid, false);
    assert.deepEqual(invRes.invalidIndices, [1]);
    assert.equal(invRes.error, 'Thời gian diễn ra các mục phải theo thứ tự tăng dần. Vui lòng điều chỉnh lại.');

    // 3. Mục sau bắt đầu trước khi mục liền trước kết thúc (09:00 - 10:00 rồi đến 09:30)
    const overlapAgenda = [
      { id: '1', time: '09:00 - 10:00', title: 'Khóa 1' },
      { id: '2', time: '09:30', title: 'Khóa 2' },
    ];
    const overlapRes = validateAgendaChronology(overlapAgenda);
    assert.equal(overlapRes.isValid, false);
    assert.deepEqual(overlapRes.invalidIndices, [1]);

    // 4. Mảng rỗng hoặc 1 phần tử
    assert.equal(validateTimelineOrder([]).isValid, true);
    assert.equal(validateTimelineOrder([{ time: '09:00' }]).isValid, true);

    // 5. Tích hợp trong validateProjectInfo: Chặn dữ liệu không hợp lệ
    const projectWithBadAgenda = {
      eventName: 'Workshop AI',
      eventDate: '2026-11-20',
      eventTime: '09:00',
      venue: 'Hội trường Grand Hall',
      speakers: [{ id: '1', name: 'TS. Nguyễn Văn A', title: 'Chuyên gia AI' }],
      earlyBirdOffer: 'Tặng Ebook 500k',
      agenda: invertedAgenda,
    };
    const projectInfoRes = validateProjectInfo(projectWithBadAgenda, []);
    assert.equal(projectInfoRes.isValid, false);
    assert.equal(projectInfoRes.errors.agenda, 'Thời gian diễn ra các mục phải theo thứ tự tăng dần. Vui lòng điều chỉnh lại.');
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
      { id: '1', identityKey: 'test@example.com', email: 'test@example.com', phone: '0912345678', displayName: 'Người cũ' },
    ];

    // Trùng email định danh (trim + hoa/thường)
    const duplicate = validateRegistrationSubmission(
      { fld_name: 'Người mới', fld_email: '   TEST@EXAMPLE.COM   ', fld_phone: '0988776655' },
      fields,
      existing
    );
    assert.equal(duplicate.isValid, false);
    assert.equal(duplicate.errors.fld_email, 'Email/Số điện thoại này đã được sử dụng để đăng ký sự kiện rồi.');

    // Trùng số điện thoại (trim + định dạng)
    const dupPhone = validateRegistrationSubmission(
      { fld_name: 'Người mới', fld_email: 'unique@example.com', fld_phone: '  0912.345.678  ' },
      fields,
      existing
    );
    assert.equal(dupPhone.isValid, false);
    assert.equal(dupPhone.errors.fld_phone, 'Email/Số điện thoại này đã được sử dụng để đăng ký sự kiện rồi.');

    // Hợp lệ
    const validSub = validateRegistrationSubmission(
      { fld_name: 'Người mới', fld_email: 'unique@example.com', fld_phone: '0999888777' },
      fields,
      existing
    );
    assert.equal(validSub.isValid, true);
    assert.equal(validSub.identityKey, 'unique@example.com');
  });

  it('elsRepository.addRegistration: Chống đăng ký trùng lặp email và số điện thoại, chặn tăng số lượng', () => {
    const store = new Map();
    globalThis.window = {
      localStorage: {
        getItem: (k) => store.get(k) || null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
      },
    };

    const testProjectId = 'proj_dup_test_' + Date.now();
    const proj = elsRepository.createProject({ id: testProjectId, name: 'Sự kiện Kiểm tra Trùng lặp' });
    assert.ok(proj);

    const initialCount = elsRepository.getRegistrationCount(testProjectId);
    assert.equal(initialCount, 0);

    // Đăng ký người thứ 1
    const reg1 = elsRepository.addRegistration(testProjectId, {
      values: {
        fld_name: 'Đặng Quốc Hưng',
        fld_email: 'hung@vibecode.vn',
        fld_phone: '0912345678',
      },
      displayName: 'Đặng Quốc Hưng',
      identityKey: 'hung@vibecode.vn',
    });
    assert.ok(reg1.code);
    assert.equal(elsRepository.getRegistrationCount(testProjectId), 1);

    // Thử đăng ký người thứ 2 trùng Email (có khoảng trắng và chữ hoa)
    assert.throws(() => {
      elsRepository.addRegistration(testProjectId, {
        values: {
          fld_name: 'Người Trùng Email',
          fld_email: '   HUNG@VIBECODE.VN   ',
          fld_phone: '0988000111',
        },
        displayName: 'Người Trùng Email',
        identityKey: 'hung@vibecode.vn',
      });
    }, (err) => {
      assert.ok(err.message.includes('Email/Số điện thoại này đã được sử dụng'));
      return true;
    });

    // Số lượng người tham gia KHÔNG được tăng, vẫn là 1
    assert.equal(elsRepository.getRegistrationCount(testProjectId), 1);

    // Thử đăng ký người thứ 3 trùng Số điện thoại
    assert.throws(() => {
      elsRepository.addRegistration(testProjectId, {
        values: {
          fld_name: 'Người Trùng Phone',
          fld_email: 'another@vibecode.vn',
          fld_phone: '  0912.345.678  ',
        },
        displayName: 'Người Trùng Phone',
        identityKey: 'another@vibecode.vn',
      });
    }, (err) => {
      assert.ok(err.message.includes('Email/Số điện thoại này đã được sử dụng'));
      return true;
    });

    // Số lượng người tham gia KHÔNG được tăng, vẫn là 1
    assert.equal(elsRepository.getRegistrationCount(testProjectId), 1);
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

    // Kịch bản 3: Ảnh chọn lọc (2 ảnh: 1 diễn giả + 1 quà tặng, không có ảnh sự kiện/địa điểm) & Form tùy biến
    assert.equal(s3.project.isSample, true);
    assert.equal(s3.assets.length, 2);
    assert.equal(s3.project.event.speakers.length, 1);
    assert.equal(s3.project.formFields.length, 4);
    assert.equal(s3.registrations.length, 4);
    const s3HeroMod = s3.project.moduleLayout.find((m) => m.type === 'hero');
    const s3SpeakersMod = s3.project.moduleLayout.find((m) => m.type === 'speakers');
    // Mẫu 3 không có ảnh sự kiện/poster -> bắt buộc dùng module Hero không có ảnh ('benefits-band')
    assert.equal(s3HeroMod.variant, 'benefits-band');
    assert.equal(s3SpeakersMod.variant, 'solo-spotlight');

    // Tên sự kiện trong mục Thông tin chung phải giữ nguyên 100% ở Preview (ai.headline === event.eventName)
    for (const { project } of samples) {
      assert.equal(project.ai.headline, project.event.eventName);
      assert.equal(project.name, project.event.eventName);
    }

    // Khi không có ảnh liên quan đến sự kiện (chỉ có ảnh diễn giả/quà tặng), generateMockContent tuyệt đối không gán ảnh diễn giả vào heroImageId
    const mockNoEventImg = generateMockContent(s3.project.event, s3.assets);
    assert.equal(mockNoEventImg.headline, s3.project.event.eventName);
    assert.equal(mockNoEventImg.imageAssignments.heroImageId, null);

    // Kiểm tra yêu cầu: 2 dự án mẫu có đầy đủ Mô tả thêm sự kiện (Mẫu 1 & Mẫu 3) và 1 dự án mẫu bỏ trống (Mẫu 2)
    assert.equal(s1.project.event.description.length > 100, true);
    assert.equal(s3.project.event.description.length > 100, true);
    assert.equal(s2.project.event.description, '');

    // Mẫu 1 & Mẫu 3 (có Mô tả thêm): Tận dụng đầy đủ thông tin & module (bento, audience, organizer, offer_banner, faq)
    for (const richSample of [s1, s3]) {
      const modTypes = richSample.project.moduleLayout.map((m) => m.type);
      assert.equal(modTypes.includes('bento'), true);
      assert.equal(modTypes.includes('audience'), true);
      assert.equal(modTypes.includes('organizer'), true);
      assert.equal(modTypes.includes('offer_banner'), true);
      assert.equal(modTypes.includes('faq'), true);
      assert.equal(Array.isArray(richSample.project.ai.audience) && richSample.project.ai.audience.length === 3, true);
      assert.equal(Array.isArray(richSample.project.ai.bentoHighlights) && richSample.project.ai.bentoHighlights.length === 4, true);
      assert.equal(Boolean(richSample.project.ai.organizer?.email), true);
    }

    // Mẫu 2 (bỏ trống Mô tả thêm): Không bịa đặt & Cắt giảm các module mở rộng (không có bento, audience, organizer, sponsors)
    const s2ModTypes = s2.project.moduleLayout.map((m) => m.type);
    assert.equal(s2ModTypes.includes('bento'), false);
    assert.equal(s2ModTypes.includes('audience'), false);
    assert.equal(s2ModTypes.includes('organizer'), false);
    assert.equal(s2ModTypes.includes('sponsors'), false);
    assert.deepEqual(s2.project.ai.audience, []);
    assert.deepEqual(s2.project.ai.bentoHighlights, []);
    assert.equal(s2.project.ai.organizer, null);

    // Kiểm tra engine generateMockContent & adaptModuleTreeToEventData theo 3 tiêu chí cho mọi dự án:
    // 1. Khi dự án KHÔNG có mô tả thêm: cắt giảm module và không bịa đặt
    const mockWithoutDesc = generateMockContent(s2.project.event, s2.assets);
    assert.deepEqual(mockWithoutDesc.audience, []);
    assert.deepEqual(mockWithoutDesc.bentoHighlights, []);
    assert.equal(mockWithoutDesc.organizer, null);
    const adaptedWithoutDesc = adaptModuleTreeToEventData(
      createPresetModuleTree('techtalk'),
      s2.project.event,
      s2.assets,
      mockWithoutDesc,
      { expandWhenRich: true }
    );
    const adaptedNoDescTypes = adaptedWithoutDesc.map((m) => m.type);
    assert.equal(adaptedNoDescTypes.includes('bento'), false);
    assert.equal(adaptedNoDescTypes.includes('audience'), false);
    assert.equal(adaptedNoDescTypes.includes('organizer'), false);
    assert.equal(adaptedNoDescTypes.includes('sponsors'), false);

    // 2. Khi dự án CÓ mô tả thêm: tận dụng thông tin mô tả thêm và kích hoạt đầy đủ module hợp lý
    const mockWithDesc = generateMockContent(s1.project.event, s1.assets);
    assert.equal(mockWithDesc.audience.length, 3);
    assert.equal(mockWithDesc.bentoHighlights.length, 4);
    assert.equal(mockWithDesc.organizer.email, 'sukien.ai@nic.gov.vn');
    const adaptedWithDesc = adaptModuleTreeToEventData(
      createPresetModuleTree('compact'),
      s1.project.event,
      s1.assets,
      mockWithDesc,
      { expandWhenRich: true }
    );
    const adaptedRichTypes = adaptedWithDesc.map((m) => m.type);
    assert.equal(adaptedRichTypes.includes('bento'), true);
    assert.equal(adaptedRichTypes.includes('audience'), true);
    assert.equal(adaptedRichTypes.includes('organizer'), true);
    assert.equal(adaptedRichTypes.includes('offer_banner'), true);
    assert.equal(adaptedRichTypes.includes('sponsors'), false); // Không có nhà tài trợ trong dữ liệu -> không bịa đặt

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

    // Kiểm tra thứ tự sắp xếp: Dự án người dùng luôn đứng trước, 3 Dự án mẫu hệ thống luôn nằm ở vị trí sau cùng
    const userProject = elsRepository.createProject({ name: 'Sự kiện Người Dùng Tự Tạo 2026' });
    const allList = [...elsRepository.getProjects()];
    allList.sort((a, b) => {
      const aSample = Boolean(a.isSample || SAMPLE_PROJECT_IDS.includes(a.id));
      const bSample = Boolean(b.isSample || SAMPLE_PROJECT_IDS.includes(b.id));
      if (aSample !== bSample) return aSample ? 1 : -1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
    assert.equal(allList[0].id, userProject.id);
    assert.deepEqual(
      allList.slice(-3).map((p) => p.id),
      SAMPLE_PROJECT_IDS
    );
  });
});
