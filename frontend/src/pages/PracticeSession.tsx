import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RefreshCw, ChevronLeft, Flag, HelpCircle, Brain } from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router-dom';
// import AudioVisualizer from '../components/AudioVisualizer';
import FeedbackPanel from '../components/FeedbackPanel';
import { skillsApi, codeApi, interviewApi, practiceApi, practiceV1Api } from '../lib/api';
// import { speechApi } from '../lib/api';
import { PracticeContent } from '../types/index';

const PracticeSession = () => {
  const { id } = useParams<{ id: string }>();
  const [phase, setPhase] = useState<'prep' | 'recording' | 'analyzing' | 'result' | 'text-input'>('prep');
  // 语音相关状态（已注释）
  // const [timeLeft, setTimeLeft] = useState(30);
  // const [recording, setRecording] = useState<MediaRecorder | null>(null);
  // const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [transcript, setTranscript] = useState<string>(''); // 存储语音转文字结果或手动输入的文字
  const [inputType, setInputType] = useState<'voice' | 'text'>('text'); // 用户选择的输入类型，默认改为文字输入
  const [manualText, setManualText] = useState<string>(''); // 手动输入的文字
  const [startTime, setStartTime] = useState<string>(''); // 练习开始时间
  const [endTime, setEndTime] = useState<string>(''); // 练习结束时间
  const [userId] = useState<string>('default_user'); // 当前用户 ID，实际项目中应从认证系统获取
  const location = useLocation();
  
  // 添加状态管理
  const [content, setContent] = useState<PracticeContent>({
    category: "沟通表达",
    difficulty: "入门",
    title: "即兴演讲：黄金开场白",
    description: "请在 **30 秒** 内设计一个引人入胜的演讲开场白。请尝试使用 '钩子' 技巧在 30 秒内抓住听众注意力。AI 将分析你的语调与内容结构。"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExampleAnswer, setShowExampleAnswer] = useState(false); // 控制是否显示参考答案
  
  // 跟踪组件是否已挂载
  const isMounted = useRef(true);
  // 跟踪是否有正在进行的异步操作
  const ongoingRequests = useRef<Set<Promise<any>>>(new Set());

  // 从后端获取练习内容
  useEffect(() => {
    // 如果来自历史记录，直接填充结果并展示
    if (location?.state && (location.state as any).fromHistory) {
      const rec = (location.state as any).record;
      if (rec) {
        // 填充页面字段并展示结果
        setTranscript(rec.transcript || '');
        setFeedback({
          score: rec.score || 0,
          strengths: rec.strengths || [],
          improvements: rec.improvements || [],
          aiComment: rec.ai_comment || ''
        });
        setStartTime(rec.start_time || '');
        setEndTime(rec.end_time || '');
        setInputType(rec.input_type === 'voice' ? 'voice' : 'text');
        setContent((c) => ({ ...c,
          title: rec.title || rec.skill_name || c.title,
          category: rec.category || c.category,
          difficulty: rec.difficulty || c.difficulty,
          description: rec.description || c.description,
          hint: rec.hint || c.hint,
          example_answer: rec.example_answer || c.example_answer
        }));
        setPhase('result');
        setIsLoading(false); // 来自历史记录时停止加载指示
      }
      return; // 不再加载新的练习内容
    }
    
    const fetchPracticeContent = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 调用 V1 API 获取技能详情
        const skillsResult = await practiceV1Api.getAvailableSkills();
        const skill = skillsResult.skills.find(s => s.skill_id === id);
        
        if (!skill) {
          throw new Error('技能不存在');
        }
        
        // 调用 V1 API 生成练习内容
        const contentResult = await practiceV1Api.generateContent(id);
        const generatedContent = contentResult.content || {};
        
        // 只有在组件仍然挂载时才更新状态
        if (isMounted.current) {
          setContent({
            category: generatedContent.category || skill.name || "通用",
            difficulty: generatedContent.difficulty || skill.default_params?.difficulty || "入门",
            title: generatedContent.title || `${skill.display_name}练习`,
            description: generatedContent.description || skill.description || "请完成相关练习",
            hint: generatedContent.hint,
            example_answer: generatedContent.example_answer
          });
        }
      } catch (err) {
        // 只有在组件仍然挂载时才更新错误状态
        if (isMounted.current) {
          setError("获取练习内容失败，请稍后重试");
          console.error("Error fetching practice content:", err);
        }
      } finally {
        // 只有在组件仍然挂载时才更新加载状态
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    fetchPracticeContent();
    
    // Cleanup 函数：组件卸载时设置标记
    return () => {
      isMounted.current = false;
    };
  }, [id, location]);

  // 使用后端API进行语音转文字（已注释）
  /*
  const recognizeSpeech = async (audioBlob: Blob): Promise<string> => {
    try {
      const result = await speechApi.transcribeSpeech(audioBlob);
      return result.transcript || '';
    } catch (error) {
      console.error('后端语音转文字失败:', error);
      // 降级处理：使用简单的默认文本
      return '语音识别失败，请重试';
    }
  };
  */

  // 统一评估逻辑
  const evaluateContent = useCallback(async (contentText: string, inputType: 'voice' | 'text') => {
    try {
      // 首先开始练习会话
      const startResult = await practiceV1Api.startPractice(userId, id || 'unknown');
      if (startResult.error) {
        throw new Error(startResult.msg || '开始练习失败');
      }
      
      const sessionId = startResult.data?.session_id;
      if (!sessionId) {
        throw new Error('获取会话ID失败');
      }
      
      // 提交答案进行评估
      const submitResult = await practiceV1Api.submitAnswer(userId, sessionId, contentText);
      if (submitResult.error) {
        throw new Error(submitResult.msg || '提交答案失败');
      }
      
      // 处理评估结果，转换为前端统一格式
      const evaluation = submitResult.data?.evaluation_result || {};
      
      const processedFeedback = {
        score: Math.round((evaluation.score || 0) * 10), // 转换为 0-100 分
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        aiComment: evaluation.ai_comment || evaluation.aiComment || '评估完成'
      };
      
      return processedFeedback;
    } catch (error) {
      console.error('评估失败:', error);
      // 降级处理：返回默认评估结果
      return {
        score: 50,
        strengths: ['尝试完成了练习'],
        improvements: ['评估系统暂时不可用，请稍后重试'],
        aiComment: '评估过程中遇到问题，请稍后重试'
      };
    }
  }, [id, userId]);

  // 语音录制相关函数（已注释）
  /*
  const startRecording = async () => {
    try {
      // 记录开始时间
      setStartTime(new Date().toISOString());
      
      // 获取麦克风权限并开始录音
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 检查浏览器支持的音频格式
      const supportedMimeTypes = [
        'audio/webm',
        'audio/mp3',
        'audio/mpeg',
        'audio/wav'
      ];
      
      let mimeType = 'audio/webm';
      for (const type of supportedMimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      setRecording(mediaRecorder);
      setAudioChunks([]);
      
      // 使用局部变量存储音频块，避免React状态更新的异步问题
      const localAudioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          localAudioChunks.push(event.data);
          // 同时更新React状态，用于UI显示（可选）
          setAudioChunks(prev => [...prev, event.data]);
          console.log('添加音频数据块:', event.data.size, '字节');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('录音停止，收集到的音频块数量:', localAudioChunks.length);
        const audioBlob = new Blob(localAudioChunks, { type: mediaRecorder.mimeType });
        console.log('生成的音频 Blob 大小:', audioBlob.size, '字节');
        console.log('生成的音频 Blob 类型:', audioBlob.type);
        
        // 检查组件是否仍然挂载
        if (!isMounted.current) {
          console.warn('组件已卸载，取消后续操作');
          return;
        }
        
        setEndTime(new Date().toISOString()); // 设置结束时间
        setPhase('analyzing');
        
        try {
          // 上传录音，使用当前的练习 ID
          await speechApi.uploadAudio(audioBlob, id || 'unknown', 'default_user');
          
          // 实现语音转文字
          let recognizedText = '';
          try {
            recognizedText = await recognizeSpeech(audioBlob);
            if (!recognizedText) {
              recognizedText = '未检测到有效语音内容';
            }
          } catch (error) {
            console.error('语音转文字失败:', error);
            recognizedText = '语音识别失败，请手动输入演讲内容';
          }
          
          // 检查组件是否仍然挂载
          if (!isMounted.current) {
            console.warn('组件已卸载，取消后续操作');
            return;
          }
          
          // 更新转文字结果状态
          setTranscript(recognizedText);
          
          // 使用统一的评估逻辑
          const processedFeedback = await evaluateContent(recognizedText, 'voice');
          
          // 检查组件是否仍然挂载
          if (!isMounted.current) {
            console.warn('组件已卸载，取消后续操作');
            return;
          }
          
          setFeedback(processedFeedback);
          const endTimeNow = new Date().toISOString();
          setEndTime(endTimeNow);
          const startTimeNow = startTime || new Date().toISOString();
          setPhase('result');
          
          // 直接传递处理后的反馈和识别文本，避免 state 更新延迟导致未保存
          savePracticeRecord(endTimeNow, startTimeNow, processedFeedback, recognizedText);
        } catch (error) {
          console.error('Failed to evaluate speech:', error);
          // 检查组件是否仍然挂载
          if (isMounted.current) {
            alert('评估失败，请重试');
            setPhase('prep');
          }
        }
      };

      // 开始录音，每100ms产生一个数据块
      mediaRecorder.start(100);
      setPhase('recording');
      console.log('开始录音，使用格式:', mediaRecorder.mimeType);

      // 计时逻辑
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            finishRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const finishRecording = () => {
    if (recording) {
      recording.stop();
    }
  };
  */

  const resetPractice = () => {
    // 语音相关状态重置（已注释）
    // setTimeLeft(30);
    setPhase('prep');
    setFeedback(null);
    setTranscript('');
    setManualText('');
    setInputType('text'); // 重置为默认的文字输入
    setStartTime('');
    setEndTime('');
  };

  // 保存练习记录
  const savePracticeRecord = useCallback(async (overrideEndTime?: string, overrideStartTime?: string, overrideFeedback?: any, overrideTranscript?: string) => {
    // 检查组件是否仍然挂载
    if (!isMounted.current) {
      console.warn('组件已卸载，取消保存操作');
      return;
    }
    
    // 调试日志 - 记录调用上下文
    console.debug('savePracticeRecord called', { overrideEndTime, overrideStartTime, overrideFeedback, overrideTranscript, startTime, endTime, feedback, transcript });

    // 使用传入值 > state > 当前时间 的优先级来保证字段齐全，避免静默返回或 race condition
    const finalEndTime = overrideEndTime || endTime || new Date().toISOString();
    const finalStartTime = overrideStartTime || startTime || new Date().toISOString();
    const finalFeedback = overrideFeedback || feedback;
    const finalTranscript = overrideTranscript !== undefined ? overrideTranscript : transcript;

    // 如果缺少核心数据，记录并返回（避免发送假的空记录）
    if (!finalFeedback || !finalTranscript) {
      console.warn('缺少 feedback 或 transcript，取消保存', { finalFeedback, finalTranscript });
      return;
    }

    try {
      const recordData = {
        user_id: userId,
        skill_id: id || 'unknown',
        skill_name: content.title || '未知技能',
        category: content.category || '通用',
        difficulty: content.difficulty || '入门',
        input_type: inputType,
        transcript: finalTranscript,
        score: finalFeedback.score || 0,
        strengths: finalFeedback.strengths || [],
        improvements: finalFeedback.improvements || [],
        ai_comment: finalFeedback.aiComment || '',
        record_id: undefined as string | undefined,
        start_time: finalStartTime,
        end_time: finalEndTime,
        // 练习题目与参考答案，便于回放
        title: content.title || '',
        description: content.description || '',
        hint: content.hint || '',
        example_answer: content.example_answer || ''
      };

      console.debug('保存练习记录 payload:', recordData);
      const res = await practiceApi.saveRecord(recordData);
      console.info('练习记录保存成功', res);

      // 如果服务端返回 record_id，附加到 recordData 上，便于回放或后续操作
      if (res && res.record_id) {
        recordData.record_id = res.record_id;
      }

      // 派发全局事件，通知其它页面（如 Profile）刷新记录
      try {
        const eventDetail = { recordId: res.record_id, record: recordData };
        window.dispatchEvent(new CustomEvent('practice:record-saved', { detail: eventDetail }));
        console.debug('已派发 practice:record-saved 事件', eventDetail);
        
        // 派发练习完成事件，通知掌握度面板刷新数据
        window.dispatchEvent(new CustomEvent('practice:completed'));
        console.debug('已派发 practice:completed 事件');
      } catch (e) {
        console.warn('无法派发全局事件', e);
      }

    } catch (error) {
      console.error('保存练习记录失败:', error);
    }
  }, [id, userId, content, inputType, startTime, endTime, feedback, transcript]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
          返回首页
        </Link>
        <div className="flex items-center gap-3">
          <button className="p-2 text-muted-foreground hover:bg-secondary rounded-lg" title="反馈问题">
            <Flag size={18} />
          </button>
          <button className="p-2 text-muted-foreground hover:bg-secondary rounded-lg" title="帮助">
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Task Content */}
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-secondary rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <Brain className="absolute inset-0 m-auto text-primary" size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground">正在生成练习内容...</h3>
            <p className="text-muted-foreground mt-2">AI 正在为你准备个性化的练习题目</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-red-500 mb-4">
              <HelpCircle size={48} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">获取练习内容失败</h3>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-full hover:bg-primary/90 transition-colors"
            >
              <RefreshCw size={18} />
              重试
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                {content.category} · 难度: {content.difficulty}
              </span>
              <h1 className="text-3xl font-bold text-foreground mb-4">{content.title}</h1>
              <p 
                className="text-lg text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content.description }}
              />
              
              {/* 提示信息 */}
              {content.hint && (
                <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-yellow-700">💡 提示: {content.hint}</p>
                </div>
              )}
              
              {/* 参考答案功能 */}
              {content.example_answer && (
                <div className="mt-4">
                  <button 
                    onClick={() => setShowExampleAnswer(!showExampleAnswer)}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showExampleAnswer ? (
                        <path d="M6 9l6 6 6-6" />
                      ) : (
                        <path d="M18 15l-6-6-6 6" />
                      )}
                    </svg>
                    {showExampleAnswer ? '收起参考答案' : '查看参考答案'}
                  </button>
                  
                  {showExampleAnswer && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">参考答案：</h4>
                      <p className="text-blue-700 leading-relaxed">{content.example_answer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Area */}
            <div className="mt-8">
              {phase === 'prep' && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-secondary/30">
                  <div className="mb-6 text-center">
                     <p className="text-muted-foreground mb-2">准备好了吗？请选择输入方式。</p>
                     <p className="text-sm text-muted-foreground/70">AI 将从逻辑结构、内容完整性等多维度进行评分。</p>
                  </div>
                  
                  <div className="flex gap-4 mb-8">
                    {/* <button 
                      onClick={() => setInputType('voice')}
                      className={`flex-1 flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all ${inputType === 'voice' ? 'bg-primary text-white shadow-lg' : 'bg-secondary hover:bg-secondary/80'}`}
                    >
                      <div className={`p-3 rounded-full ${inputType === 'voice' ? 'bg-white/20' : 'bg-primary/10'}`}>
                         <Mic size={28} />
                      </div>
                      <span className="font-semibold">语音输入</span>
                      <span className="text-xs text-center opacity-80">30秒录音时间</span>
                    </button> */}
                    
                    <button 
                      onClick={() => setInputType('text')}
                      className={`flex-1 flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all bg-primary text-white shadow-lg`}
                    >
                      <div className={`p-3 rounded-full bg-white/20`}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                           <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                           <line x1="6" y1="1" x2="6" y2="4" />
                           <line x1="10" y1="1" x2="10" y2="4" />
                           <line x1="14" y1="1" x2="14" y2="4" />
                         </svg>
                      </div>
                      <span className="font-semibold">文字输入</span>
                      <span className="text-xs text-center opacity-80">自由输入内容</span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => { const now = new Date().toISOString(); setStartTime(now); setPhase('text-input'); }}
                    className="group flex items-center gap-3 px-8 py-4 bg-primary text-white text-lg font-bold rounded-full shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all"
                  >
                    <div className="p-1 bg-white/20 rounded-full group-hover:animate-pulse">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                           <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                         </svg>
                    </div>
                    进入文字输入
                  </button>
                </div>
              )}

              {/* 语音录制界面（已注释） */}
              {/* 
              {phase === 'recording' && (
                <div className="flex flex-col items-center gap-8">
                  <div className="flex flex-col items-center">
                     <span className="text-5xl font-mono font-bold text-primary tabular-nums">
                       00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                     </span>
                     <span className="text-sm text-red-500 font-medium animate-pulse mt-2">正在录音中...</span>
                  </div>
                  
                  <AudioVisualizer isRecording={true} />
                  
                  <button 
                    onClick={finishRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-destructive text-white font-medium rounded-full hover:bg-destructive/90 transition-colors"
                  >
                    <Square size={18} fill="currentColor" />
                    结束并提交
                  </button>
                </div>
              )}
              */}

              {phase === 'analyzing' && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-secondary rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <Brain className="absolute inset-0 m-auto text-primary" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">AI 正在分析你的表现...</h3>
                  <p className="text-muted-foreground mt-2">正在检测逻辑结构、语速流畅度与情感感染力</p>
                </div>
              )}

              {phase === 'text-input' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3">
                    <label htmlFor="response-text" className="text-lg font-medium text-foreground">
                      请输入你的回答：
                    </label>
                    <textarea
                      id="response-text"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      className="w-full h-48 p-4 border border-border rounded-xl bg-secondary/30 text-foreground placeholder:text-muted-foreground resize-none"
                      placeholder="在这里输入你的回答内容..."
                      rows={8}
                    />
                    <div className="text-right text-sm text-muted-foreground">
                      {manualText.length} 字符
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => setPhase('prep')}
                      className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors"
                    >
                      <ChevronLeft size={18} />
                      返回选择
                    </button>
                    <button 
                      onClick={async () => {
                        setTranscript(manualText);
                        setPhase('analyzing');
                        
                        try {
                          // 记录结束时间（立即保存到本地变量以避免状态更新延迟）
                          const endTimeNow = new Date().toISOString();
                          
                          // 检查组件是否仍然挂载
                          if (!isMounted.current) {
                            console.warn('组件已卸载，取消后续操作');
                            return;
                          }
                          
                          setEndTime(endTimeNow);
                          
                          // 使用统一的评估逻辑
                          const processedFeedback = await evaluateContent(manualText, 'text');
                          
                          // 检查组件是否仍然挂载
                          if (!isMounted.current) {
                            console.warn('组件已卸载，取消后续操作');
                            return;
                          }
                          
                          setFeedback(processedFeedback);
                          const startTimeNow = startTime || new Date().toISOString();
                          setStartTime(startTimeNow);
                          const endTimeNow2 = endTime || new Date().toISOString();
                          setEndTime(endTimeNow2);
                          setPhase('result');
                          
                          // 保存练习记录（传递确定的开始与结束时间并直接传入评估结果和文本）
                          savePracticeRecord(endTimeNow2, startTimeNow, processedFeedback, manualText);
                        } catch (error) {
                          console.error('文本评估失败:', error);
                          // 检查组件是否仍然挂载
                          if (isMounted.current) {
                            alert('评估失败，请重试');
                            setPhase('prep');
                          }
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                      disabled={!manualText.trim()}
                    >
                      提交并获取评估
                    </button>
                  </div>
                </div>
              )}

              {phase === 'result' && feedback && (
                <div className="space-y-8 animate-fade-in-up">
                  {/* 原始输入显示 */}
                  <div className="bg-secondary/50 border border-border rounded-xl p-6">
                    <h3 className="font-semibold text-primary mb-3">原始输入</h3>
                    <p className="text-foreground leading-relaxed">{transcript}</p>
                  </div>
                  
                  <FeedbackPanel 
                    score={feedback.score}
                    strengths={feedback.strengths}
                    improvements={feedback.improvements}
                    aiComment={feedback.aiComment}
                    skillCategory={content.category}
                  />
                  
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={resetPractice}
                      className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors"
                    >
                      <RefreshCw size={18} />
                      再试一次
                    </button>
                    <Link 
                      to="/"
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      <Play size={18} />
                      下一个练习
                    </Link>
                    {/* {import.meta.env.DEV && (
                      <button
                        onClick={() => {
                          const endNow = new Date().toISOString();
                          const startNow = new Date(Date.now() - 30000).toISOString();
                          console.debug('手动触发保存（调试）', { startNow, endNow });
                          savePracticeRecord(endNow, startNow);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg>
                        强制保存(调试)
                      </button>
                    )} */}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PracticeSession;