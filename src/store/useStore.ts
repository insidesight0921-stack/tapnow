import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { 
  onAuthStateChanged,
  signOut,
  updatePassword as fbUpdatePassword,
  deleteUser,
  signInWithPopup
} from 'firebase/auth';
import { auth, db, googleProvider } from '../lib/firebase';

// 데이터 모델 타입 정의
export interface Plan {
  id: string;
  name: string;
  price: number;
  months: number;
  type: '횟수권' | '기간권';
  defaultQty?: number;
}

export interface PlanItem {
  id?: string;
  name: string;
  qty: number;
  remainingQty?: number; // 잔여 횟수 (횟수권 전용)
  type?: '횟수권' | '기간권';
}

export interface PlanHistoryItem {
  id: string;
  date: string;
  planName: string;
  amount: number;
  months: number;
  qty?: number; // 횟수권일 경우 횟수
  planType: '횟수권' | '기간권';
  type: '신규' | '연장' | '변경';
}

export interface Member {
  id: string;
  gymId: string;
  name: string;
  phone: string;
  belt: string;
  gral: number;
  registerDate: string;
  startDate: string;
  plans: PlanItem[];
  paymentAmount: number;
  paymentMethod: string;
  expireDate: string;
  memo: string;
  planHistory?: PlanHistoryItem[];
}

export interface Attendance {
  id: string;
  memberId: string;
  memberName: string;
  date: string; // YYYY-MM-DD 형식
}

export interface GymAccount {
  id: string;
  gymName: string;
  ownerEmail: string;
  registeredAt: string;
  memberCount: number;
  plan: 'free' | 'basic' | 'plus';
  planExpireDate: string;
  status: 'active' | 'suspended' | 'trial';
  memo: string;
}

export interface Payment {
  id: string;
  gymId: string;
  memberId?: string;
  memberName?: string;
  amount: number;
  method: '카드' | '현금' | '계좌이체' | '기타' | 'toss';
  planName?: string;
  item?: string;
  date: string;
  status: '완료' | '미납' | 'paid';
}

interface AppData {
  members: Member[];
  plans: Plan[];
  attendances: Attendance[];
  payments: Payment[];
  gymAccounts: GymAccount[];
  
  isAuthenticated: boolean;
  userRole: 'SUPER_ADMIN' | 'GYM_ADMIN' | null;
  gymId: string | null;
  gymName: string;
  adminEmail: string | null;
  gymPin: string;
  theme: 'dark' | 'light';
  profileImage: string | null;
  currentPlan: 'free' | 'basic' | 'plus';
  gymStatus: 'active' | 'suspended' | 'trial';
  planExpireDate: string;
}

interface AppState extends AppData {
  isLoading: boolean;
  
  // Actions
  init: () => () => void;
  
  addGymAccount: (gym: Omit<GymAccount, 'id'>) => Promise<void>;
  updateGymAccount: (id: string, fields: Partial<GymAccount>) => Promise<void>;
  deleteGymAccount: (id: string) => Promise<void>;

  loginAs: (role: 'SUPER_ADMIN' | 'GYM_ADMIN', gymId: string, email: string, gymName: string) => void;
  logout: () => Promise<void>;
  updateEmail: (email: string) => void;
  updatePassword: (password: string) => Promise<void>;
  updatePin: (pin: string) => Promise<void>;
  deleteAccount: () => Promise<void>;

