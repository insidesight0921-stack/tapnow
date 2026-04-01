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
  serverTimestamp
} from 'firebase/firestore';
import { 
  onAuthStateChanged,
  signOut,
  updatePassword as fbUpdatePassword,
  deleteUser
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';

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
  memberId: string;
  memberName: string;
  amount: number;
  method: '카드' | '현금' | '계좌이체' | '기타';
  planName: string;
  date: string;
  status: '완료' | '미납';
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

  markAttendance: (memberId: string) => Promise<void>;
  bulkMarkAttendance: (memberIds: string[]) => Promise<void>;
  deleteAttendance: (attendanceId: string) => Promise<void>;
  addPastAttendance: (memberId: string, dateStr: string) => Promise<void>;

  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePaymentStatus: (id: string, status: '완료' | '미납') => Promise<void>;

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

const getTodayStr = () => new Date().toISOString().split('T')[0];

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
            
            // 전용 구독
            onSnapshot(collection(db, 'gyms'), (snap) => {
              const accounts = snap.docs.map(d => ({ id: d.id, ...d.data() } as GymAccount));
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
            onSnapshot(gymIdQuery('members'), snap => set({ members: snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)) }));
            onSnapshot(gymIdQuery('plans'), snap => set({ plans: snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)) }));
            onSnapshot(gymIdQuery('attendances'), snap => set({ attendances: snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance)) }));
            onSnapshot(gymIdQuery('payments'), snap => set({ payments: snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)) }));
          } else {
            // 문서가 정말 없음 (오류 상황)
            console.error('User records not found in gyms collection.');
            set({ isAuthenticated: false, userRole: null, isLoading: false });
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

  logout: async () => {
    await signOut(auth);
    set({ isAuthenticated: false, userRole: null, gymId: null, gymName: '', adminEmail: null });
  },

  signupGym: () => {
    // LoginPage에서 createUserWithEmailAndPassword 이후 호출됨
  },

  addGymAccount: async (gym) => {
    await addDoc(collection(db, 'gyms'), gym);
  },

  updateGymAccount: async (id, fields) => {
    await updateDoc(doc(db, 'gyms', id), fields);
  },

  deleteGymAccount: async (id) => {
    await deleteDoc(doc(db, 'gyms', id));
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
    const { gymId, gymAccounts, members } = get();
    const currentGym = gymAccounts.find(g => g.id === gymId);
    
    if (currentGym?.plan === 'free' && members.length >= 35) {
      return { success: false, message: '무료 요금제 한도(35명)를 초과했습니다.' };
    }

    await addDoc(collection(db, 'members'), { ...member, gymId });
    return { success: true, message: '회원이 등록되었습니다.' };
  },

  updateMember: async (id, updatedFields) => {
    await updateDoc(doc(db, 'members', id), updatedFields);
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
    await addDoc(collection(db, 'plans'), { ...plan, gymId });
  },

  updatePlan: async (id, updatedFields) => {
    await updateDoc(doc(db, 'plans', id), updatedFields);
  },

  deletePlan: async (id) => {
    await deleteDoc(doc(db, 'plans', id));
  },

  markAttendance: async (memberId) => {
    const { members, attendances, gymId } = get();
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const todayStr = getTodayStr();
    if (attendances.some(a => a.memberId === memberId && a.date === todayStr)) return;

    await addDoc(collection(db, 'attendances'), {
      gymId,
      memberId,
      memberName: member.name,
      date: todayStr,
      timestamp: serverTimestamp()
    });

    const updatedPlans = member.plans.map(p => {
      if (p.type === '횟수권' && p.remainingQty !== undefined && p.remainingQty > 0) {
        return { ...p, remainingQty: p.remainingQty - 1 };
      }
      return p;
    });

    await updateDoc(doc(db, 'members', memberId), { plans: updatedPlans });
  },

  bulkMarkAttendance: async (memberIds) => {
    for (const id of memberIds) {
      await get().markAttendance(id);
    }
  },

  deleteAttendance: async (id) => {
    await deleteDoc(doc(db, 'attendances', id));
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
  },

  addPayment: async (payment) => {
    const { gymId } = get();
    await addDoc(collection(db, 'payments'), { ...payment, gymId });
  },

  updatePaymentStatus: async (id, status) => {
    await updateDoc(doc(db, 'payments', id), { status });
  },

  updateSettings: async (theme, profileImage) => {
    const { gymId } = get();
    if (gymId && gymId !== 'ALL') {
      await updateDoc(doc(db, 'gyms', gymId), { theme, profileImage });
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
