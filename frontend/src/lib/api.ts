import { PracticeSessionData, Skill, SpeechEvaluationRequest, SpeechEvaluationResult, CodeEvaluationRequest, PracticeContent, AtomicSkill, CustomSkillRequest, OptimizationRequest } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

// 通用请求函数
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// 技能相关API
export const skillsApi = {
  getAllSkills: () => request<{ skills: Skill[] }>('/skills'),
  getSkillDetail: (skillId: string, difficulty: string = '入门') => 
    request<PracticeContent>(`/skills/${skillId}/practice?difficulty=${difficulty}`),
  createCustomSkill: (skillName: string) => 
    request<any>('/skills/custom', { method: 'POST', body: JSON.stringify({ skill_name: skillName }) }),
  deleteSkill: (skillId: string) => 
    request<any>(`/skills/${skillId}`, { method: 'DELETE' }),
};

// 原子技能API
export const atomicApi = {
  getAllAtomicSkills: () => request<{ atomic_skills: AtomicSkill[] }>('/v1/atomic/skills'),
  getUserAtomicSkills: (userId: string) => request<any>(`/v1/atomic/users/${userId}/skills`),
  updateAtomicSkillScore: (userId: string, atomicSkillId: string, score: number) => 
    request<any>(`/v1/atomic/users/${userId}/skills/${atomicSkillId}/score`, { 
      method: 'POST', 
      body: JSON.stringify({ user_id: userId, atomic_skill_id: atomicSkillId, score }) 
    }),
  getAtomicSkillScore: (userId: string, atomicSkillId: string) => 
    request<any>(`/v1/atomic/users/${userId}/skills/${atomicSkillId}/score`),
  getAtomicSkillsForSkill: (skillId: string) => 
    request<any>(`/v1/atomic/skills/${skillId}/mapping`),
  generateOptimizationPlan: (optimizationRequest: OptimizationRequest) => 
    request<any>('/v1/atomic/optimize', { method: 'POST', body: JSON.stringify(optimizationRequest) }),
};

// 演讲评估API
export const speechApi = {
  evaluateSpeech: (data: SpeechEvaluationRequest) => 
    request<SpeechEvaluationResult>('/speech/evaluate', { method: 'POST', body: JSON.stringify(data) }),
  uploadAudio: (audioBlob: Blob, skillId: string, userId: string) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('skill_id', skillId);
    formData.append('user_id', userId);
    
    return fetch(`${API_BASE_URL}/speech/upload`, {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  },
  transcribeSpeech: (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    return fetch(`${API_BASE_URL}/speech/transcribe`, {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  },
};

// 代码评估API
export const codeApi = {
  evaluateCode: (code: string, optimizeType: string) => 
    request<any>('/code/evaluate', { method: 'POST', body: JSON.stringify({ code, optimize_type: optimizeType }) }),
};

// 面试API
export const interviewApi = {
  generateQuestion: (jobType: string) => 
    request<any>('/interview/question', { method: 'POST', body: JSON.stringify({ job_type: jobType }) }),
  evaluateAnswer: (question: string, answer: string, jobType: string) => 
    request<any>('/interview/evaluate', { method: 'POST', body: JSON.stringify({ question, answer, job_type: jobType }) }),
};

// 用户档案API
export const userApi = {
  getProfile: (userId: string) => request<any>(`/user/${userId}/profile`),
  updateSkill: (userId: string, skillName: string, score: number) => 
    request<any>('/user/skill/update', { method: 'POST', body: JSON.stringify({ user_id: userId, skill_name: skillName, score }) }),
};

// 练习记录API
export const practiceApi = {
  saveRecord: (record: any) => 
    request<any>('/practice/record', { method: 'POST', body: JSON.stringify(record) }),
  getRecords: (userId: string) => 
    request<any>(`/practice/records/${userId}`),
  deleteRecord: (recordId: string) => 
    request<any>(`/practice/record/${recordId}`, { method: 'DELETE' }),
};

// V1练习API
export const practiceV1Api = {
  // 开始练习会话
  startPractice: (userId: string, skillId: string, params: Record<string, any> = {}) => 
    request<any>('/v1/practice/start', { 
      method: 'POST', 
      body: JSON.stringify({ user_id: userId, skill_id: skillId, params }) 
    }),
  
  // 提交练习答案
  submitAnswer: (userId: string, sessionId: string, answer: string) => 
    request<any>('/v1/practice/submit', { 
      method: 'POST', 
      body: JSON.stringify({ user_id: userId, session_id: sessionId, answer }) 
    }),
  
  // 生成练习内容
  generateContent: (skillId: string, params: Record<string, any> = {}) => 
    request<any>('/v1/practice/generate', { 
      method: 'POST', 
      body: JSON.stringify({ skill_id: skillId, params }) 
    }),
  
  // 评估练习内容
  evaluateContent: (skillId: string, content: string, reference: string = '', params: Record<string, any> = {}) => 
    request<any>('/v1/practice/evaluate', { 
      method: 'POST', 
      body: JSON.stringify({ skill_id: skillId, content, reference, params }) 
    }),
  
  // 获取练习历史
  getPracticeHistory: (userId: string, skillId?: string) => 
    request<any>(`/v1/practice/history/${userId}${skillId ? `?skill_id=${skillId}` : ''}`),
  
  // 获取技能进度
  getSkillProgress: (userId: string, skillId: string) => 
    request<any>(`/v1/practice/progress/${userId}/${skillId}`),
  
  // 获取所有可用技能
  getAvailableSkills: () => 
    request<{ skills: Skill[] }>('/v1/practice/skills'),
  
  // 创建自定义技能
  createCustomSkill: (skillName: string) => 
    request<any>('/v1/practice/create_custom_skill', { 
      method: 'POST', 
      body: JSON.stringify({ skill_name: skillName }) 
    }),
};

// 知识追踪API
export const knowledgeTracingApi = {
  // 更新掌握度
  updateMastery: (userId: string, atomicSkillId: string, performance: number, timestamp?: string) => 
    request<any>('/v1/knowledge-tracing/update-mastery', { 
      method: 'POST', 
      body: JSON.stringify({ user_id: userId, atomic_skill_id: atomicSkillId, performance, timestamp }) 
    }),
  
  // 获取特定原子技能的掌握度
  getMastery: (userId: string, atomicSkillId: string) => 
    request<any>(`/v1/knowledge-tracing/mastery/${userId}/${atomicSkillId}`),
  
  // 获取所有原子技能的掌握度
  getAllMastery: (userId: string) => 
    request<any>(`/v1/knowledge-tracing/mastery/all/${userId}`),
  
  // 预测表现
  predictPerformance: (userId: string, atomicSkillId: string) => 
    request<any>(`/v1/knowledge-tracing/predict/${userId}/${atomicSkillId}`),
  
  // 获取学习曲线
  getLearningCurve: (userId: string, atomicSkillId: string, days: number = 30) => 
    request<any>(`/v1/knowledge-tracing/learning-curve/${userId}/${atomicSkillId}?days=${days}`),
  
  // 获取技能推荐
  getRecommendations: (userId: string, topN: number = 3) => 
    request<any>(`/v1/knowledge-tracing/recommendations/${userId}?top_n=${topN}`),
};