  addMember: (member: Omit<Member, 'id'>) => Promise<{ success: boolean; message: string }>;
  updateMember: (id: string, member: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  
  signupGym: (gymName: string, email: string) => void;

  updateSettings: (theme: 'dark' | 'light', profileImage: string | null) => Promise<void>;

  addPlan: (plan: Omit<Plan, 'id'>) => Promise<void>;
  updatePlan: (id: string, plan: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;

  markAttendance: (memberId: string) => Promise<{ 
    success: boolean; 
    message: string; 
    data?: { 
      memberName: string;
      remainingQty?: number;
      remainingDays?: number;
      isExpired: boolean;
      type: '횟수권' | '기간권' | 'mixed';
    } 
  }>;
  bulkMarkAttendance: (memberIds: string[]) => Promise<{ success: boolean; count: number; total: number; }>;
  bulkDeleteMembers: (memberIds: string[]) => Promise<void>;
  updateMemberHistoryItem: (memberId: string, historyId: string, updated: Partial<PlanHistoryItem>) => Promise<void>;
  recalculateMemberStatus: (memberId: string, manualHistory?: PlanHistoryItem[]) => Promise<void>;
  deleteAttendance: (attendanceId: string) => Promise<void>;
  addPastAttendance: (memberId: string, dateStr: string) => Promise<void>;

  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePaymentStatus: (id: string, status: '완료' | '미납') => Promise<void>;
  updateGymPlan: (plan: GymAccount['plan'], months?: number) => Promise<void>;
  loginWithGoogle: () => Promise<void>;

  editingMember: Member | null;
  isMemberModalOpen: boolean;
  openMemberModal: (member?: Member) => void;
  closeMemberModal: () => void;

  isPlanModalOpen: boolean;
  openPlanModal: () => void;
  closePlanModal: () => void;

  isCsvModalOpen: boolean;
  openCsvModal: () => void;
  closeCsvModal: () => void;
}

const getTodayStr = () => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split('T')[0];
};

const cleanData = (obj: any): any => {
  if (obj === undefined) return null;
  if (Number.isNaN(obj)) return 0;
  
  if (Array.isArray(obj)) {
    return obj
      .filter(v => v !== undefined && !Number.isNaN(v))
      .map(v => cleanData(v));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && !Number.isNaN(value)) {
        const cleaned = cleanData(value);
        if (cleaned !== undefined) {
          newObj[key] = cleaned;
        }
      }
    }
    return newObj;
  }
  
  return obj;
};

