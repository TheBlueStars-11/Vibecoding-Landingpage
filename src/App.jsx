import { useState } from 'react';
import EventForm from './components/EventForm';
import LandingPage from './components/LandingPage';
import { generateEventContent } from './lib/gemini';
import styles from './App.module.css';

export default function App() {
  const [stage, setStage] = useState('form');
  const [eventData, setEventData] = useState(null);
  const [aiContent, setAiContent] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (formData) => {
    setStage('loading');
    setError(null);
    try {
      const content = await generateEventContent(formData);
      setEventData(formData);
      setAiContent(content);
      setStage('preview');
    } catch (err) {
      setError(err.message);
      setStage('form');
    }
  };

  const handleReset = () => {
    setStage('form');
    setEventData(null);
    setAiContent(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.app}>
      {stage === 'form' && (
        <div className={styles.formWrapper}>
          <div className={styles.appHeader}>
            <h1>🎪 Event Page Builder</h1>
            <p>Tạo landing page sự kiện chuyên nghiệp trong 30 giây với AI</p>
          </div>
          {error && (
            <div className={styles.errorBox}>
              <strong>❌ Lỗi:</strong> {error}
            </div>
          )}
          <EventForm onGenerate={handleGenerate} isLoading={false} />
        </div>
      )}

      {stage === 'loading' && (
        <div className={styles.loadingScreen}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingSpinner} />
            <h2>AI đang sáng tạo nội dung...</h2>
            <p>Đang sinh headline, mô tả và 3 lợi ích tham dự</p>
          </div>
        </div>
      )}

      {stage === 'preview' && eventData && aiContent && (
        <LandingPage
          eventData={eventData}
          aiContent={aiContent}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