export const useStore = create<AppState>((set, get) => ({
  members: [],
  plans: [],
  attendances: [],
  payments: [],
  gymAccounts: [],
  
  isAuthenticated: false,
  userRole: null,
  gymId: null,
  gymName: '',
  adminEmail: null,
  gymPin: '0000',
  theme: 'dark',
  profileImage: null,
  currentPlan: 'free',
  gymStatus: 'trial',
  planExpireDate: '',
  isLoading: true,

  editingMember: null,
  isMemberModalOpen: false,
  isPlanModalOpen: false,
  isCsvModalOpen: false,

  init: () => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const email = user.email?.trim().toLowerCase();
          
          // 1. 슈퍼 관리자 체크
          if (email === 'hjbyun0921@naver.com') {
            set({ 
              isAuthenticated: true, 
              userRole: 'SUPER_ADMIN', 
              gymId: 'ALL', 
              gymName: 'TAPNOW 본사',
              adminEmail: user.email,
              isLoading: false 
            });
            
            // 전용 구독 (본사 관리자 계정은 리스트에서 제외)
            onSnapshot(collection(db, 'gyms'), (snap) => {
              const accounts = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as GymAccount))
                .filter(acc => acc.ownerEmail?.toLowerCase().trim() !== 'hjbyun0921@naver.com');
              set({ gymAccounts: accounts });
            });
            return;
          }

          // 2. 일반 도장 관리자 - 문서 로딩 시도 (최대 3회 재시도, 회원가입 직후 레이턴시 대비)
          let gymDoc = await getDoc(doc(db, 'gyms', user.uid));
          
          if (!gymDoc.exists()) {
            // 회원가입 직후라면 문서 생성 중일 수 있으므로 1초 대기 후 한 번 더 시도
            await new Promise(resolve => setTimeout(resolve, 1000));
            gymDoc = await getDoc(doc(db, 'gyms', user.uid));
          }

          if (gymDoc.exists()) {
            const gymData = gymDoc.data() as Omit<GymAccount, 'id'>;
            set({ 
              isAuthenticated: true, 
              userRole: 'GYM_ADMIN', 
              gymId: user.uid, 
              gymName: gymData.gymName,
              adminEmail: user.email,
              gymPin: (gymData as any).gymPin || '0000',
              theme: (gymData as any).theme || 'dark',
              isLoading: false
            });

            // 데이터 실시간 구독 시작
            const gymIdQuery = (coll: string) => query(collection(db, coll), where('gymId', '==', user.uid));
            onSnapshot(doc(db, 'gyms', user.uid), (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                set({ 
                  gymName: data.gymName,
                  gymPin: data.gymPin || '0000',
                  theme: data.theme || 'dark',
                  profileImage: data.profileImage || null,
                  currentPlan: data.plan || 'free',
                  gymStatus: data.status || 'trial',
                  planExpireDate: data.planExpireDate || ''
                });
              }
            });
            onSnapshot(gymIdQuery('members'), snap => set({ members: snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)) }));
            onSnapshot(gymIdQuery('plans'), snap => set({ plans: snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)) }));
            onSnapshot(gymIdQuery('attendances'), snap => set({ attendances: snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance)) }));
            onSnapshot(gymIdQuery('payments'), snap => set({ payments: snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)) }));
          } else {
            // 문서가 정말 없음 (회원가입 직후 혹은 SNS 로그인 첫 진입)
            if (email !== 'hjbyun0921@naver.com') {
              console.log('No gym record found for this user. Creating default record...');
              const defaultGymName = user.displayName ? `${user.displayName} 도장` : '신규 도장 (수정 필요)';
              
              await setDoc(doc(db, 'gyms', user.uid), {
                gymName: defaultGymName,
                ownerEmail: email,
                registeredAt: new Date().toISOString().split('T')[0],
                memberCount: 0,
                plan: 'free',
                planExpireDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0],
                status: 'trial',
                memo: '구글/SNS 가입',
                gymPin: '0000',
                theme: 'dark'
              });
              // 리스너가 다시 돌면서 처리됨
            } else {
              set({ isAuthenticated: false, userRole: null, isLoading: false });
            }
          }
        } else {
          // 비로그인 상태
          set({ isAuthenticated: false, userRole: null, gymId: null, members: [], attendances: [], isLoading: false });
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        set({ isLoading: false });
      }
    });

    return () => {
      unsubAuth();
    };
  },

  loginAs: (role, gymId, email, gymName) => set({
    isAuthenticated: true, userRole: role, gymId, adminEmail: email, gymName
  }),

  loginWithGoogle: async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Login Error:', err);
      throw err;
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ isAuthenticated: false, userRole: null, gymId: null, gymName: '', adminEmail: null });
  },

  signupGym: () => {
    // LoginPage에서 createUserWithEmailAndPassword 이후 호출됨
  },

  addGymAccount: async (gym) => {
    await addDoc(collection(db, 'gyms'), cleanData(gym));
  },

  updateGymAccount: async (id, fields) => {
    await updateDoc(doc(db, 'gyms', id), fields);

    // 마스터 관리자가 요금제를 free가 아닌 요금제로 승급할 때 자동 채움 로직 적용
    if (fields.plan && fields.plan !== 'free') {
      try {
        const q = query(collection(db, 'pendingMembers'), where('gymId', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const promises = snap.docs.map(async (docSnap) => {
            const data = docSnap.data();
            delete data.createdAt;
            await addDoc(collection(db, 'members'), cleanData({ ...data, gymId: id }));
            await deleteDoc(docSnap.ref);
          });
          await Promise.all(promises);
          console.log(`[마스터 계정 업그레이드] 대기 중이던 회원 ${snap.docs.length}명 정식 등록 완료`);
        }
      } catch (err) {
        console.error('Pending members restore from admin error:', err);
      }
    }
  },

  deleteGymAccount: async (gymId) => {
    try {
      // 1. Vercel API를 통해 Firebase Auth 사용자 삭제
      try {
        const authRes = await fetch('/api/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: gymId }),
        });
        const authResult = await authRes.json();
        console.log(`Auth user deletion result (${gymId}):`, authResult);
      } catch (authError) {
        console.warn('Auth user deletion API call failed (env var may not be set):', authError);
      }

      // 2. 도장 자체 정보 삭제
      await deleteDoc(doc(db, 'gyms', gymId));

      // 3. 연관된 모든 데이터 삭제 (회원, 출석, 요금제, 결제)
      const collections = ['members', 'attendances', 'plans', 'payments'];
      for (const colName of collections) {
        const q = query(collection(db, colName), where('gymId', '==', gymId));
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }

      console.log(`Gym ${gymId} deleted with all associated records.`);
    } catch (error) {
      console.error('Error deleting gym account:', error);
      throw error;
    }
  },

  updateEmail: (email) => set({ adminEmail: email }),
  
  updatePassword: async (password) => {
    if (auth.currentUser) {
      await fbUpdatePassword(auth.currentUser, password);
    }
  },

  updatePin: async (pin) => {
    const { gymId } = get();
    if (gymId && gymId !== 'ALL') {
      await updateDoc(doc(db, 'gyms', gymId), { gymPin: pin });
      set({ gymPin: pin });
    }
  },

  deleteAccount: async () => {
    if (auth.currentUser) {
      const gId = get().gymId;
      if (gId && gId !== 'ALL') {
        await deleteDoc(doc(db, 'gyms', gId));
      }
      await deleteUser(auth.currentUser);
    }
  },

  addMember: async (member) => {
    const { gymId, currentPlan, members } = get();
    
    // 무료 요금제 30명 제한 (사용자 요청에 따라 35명에서 30명으로 하향 조정 및 엄격 차단)
    const gymMembers = members.filter(m => m.gymId === gymId);
    
    if (currentPlan === 'free' && gymMembers.length >= 30) {
      return { success: false, message: '무료 요금제 한도(30명)를 초과했습니다. [플러스] 요금제로 업그레이드하여 인원 제한 없이 이용해 보세요.' };
    }

    try {
      const cleanedMember = cleanData(member);
      await addDoc(collection(db, 'members'), { ...cleanedMember, gymId });
      return { success: true, message: '회원이 성공적으로 등록되었습니다.' };
    } catch (err: any) {
      console.error('Add Member Error:', err);
      // 에러 메시지에 더 상세한 정보 포함 (개발 단계 디버깅 용이)
      const errorMsg = err?.message || '알 수 없는 서버 오류';
      return { success: false, message: `회원 등록 실패: ${errorMsg}` };
    }
  },

  updateMember: async (id, updatedFields) => {
    try {
      const cleanedFields = cleanData(updatedFields);
      await updateDoc(doc(db, 'members', id), cleanedFields);
    } catch (err: any) {
      console.error('Update Member Error:', err);
      throw new Error(`회원 정보 수정 실패: ${err?.message || '알 수 없는 서버 오류'}`);
    }
  },

  deleteMember: async (id) => {
    await deleteDoc(doc(db, 'members', id));
    // 관련 출석 기록도 삭제 (Cloud Function이 이상적이나 여기서는 클라이언트에서 처리)
    const q = query(collection(db, 'attendances'), where('memberId', '==', id));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map((d: any) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  },

  addPlan: async (plan) => {
    const { gymId } = get();
    if (!gymId) throw new Error('로그인 정보가 없습니다.');
    try {
      const cleanedPlan = cleanData(plan);
      await addDoc(collection(db, 'plans'), { 
        ...cleanedPlan, 
        gymId,
        createdAt: serverTimestamp() 
      });
    } catch (err) {
      console.error('Plan add error:', err);
      throw err;
    }
  },

  updatePlan: async (id, updatedFields) => {
    try {
      const cleanedFields = cleanData(updatedFields);
      delete cleanedFields.id; // id 필드 제외
      await updateDoc(doc(db, 'plans', id), cleanedFields);
    } catch (err) {
      console.error('Plan update error:', err);
      throw err;
    }
  },

  deletePlan: async (id) => {
    try {
      await deleteDoc(doc(db, 'plans', id));
    } catch (err) {
      console.error('Plan delete error:', err);
      throw err;
    }
  },

  markAttendance: async (memberId) => {
    const { members, attendances, gymId } = get();
    const member = members.find(m => m.id === memberId);
    if (!member) return { success: false, message: '회원을 찾을 수 없습니다.' };

    const todayStr = getTodayStr();
    if (attendances.some(a => a.memberId === memberId && a.date === todayStr)) {
      return { success: false, message: '이미 출석했습니다.' };
    }

    const isExpired = member.expireDate && new Date(member.expireDate) < new Date();

    let remainingQty: number | undefined = undefined;
    let remainingDays: number | undefined = undefined;
    let attType: '횟수권' | '기간권' | 'mixed' = '기간권';

    const ticketPlans = member.plans.filter(p => p.type === '횟수권');
    const periodPlans = member.plans.filter(p => p.type === '기간권' || !p.type);

    if (ticketPlans.length > 0 && periodPlans.length > 0) attType = 'mixed';
    else if (ticketPlans.length > 0) attType = '횟수권';

    if (ticketPlans.length > 0) {
      remainingQty = ticketPlans.reduce((s, p) => s + (p.remainingQty ?? 0), 0);
    }
    
    if (member.expireDate) {
      const exp = new Date(member.expireDate);
      remainingDays = Math.max(0, Math.ceil((exp.getTime() - new Date().getTime()) / 86400000));
    }

    await addDoc(collection(db, 'attendances'), {
      gymId,
      memberId,
      memberName: member.name,
      date: todayStr,
      timestamp: serverTimestamp()
    });

    const ticketPlanIndices = member.plans
      .map((p, i) => (p.type === '횟수권' ? i : -1))
      .filter(i => i !== -1);

    if (ticketPlanIndices.length > 0) {
      let targetIdx = ticketPlanIndices.find(i => (member.plans[i].remainingQty ?? 0) > 0);
      if (targetIdx === undefined) targetIdx = ticketPlanIndices[0];

      const updatedPlans = [...member.plans];
      const p = updatedPlans[targetIdx];
      const newQty = Math.max(-99, (p.remainingQty ?? 0) - 1);
      updatedPlans[targetIdx] = { ...p, remainingQty: newQty };
      
      // 개별 횟수 차감 후 전체 잔여량 다시 계산 (팝업용)
      remainingQty = updatedPlans
        .filter(up => up.type === '횟수권')
        .reduce((s, up) => s + (up.remainingQty ?? 0), 0);

      const cleanedPlans = cleanData(updatedPlans);
      await updateDoc(doc(db, 'members', memberId), { plans: cleanedPlans });
    }
    
    const isWarning = (attType === '횟수권' && (remainingQty ?? 0) <= 0) || (attType === '기간권' && isExpired);

    return { 
      success: true, 
      message: isWarning ? '잔여 횟수/기간이 만료되었지만 출석 처리되었습니다.' : '출석이 완료되었습니다.',
      data: {
        memberName: member.name,
        remainingQty,
        remainingDays: remainingDays !== undefined ? Math.max(0, remainingDays) : undefined,
        isExpired: !!isExpired,
        type: attType
      }
    };
  },

  bulkMarkAttendance: async (memberIds) => {
    console.log(`[Bulk] Starting attendance for ${memberIds.length} members...`);
    const results = await Promise.all(memberIds.map(id => get().markAttendance(id)));
    const successCount = results.filter(r => r.success).length;
    return {
      success: true,
      count: successCount,
      total: memberIds.length
    };
  },

  bulkDeleteMembers: async (memberIds) => {
    console.log(`[Bulk] Starting deletion for ${memberIds.length} members...`);
    const startTime = Date.now();
    try {
      await Promise.all(memberIds.map(id => get().deleteMember(id)));
      console.log(`[Bulk] Deletion completed in ${Date.now() - startTime}ms`);
    } catch (err) {
      console.error('[Bulk] Deletion failed:', err);
      throw err;
    }
  },

  updateMemberHistoryItem: async (memberId, historyId, updated) => {
    const { members } = get();
    const member = members.find(m => m.id === memberId);
    if (!member || !member.planHistory) return;

    const updatedHistory = member.planHistory.map(h => 
      h.id === historyId ? { ...h, ...updated } : h
    );

    await updateDoc(doc(db, 'members', memberId), { planHistory: updatedHistory });
    // 히스토리 수정 후 주입된 데이터로 즉시 재계산 실행
    await get().recalculateMemberStatus(memberId, updatedHistory);
  },

  recalculateMemberStatus: async (memberId, manualHistory) => {
    const { members, attendances } = get();
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const memberAttendances = attendances.filter(a => a.memberId === memberId);
    const attendanceCount = memberAttendances.length;

    const history = manualHistory || member.planHistory || [];
    let totalMonths = 0;
    let totalQty = 0;
    
    // ... logic remains same but uses fresh history
    const updatedPlans: PlanItem[] = [];
    const ticketHistory = history.filter(h => h.planType === '횟수권');
    const periodHistory = history.filter(h => h.planType === '기간권');

    history.forEach(h => {
      totalMonths += (h.months || 0);
      if (h.planType === '횟수권') {
        totalQty += (h.qty || 0);
      }
    });

    const startDate = new Date(member.startDate || member.registerDate);
    const newExpireDate = new Date(startDate.getFullYear(), startDate.getMonth() + totalMonths, startDate.getDate());
    const remainingQty = Math.max(-99, totalQty - attendanceCount);

    if (totalQty > 0) {
      updatedPlans.push({
        name: ticketHistory[0]?.planName || '횟수권',
        qty: 1,
        type: '횟수권',
        remainingQty: remainingQty
      });
    }
    periodHistory.forEach(h => {
      if (!updatedPlans.find(p => p.name === h.planName)) {
        updatedPlans.push({ name: h.planName, qty: 1, type: '기간권' });
      }
    });

    await updateDoc(doc(db, 'members', memberId), {
      expireDate: newExpireDate.toISOString().split('T')[0],
      plans: updatedPlans
    });
  },

  deleteAttendance: async (id) => {
    try {
      // 1. 삭제할 출석 기록 정보를 먼저 가져옵니다.
      const attDoc = await getDoc(doc(db, 'attendances', id));
      if (attDoc.exists()) {
        const attData = attDoc.data();
        const memberId = attData.memberId;
        
        // 2. 해당 회원의 횟수권 정보를 찾아 복구합니다.
        const member = get().members.find(m => m.id === memberId);
        if (member) {
          const ticketPlanIndex = member.plans.findIndex(p => p.type === '횟수권');
          if (ticketPlanIndex !== -1) {
            const updatedPlans = [...member.plans];
            const p = updatedPlans[ticketPlanIndex];
            // 잔여 횟수를 1 증가시킵니다.
            updatedPlans[ticketPlanIndex] = { ...p, remainingQty: (p.remainingQty ?? 0) + 1 };
            
            const cleanedPlans = cleanData(updatedPlans);
            await updateDoc(doc(db, 'members', memberId), { plans: cleanedPlans });
          }
        }
      }
      
      // 3. 출석 기록을 삭제합니다.
      await deleteDoc(doc(db, 'attendances', id));
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw error;
    }
  },

  addPastAttendance: async (memberId, dateStr) => {
    const { members, gymId } = get();
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;

    await addDoc(collection(db, 'attendances'), {
      gymId,
      memberId,
      memberName: member.name,
      date: dateOnly,
      timestamp: serverTimestamp()
    });

    // 횟수권 차감 로직 추가
    // 횟수권 차감 로직 (하나만 차감)
    const ticketPlanIndices = member.plans
      .map((p, i) => (p.type === '횟수권' ? i : -1))
      .filter(i => i !== -1);

    if (ticketPlanIndices.length > 0) {
      let targetIdx = ticketPlanIndices.find(i => (member.plans[i].remainingQty ?? 0) > 0);
      if (targetIdx === undefined) targetIdx = ticketPlanIndices[0];

      const updatedPlans = [...member.plans];
      const p = updatedPlans[targetIdx];
      updatedPlans[targetIdx] = { ...p, remainingQty: Math.max(-99, (p.remainingQty ?? 0) - 1) };
      const cleanedPlans = cleanData(updatedPlans);
      await updateDoc(doc(db, 'members', memberId), { plans: cleanedPlans });
    }
  },

  addPayment: async (payment) => {
    const { gymId } = get();
    const cleanedPayment = cleanData(payment);
    await addDoc(collection(db, 'payments'), { ...cleanedPayment, gymId });
  },

  updatePaymentStatus: async (id, status) => {
    await updateDoc(doc(db, 'payments', id), { status });
  },

  updateGymPlan: async (plan: GymAccount['plan'], months: number = 1) => {
    const { gymId } = get();
    if (!gymId || gymId === 'ALL') return;

    const today = new Date();
    const expireDate = new Date(today.getFullYear(), today.getMonth() + months, today.getDate()).toISOString().split('T')[0];

    await updateDoc(doc(db, 'gyms', gymId), cleanData({ 
      plan, 
      planExpireDate: expireDate,
      status: 'active' 
    }));
    
    // 결제 내역에도 추가
    await addDoc(collection(db, 'payments'), cleanData({
      gymId,
      amount: plan === 'plus' ? 14900 * months : plan === 'basic' ? 6900 * months : 0,
      item: `${plan.toUpperCase()} 요금제 (${months}개월)`,
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      method: 'toss'
    }));

    // 요금제가 free가 아닐 경우, 백업 대기 중이던 회원들을 정식 추가
    if (plan !== 'free') {
      try {
        const q = query(collection(db, 'pendingMembers'), where('gymId', '==', gymId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const promises = snap.docs.map(async (docSnap) => {
            const data = docSnap.data();
            delete data.createdAt;
            await addDoc(collection(db, 'members'), cleanData({ ...data, gymId }));
            await deleteDoc(docSnap.ref);
          });
          await Promise.all(promises);
          console.log(`[업그레이드] 대기 중이던 회원 ${snap.docs.length}명 정식 등록 완료`);
        }
      } catch (err) {
        console.error('Pending members restore error:', err);
      }
    }
  },

  updateSettings: async (theme, profileImage) => {
    const { gymId } = get();
    if (gymId && gymId !== 'ALL') {
      await updateDoc(doc(db, 'gyms', gymId), cleanData({ theme, profileImage }));
      set({ theme, profileImage });
    }
  },

  openMemberModal: (member) => set({ isMemberModalOpen: true, editingMember: member || null }),
  closeMemberModal: () => set({ isMemberModalOpen: false, editingMember: null }),
  openPlanModal: () => set({ isPlanModalOpen: true }),
  closePlanModal: () => set({ isPlanModalOpen: false }),
  openCsvModal: () => set({ isCsvModalOpen: true }),
  closeCsvModal: () => set({ isCsvModalOpen: false }),
}));
